// Runs once when the Next server boots, before it handles any request.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { Agent, setGlobalDispatcher } = await import("undici");

  // undici keeps an idle pooled socket for up to ~600s. Several carriers close
  // theirs far sooner — att.com.mx and Dialo's API drop an idle connection at
  // around 30s. When the two disagree, undici hands out a socket it believes is
  // alive, writes the request onto a connection the other end already tore down,
  // and waits for a reply that can never arrive. The lookup then burns its whole
  // abort budget and reports a timeout that has nothing to do with the carrier
  // being slow.
  //
  // Evicting idle sockets after 10s keeps us comfortably ahead of the far end,
  // so the pool never serves a dead connection.
  //
  // This sets the *global* dispatcher, which only applies to calls that do not
  // pass their own. The proxied providers hand `undiciFetch` an explicit
  // `dispatcher: ProxyAgent`, so their path is untouched; when
  // RESIDENTIAL_PROXIES is unset and that argument is `undefined`, they fall
  // back here and get the same protection. Telcel's raw `https` request does not
  // go through undici at all.
  setGlobalDispatcher(
    new Agent({
      // A single stale HTTP/2 connection is multiplexed, so it takes down every
      // request riding on it — one dead socket becomes a dozen failures at once.
      // Over HTTP/1.1 each connection fails on its own.
      allowH2: false,
      keepAliveTimeout: 10_000,
      keepAliveMaxTimeout: 10_000,
      // Generous on purpose: this is about not reusing dead sockets, not about
      // cutting slow-but-live handshakes short. The per-provider AbortSignal
      // remains the hard ceiling.
      connect: { timeout: 30_000 },
    }),
  );
}
