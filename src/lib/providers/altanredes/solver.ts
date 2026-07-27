import crypto from "node:crypto";

type ChallengePair = [string, string];

interface ChallengeInput {
  challenge: {
    c: number;
    s: number;
    d: number;
  };
  token: string;
  expires?: number;
}

interface ChallengeSolution {
  token: string;
  solutions: number[];
}

export function prng(seed: string, length: number): string {
  let state = 2166136261 >>> 0;

  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i);
    state =
      (state +
        ((state << 1) +
          (state << 4) +
          (state << 7) +
          (state << 8) +
          (state << 24))) >>>
      0;
  }

  let result = "";

  while (result.length < length) {
    state ^= state << 13;
    state >>>= 0;

    state ^= state >>> 17;
    state >>>= 0;

    state ^= state << 5;
    state >>>= 0;

    result += state.toString(16).padStart(8, "0");
  }

  return result.substring(0, length);
}

export function generateChallenges(
  token: string,
  c: number,
  s: number,
  d: number,
): ChallengePair[] {
  const challenges: ChallengePair[] = [];

  for (let i = 1; i <= c; i++) {
    const salt = prng(`${token}${i}`, s);
    const target = prng(`${token}${i}d`, d);
    challenges.push([salt, target]);
  }

  return challenges;
}

// Yield to the event loop every this many hashes. Small enough that other
// providers' sockets are serviced promptly, large enough that the setImmediate
// round-trip stays negligible against the hashing itself.
const YIELD_EVERY_HASHES = 4096;

// Upper bound on a single challenge. A difficulty spike should surface as a
// provider-level error, which route.ts already handles, instead of spinning.
const SOLVE_TIME_BUDGET_MS = 30_000;

export async function solveChallenge(
  salt: string,
  target: string,
): Promise<number> {
  let nonce = 0;
  const deadline = Date.now() + SOLVE_TIME_BUDGET_MS;

  while (true) {
    const hash = crypto
      .createHash("sha256")
      .update(salt + nonce)
      .digest("hex");

    if (hash.startsWith(target)) {
      return nonce;
    }

    nonce++;

    // This loop is CPU-bound, and Node runs it on the same thread that services
    // every other provider's I/O. Solved synchronously it holds that thread for
    // as long as the proof-of-work takes, so responses that already arrived from
    // the other carriers sit unread in their socket buffers and their timeouts
    // fire late. The symptom is another provider "timing out" while Altan is the
    // one holding the loop. Handing control back periodically lets that I/O
    // drain between batches of hashes.
    if (nonce % YIELD_EVERY_HASHES === 0) {
      if (Date.now() > deadline) {
        throw new Error("Altan challenge solve exceeded its time budget");
      }

      await new Promise((resolve) => setImmediate(resolve));
    }
  }
}

export async function solveCapChallenge(
  challengeResponse: ChallengeInput,
): Promise<ChallengeSolution> {
  const { challenge, token } = challengeResponse;
  const { c, s, d } = challenge;

  const challenges = generateChallenges(token, c, s, d);

  // Sequential on purpose: each solve yields, so running them one after another
  // keeps the event loop responsive throughout. Solving them concurrently would
  // not help either, since they all contend for the same single thread.
  const solutions: number[] = [];
  for (const [salt, target] of challenges) {
    solutions.push(await solveChallenge(salt, target));
  }

  return { token, solutions };
}
