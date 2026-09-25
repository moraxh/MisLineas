export function getResidentialProxyUrl(): string | null {
  const raw = process.env.RESIDENTIAL_PROXIES;
  if (!raw) return null;
  const entries = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (entries.length === 0) return null;
  const entry = entries[Math.floor(Math.random() * entries.length)];
  if (entry.startsWith("http")) return entry;
  if (entry.includes("@")) return `http://${entry}`;
  const [host, port, user, pass] = entry.split(":");
  return `http://${user}:${pass}@${host}:${port}`;
}
