/**
 * Input-validation and request-safety helpers shared by the API layer. Kept here
 * (pure, dependency-free) so they are unit-testable and reusable by any consumer.
 */

/** True only for a real calendar date in strict `YYYY-MM-DD` form (rejects 2026-02-30). */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Constant-time string comparison for secrets (API keys). Returns early only on
 * a length mismatch; otherwise compares every byte so timing does not leak how
 * many leading characters matched.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

function isPrivateOrReservedIp(host: string): boolean {
  // IPv6 literal (URL.hostname has already stripped the [brackets]).
  if (host.includes(":")) {
    if (host === "::1" || host === "::") return true;
    if (host.startsWith("fe80")) return true; // link-local
    if (host.startsWith("fc") || host.startsWith("fd")) return true; // unique-local
    if (host.startsWith("::ffff:")) return isPrivateOrReservedIp(host.slice(7));
    return false;
  }

  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false; // not an IP literal → a hostname (resolve-time check needed)

  const octets = m.slice(1).map(Number);
  if (octets.some((n) => n > 255)) return true; // malformed → block
  const [a, b] = octets;

  if (a === 0) return true; // "this" network
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local + cloud metadata 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT (RFC 6598)
  if (a >= 224) return true; // multicast / reserved
  return false;
}

/**
 * SSRF guard for user-supplied callback/webhook URLs. Requires HTTPS and rejects
 * obviously-internal targets (localhost, *.local/.internal, and private/loopback/
 * link-local/reserved IP literals incl. the 169.254.169.254 cloud-metadata IP).
 *
 * Best-effort at registration time: DNS is NOT resolved here, so delivery code
 * MUST re-validate the resolved IP to defend against DNS rebinding.
 */
export function isSafePublicHttpsUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;

  // URL.hostname keeps the [brackets] around IPv6 literals — strip them so the
  // address checks below see a bare "::1" / "fe80::…".
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return false;
  }
  return !isPrivateOrReservedIp(host);
}
