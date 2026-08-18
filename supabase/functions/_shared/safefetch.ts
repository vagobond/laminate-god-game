// SSRF-resistant fetch for edge functions that retrieve USER-SUPPLIED URLs
// (link-preview). The previous guard was a lexical hostname check that let
// through attacker DNS names resolving to private space, non-canonical IPv4
// forms, most IPv6, and any redirect to an internal target.
//
// This module:
//   * allows only http/https
//   * blocks localhost / *.localhost / *.local / *.internal / cloud metadata
//   * parses IP-literal hosts (the WHATWG URL parser already canonicalises
//     octal/hex/short IPv4 forms) and IPv6 incl. v4-mapped, and rejects any
//     private / loopback / link-local / CGNAT / multicast / reserved range
//   * resolves DNS names (A + AAAA) and rejects if ANY answer is non-public
//     or if there is no answer at all
//   * follows redirects manually (max 3 hops), re-validating every hop
//   * bounds body reads (bytes) and keeps the timeout across the body read
//
// If Deno.resolveDns is unavailable in the runtime it falls back to the
// lexical checks (logged) rather than breaking previews entirely.

const MAX_REDIRECTS = 3;

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

function inCidr4(ip: number, base: string, bits: number): boolean {
  const b = ipv4ToInt(base)!;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return ((ip & mask) >>> 0) === ((b & mask) >>> 0);
}

export function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true; // unparsable → treat as unsafe
  return (
    inCidr4(n, "0.0.0.0", 8) ||        // "this" network
    inCidr4(n, "10.0.0.0", 8) ||       // private
    inCidr4(n, "100.64.0.0", 10) ||    // CGNAT
    inCidr4(n, "127.0.0.0", 8) ||      // loopback
    inCidr4(n, "169.254.0.0", 16) ||   // link-local + cloud metadata
    inCidr4(n, "172.16.0.0", 12) ||    // private
    inCidr4(n, "192.0.0.0", 24) ||     // IETF protocol assignments
    inCidr4(n, "192.0.2.0", 24) ||     // TEST-NET-1
    inCidr4(n, "192.168.0.0", 16) ||   // private
    inCidr4(n, "198.18.0.0", 15) ||    // benchmarking
    inCidr4(n, "198.51.100.0", 24) ||  // TEST-NET-2
    inCidr4(n, "203.0.113.0", 24) ||   // TEST-NET-3
    inCidr4(n, "224.0.0.0", 4) ||      // multicast
    inCidr4(n, "240.0.0.0", 4)         // reserved + broadcast
  );
}

/** Expand an IPv6 textual address to 8 hextets (numbers). Returns null if unparsable. */
function parseIPv6(ip: string): number[] | null {
  let s = ip.trim().replace(/^\[|\]$/g, "");
  const zone = s.indexOf("%");
  if (zone !== -1) s = s.slice(0, zone);
  // v4-mapped / v4-embedded tail: rewrite "a.b.c.d" as two hextets, then parse normally
  const lastColon = s.lastIndexOf(":");
  if (lastColon !== -1 && s.slice(lastColon + 1).includes(".")) {
    const v4 = ipv4ToInt(s.slice(lastColon + 1));
    if (v4 === null) return null;
    s = s.slice(0, lastColon + 1) + ((v4 >>> 16) & 0xffff).toString(16) + ":" + (v4 & 0xffff).toString(16);
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const parseHalf = (h: string) => (h === "" ? [] : h.split(":").map((x) => {
    if (!/^[0-9a-f]{1,4}$/i.test(x)) throw new Error("bad hextet");
    return parseInt(x, 16);
  }));
  let out: number[];
  try {
    if (halves.length === 2) {
      const a = parseHalf(halves[0]);
      const b = parseHalf(halves[1]);
      const fill = 8 - a.length - b.length;
      if (fill < 0) return null;
      out = [...a, ...new Array(fill).fill(0), ...b];
    } else {
      out = parseHalf(halves[0]);
    }
  } catch {
    return null;
  }
  return out.length === 8 ? out : null;
}

export function isPrivateIPv6(ip: string): boolean {
  const h = parseIPv6(ip);
  if (!h) return true;
  const allZero = h.every((x) => x === 0);
  if (allZero) return true;                                   // ::
  if (h.slice(0, 7).every((x) => x === 0) && h[7] === 1) return true; // ::1
  // ::ffff:a.b.c.d (v4-mapped) and ::a.b.c.d (v4-compatible)
  if (h.slice(0, 5).every((x) => x === 0) && (h[5] === 0xffff || h[5] === 0)) {
    const v4 = `${h[6] >> 8}.${h[6] & 0xff}.${h[7] >> 8}.${h[7] & 0xff}`;
    return isPrivateIPv4(v4);
  }
  if (h[0] === 0x64 && h[1] === 0xff9b) {                     // 64:ff9b::/96 NAT64
    const v4 = `${h[6] >> 8}.${h[6] & 0xff}.${h[7] >> 8}.${h[7] & 0xff}`;
    return isPrivateIPv4(v4);
  }
  if ((h[0] & 0xfe00) === 0xfc00) return true;                // fc00::/7 ULA
  if ((h[0] & 0xffc0) === 0xfe80) return true;                // fe80::/10 link-local
  if ((h[0] & 0xff00) === 0xff00) return true;                // ff00::/8 multicast
  if (h[0] === 0x2001 && h[1] === 0x0db8) return true;        // 2001:db8::/32 documentation
  return false;
}

export function isPrivateIp(ip: string): boolean {
  return ip.includes(":") ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".arpa"];
const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
  "instance-data", // AWS
]);

