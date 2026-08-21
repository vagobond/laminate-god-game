// Profile card as an IMAGE (PNG, or SVG on request).
//
// Why: the iframe embed (/embed/<user>) is stripped by WordPress.com, most
// blog platforms and every social network, so it was only usable on sites
// you fully control. An <img> survives everywhere — WordPress, Substack,
// Medium, GitHub READMEs, forums, email — and the same PNG doubles as the
// og:image for xcrol.com/@user links, so profile links unfurl as a real card
// on Facebook / X / LinkedIn / Bluesky / Slack / Discord.
//
// Routes (via the Cloudflare Worker, cached at the edge):
//   https://xcrol.com/card/<username>.png            1200×630 (social size)
//   https://xcrol.com/card/<username>.png?size=badge 1200×300 (blog badge, show at 600×150)
//   https://xcrol.com/card/<username>.svg            same, vector
//
// Same public-safe field set as og-profile / embed-profile — no new data
// exposure. Rendering: hand-built SVG → resvg (wasm) → PNG, with Noto Sans
// bundled as static files (no runtime font dependency). Cold start ≈ 300 ms
// (wasm init + fonts), warm render ≈ 200 ms incl. a 1 MB avatar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initWasm, Resvg } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";
import { enforceRateLimit } from "../_shared/ratelimit.ts";
import { safeFetch } from "../_shared/safefetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE = "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400";
const NOT_FOUND_CACHE = "public, max-age=300, s-maxage=300";

// ── one-time init (per isolate) ─────────────────────────────────────────
let ready: Promise<{ regular: Uint8Array; bold: Uint8Array }> | null = null;
function init() {
  if (!ready) {
    ready = (async () => {
      const [wasm, regular, bold] = await Promise.all([
        fetch("https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm"),
        Deno.readFile(new URL("./fonts/NotoSans-Regular.ttf", import.meta.url)),
        Deno.readFile(new URL("./fonts/NotoSans-Bold.ttf", import.meta.url)),
      ]);
      await initWasm(wasm);
      return { regular, bold };
    })();
    ready.catch(() => { ready = null; }); // allow retry on a failed cold start
  }
  return ready;
}

// ── helpers ─────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Noto Sans (Latin/Greek/Cyrillic) is what we bundle. Strip characters it
// cannot draw (emoji, most CJK) rather than rendering tofu boxes.
function drawable(s: string): string {
  return s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2300}-\u{23FF}]/gu, "")
    .replace(/[\u{3000}-\u{9FFF}\u{AC00}-\u{D7AF}\u{F900}-\u{FAFF}\u{FF00}-\u{FFEF}]/gu, "")
    .replace(/\s+/g, " ").trim();
}

// Approximate text width for Noto Sans (avg advance ≈ 0.53 em; bold ≈ 0.57).
function textWidth(s: string, size: number, bold = false): number {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    let a = 0.53;
    if (/[iljtfI.,:;'!|]/.test(ch)) a = 0.28;
    else if (/[mwMW@]/.test(ch)) a = 0.85;
    else if (c >= 0x41 && c <= 0x5a) a = 0.66; // uppercase
    else if (ch === " ") a = 0.26;
    w += a * size * (bold ? 1.06 : 1);
  }
  return w;
}

function fit(s: string, size: number, maxWidth: number, bold = false): string {
  if (textWidth(s, size, bold) <= maxWidth) return s;
  let out = s;
  while (out.length > 1 && textWidth(out + "…", size, bold) > maxWidth) out = out.slice(0, -1);
  return out.trimEnd() + "…";
}

function wrap(s: string, size: number, maxWidth: number, maxLines: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (textWidth(test, size) <= maxWidth) { cur = test; continue; }
    if (cur) lines.push(cur);
    cur = w;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length > maxLines) lines.length = maxLines;
  // If we ran out of lines, ellipsise the last one.
  const used = lines.join(" ");
  if (used.length < s.length && lines.length) lines[lines.length - 1] = fit(lines[lines.length - 1] + "…", size, maxWidth);
  return lines;
}

function b64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(s);
}