let dnsSupported: boolean | null = null;

async function resolveAll(host: string): Promise<string[] | null> {
  // deno-lint-ignore no-explicit-any
  const d = (globalThis as any).Deno;
  if (dnsSupported === false || typeof d?.resolveDns !== "function") return null;
  const out: string[] = [];
  for (const type of ["A", "AAAA"] as const) {
    try {
      const recs = (await d.resolveDns(host, type)) as string[];
      out.push(...recs);
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      // Unsupported in this runtime → remember and fall back to lexical checks.
      if (/not supported|NotSupported|PermissionDenied|not implemented/i.test(msg)) {
        dnsSupported = false;
        console.warn("safefetch: Deno.resolveDns unavailable, falling back to lexical checks:", msg);
        return null;
      }
      // NXDOMAIN / no records of this type → just no results for this type.
    }
  }
  dnsSupported = true;
  return out;
}

/**
 * Throws if the URL must not be fetched. Resolves DNS names.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("blocked: invalid url");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("blocked: scheme");
  if (u.username || u.password) throw new Error("blocked: credentials in url");
  const host = u.hostname.toLowerCase();
  if (!host) throw new Error("blocked: empty host");
  if (BLOCKED_HOSTS.has(host)) throw new Error("blocked: host");
  if (BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) throw new Error("blocked: host suffix");

  // IP literal? (URL parser has already canonicalised IPv4 forms; IPv6 keeps brackets)
  if (host.startsWith("[")) {
    if (isPrivateIPv6(host)) throw new Error("blocked: private ipv6");
    return u;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (isPrivateIPv4(host)) throw new Error("blocked: private ipv4");
    return u;
  }
  if (!host.includes(".")) throw new Error("blocked: bare hostname"); // kong, db, etc.

  const addrs = await resolveAll(host);
  if (addrs === null) return u; // DNS unavailable → lexical checks only
  if (addrs.length === 0) throw new Error("blocked: unresolvable host");
  for (const a of addrs) {
    if (isPrivateIp(a)) throw new Error(`blocked: ${host} resolves to private address`);
  }
  return u;
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
  maxRedirects?: number;
}

/**
 * fetch() with every hop validated by assertPublicUrl. Redirects are followed
 * manually so a public URL cannot bounce us into private space. The returned
 * Response's body has NOT been read; use readTextLimited / readJsonLimited.
 * The AbortController is returned so callers can keep the deadline live while
 * they read the body.
 */
export async function safeFetch(
  url: string,
  { timeoutMs = 4000, headers = {}, maxRedirects = MAX_REDIRECTS }: SafeFetchOptions = {},
): Promise<{ res: Response; finalUrl: string; controller: AbortController; timer: ReturnType<typeof setTimeout> }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let current = url;
  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const u = await assertPublicUrl(current);
      const res = await fetch(u.toString(), {
        headers,
        redirect: "manual",
        signal: controller.signal,
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        // drain to free the connection
        try { await res.body?.cancel(); } catch { /* ignore */ }
        if (!loc || hop === maxRedirects) throw new Error("blocked: too many redirects / no location");
        current = new URL(loc, u).toString();
        continue;
      }
      return { res, finalUrl: current, controller, timer };
    }
    throw new Error("blocked: redirect loop");
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function readLimited(res: Response, maxBytes: number): Promise<{ text: string; truncated: boolean }> {
  const reader = res.body?.getReader();
  if (!reader) return { text: "", truncated: false };
  const decoder = new TextDecoder();
  let out = "";
  let total = 0;
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    out += decoder.decode(value, { stream: true });
    if (total >= maxBytes) { truncated = true; break; }
  }
  try { await reader.cancel(); } catch { /* ignore */ }
  return { text: out, truncated };
}

/** Read at most maxBytes of a Response body as text (truncates silently). */
export async function readTextLimited(res: Response, maxBytes: number): Promise<string> {
  return (await readLimited(res, maxBytes)).text;
}

/** Parse JSON from a bounded body read; throws if the body exceeds the cap or is invalid. */
export async function readJsonLimited(res: Response, maxBytes: number): Promise<unknown> {
  const { text, truncated } = await readLimited(res, maxBytes);
  if (truncated) throw new Error("response too large");
  return JSON.parse(text);
}