async function fetchAvatarDataUri(url: string | null): Promise<string | null> {
  // avatar_url is user-controlled (profiles are self-writable), so this is a
  // server-side fetch of an attacker-suppliable URL. Route it through the same
  // SSRF guard as link-preview (2026-08-21 audit, item 2): scheme/host/IP
  // checks, DNS resolution, and per-hop redirect re-validation.
  if (!url || !/^https:\/\//.test(url)) return null;
  try {
    const { res, timer } = await safeFetch(url, { timeoutMs: 3000 });
    try {
      if (!res.ok) return null;
      const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
      if (!/^image\/(png|jpeg|jpg|gif|webp)$/.test(ct)) return null;
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.length > 4 * 1024 * 1024) return null; // resvg would still cope, but keep CPU bounded
      return `data:${ct};base64,${b64(buf)}`;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

// ── SVG templates ───────────────────────────────────────────────────────
interface CardData {
  displayName: string;
  username: string; // "@cd" or ""
  bio: string;
  location: string;
  avatar: string | null; // data URI
  link: string; // "xcrol.com/@cd"
}

const FONT = `font-family="Noto Sans"`;

function svgOg(d: CardData): string {
  const W = 1200, H = 630;
  const name = fit(d.displayName, 64, 700, true);
  const bioLines = wrap(d.bio, 30, 700, 3);
  const bioY = 380;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#1e293b"/></linearGradient>
  <clipPath id="c"><circle cx="230" cy="300" r="130"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<circle cx="230" cy="300" r="136" fill="#1e293b" stroke="#6366f1" stroke-width="6"/>
${d.avatar ? `<image href="${d.avatar}" x="100" y="170" width="260" height="260" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)"/>` : `<text x="230" y="322" ${FONT} font-weight="700" font-size="84" fill="#64748b" text-anchor="middle">${esc(d.displayName.slice(0, 1).toUpperCase())}</text>`}
<text x="420" y="262" ${FONT} font-weight="700" font-size="64" fill="#f8fafc">${esc(name)}</text>
${d.username ? `<text x="420" y="312" ${FONT} font-size="32" fill="#94a3b8">${esc(d.username)}</text>` : ""}
${bioLines.map((l, i) => `<text x="420" y="${bioY + i * 42}" ${FONT} font-size="30" fill="#cbd5e1">${esc(l)}</text>`).join("\n")}
${d.location ? `<text x="420" y="${bioY + bioLines.length * 42 + 8}" ${FONT} font-size="26" fill="#94a3b8">${esc(fit(d.location, 26, 700))}</text>` : ""}
<text x="420" y="572" ${FONT} font-weight="700" font-size="30" fill="#818cf8">${esc(d.link)}</text>
<text x="${W - 60}" y="572" ${FONT} font-weight="700" font-size="30" fill="#475569" text-anchor="end" letter-spacing="4">XCROL</text>
</svg>`;
}

function svgBadge(d: CardData): string {
  const W = 1200, H = 300;
  const name = fit(d.displayName, 52, 720, true);
  const bioLines = wrap(d.bio, 26, 720, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#1e293b"/></linearGradient>
  <clipPath id="c"><circle cx="150" cy="150" r="96"/></clipPath>
  <clipPath id="r"><rect width="${W}" height="${H}" rx="28"/></clipPath>
</defs>
<g clip-path="url(#r)">
<rect width="${W}" height="${H}" fill="url(#g)"/>
<circle cx="150" cy="150" r="101" fill="#1e293b" stroke="#6366f1" stroke-width="5"/>
${d.avatar ? `<image href="${d.avatar}" x="54" y="54" width="192" height="192" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)"/>` : `<text x="150" y="172" ${FONT} font-weight="700" font-size="64" fill="#64748b" text-anchor="middle">${esc(d.displayName.slice(0, 1).toUpperCase())}</text>`}
<text x="300" y="118" ${FONT} font-weight="700" font-size="52" fill="#f8fafc">${esc(name)}</text>
${d.username ? `<text x="${300 + textWidth(name, 52, true) + 22}" y="118" ${FONT} font-size="30" fill="#94a3b8">${esc(d.username)}</text>` : ""}
${bioLines.map((l, i) => `<text x="300" y="${170 + i * 36}" ${FONT} font-size="26" fill="#cbd5e1">${esc(l)}</text>`).join("\n")}
<text x="300" y="262" ${FONT} font-weight="700" font-size="24" fill="#818cf8">${esc(d.link)}</text>
<text x="${W - 48}" y="262" ${FONT} font-weight="700" font-size="24" fill="#475569" text-anchor="end" letter-spacing="3">XCROL</text>
</g>
</svg>`;
}

function svgNotFound(size: "og" | "badge"): string {
  const W = 1200, H = size === "og" ? 630 : 300;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#0f172a"/>
<text x="${W / 2}" y="${H / 2 + 12}" ${FONT} font-size="34" fill="#94a3b8" text-anchor="middle">Profile not found · xcrol.com</text>
</svg>`;
}

// ── handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const limited = await enforceRateLimit(req, "profile-card", { limit: 30 }, corsHeaders);
  if (limited) return limited;

  const url = new URL(req.url);
  const username = url.searchParams.get("username");
  const userId = url.searchParams.get("userId");
  const size: "og" | "badge" = url.searchParams.get("size") === "badge" ? "badge" : "og";
  const format: "png" | "svg" = url.searchParams.get("format") === "svg" ? "svg" : "png";

  const respond = async (svg: string, cache: string): Promise<Response> => {
    if (format === "svg") {
      return new Response(svg, {
        headers: { ...corsHeaders, "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": cache },
      });
    }
    const fonts = await init();
    const r = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: { fontBuffers: [fonts.regular, fonts.bold], loadSystemFonts: false, defaultFontFamily: "Noto Sans" },
    });
    const png = r.render().asPng();
    return new Response(png as unknown as BodyInit, {
      headers: { ...corsHeaders, "Content-Type": "image/png", "Cache-Control": cache },
    });
  };

  try {
    if (!username && !userId) return respond(svgNotFound(size), NOT_FOUND_CACHE);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const query = supabase.from("profiles").select("id, display_name, username, avatar_url, bio, hometown_city, hometown_country");
    const { data: profile, error } = username
      ? await query.eq("username", username.toLowerCase()).maybeSingle()
      : await query.eq("id", userId).maybeSingle();
    if (error || !profile) {
      if (error) console.error("profile-card lookup:", error);
      return respond(svgNotFound(size), NOT_FOUND_CACHE);
    }

    const displayName = drawable(profile.display_name || profile.username || "XCROL User") || "XCROL User";
    const data: CardData = {
      displayName,
      username: profile.username ? `@${profile.username}` : "",
      bio: drawable(profile.bio || ""),
      location: [profile.hometown_city, profile.hometown_country].map((x) => drawable(x || "")).filter(Boolean).join(", "),
      avatar: await fetchAvatarDataUri(profile.avatar_url),
      link: profile.username ? `xcrol.com/@${profile.username}` : `xcrol.com/u/${profile.id.slice(0, 8)}…`,
    };
    return respond(size === "badge" ? svgBadge(data) : svgOg(data), CACHE);
  } catch (e) {
    console.error("profile-card render:", e);
    // Last resort: SVG needs no wasm/fonts, so it can't fail the same way.
    return new Response(svgNotFound(size), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
});
