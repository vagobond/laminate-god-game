// Embeddable public profile card.
//
// Serves a tiny self-contained HTML card (inline CSS, no JS, no fonts) meant
// to be iframed on other sites: <iframe src="https://xcrol.com/embed/<username>">.
// The Cloudflare Worker proxies /embed/* here with cacheEverything, so at
// scale repeated loads are served from Cloudflare's edge cache and Supabase
// only sees cache misses. Same public-safe field set as og-profile — no new
// data exposure.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit } from "../_shared/ratelimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE_HEADERS = {
  ...corsHeaders,
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await enforceRateLimit(req, "embed-profile", { limit: 30 }, corsHeaders);
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const userId = url.searchParams.get("userId");

    if (!username && !userId) {
      return notFoundCard();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const query = supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, bio, hometown_city, hometown_country");
    const { data: profile, error } = username
      ? await query.eq("username", username).maybeSingle()
      : await query.eq("id", userId).maybeSingle();

    if (error || !profile) {
      if (error) console.error("Error fetching profile:", error);
      return notFoundCard();
    }

    const displayName = profile.display_name || profile.username || "XCROL User";
    const usernameDisplay = profile.username ? `@${profile.username}` : "";
    const location = [profile.hometown_city, profile.hometown_country].filter(Boolean).join(", ");
    let bio = profile.bio || "";
    if (bio.length > 120) bio = bio.substring(0, 117) + "...";

    const profilePath = profile.username ? `@${profile.username}` : `u/${profile.id}`;
    const profileUrl = `https://xcrol.com/${profilePath}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>${escapeHtml(displayName)} on XCROL</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #e2e8f0;
    padding: 16px;
    display: flex;
    align-items: center;
  }
  a { color: inherit; text-decoration: none; }
  .card { display: flex; gap: 14px; align-items: center; width: 100%; }
  .avatar {
    width: 64px; height: 64px; border-radius: 50%; object-fit: cover;
    border: 2px solid rgba(99, 102, 241, 0.6); flex-shrink: 0;
    background: #1e293b;
  }
  .info { min-width: 0; }
  h1 { font-size: 1.05rem; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .username { font-size: 0.8rem; color: #94a3b8; }
  .bio { font-size: 0.78rem; color: #cbd5e1; line-height: 1.4; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .location { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; }
  .cta {
    font-size: 0.72rem; color: #818cf8; margin-top: 6px; display: inline-block;
  }
  .cta:hover { text-decoration: underline; }
</style>
</head>
<body>
<a class="card" href="${escapeHtml(profileUrl)}" target="_top" rel="noopener">
  ${profile.avatar_url ? `<img class="avatar" src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(displayName)}">` : `<div class="avatar"></div>`}
  <div class="info">
    <h1>${escapeHtml(displayName)}</h1>
    ${usernameDisplay ? `<div class="username">${escapeHtml(usernameDisplay)}</div>` : ""}
    ${bio ? `<div class="bio">${escapeHtml(bio)}</div>` : ""}
    ${location ? `<div class="location">${escapeHtml(location)}</div>` : ""}
    <span class="cta">View on XCROL &rarr;</span>
  </div>
</a>
</body>
</html>`;

    return new Response(html, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("Error generating embed card:", error);
    return notFoundCard();
  }
});

// Graceful card for unknown users / bad input. Cached like the real card so
// probing unknown usernames doesn't bypass the CDN.
function notFoundCard() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex">
<title>XCROL</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f172a; color: #94a3b8; display: flex; align-items: center;
    justify-content: center; height: 100vh; margin: 0; font-size: 0.85rem; }
  a { color: #818cf8; text-decoration: none; }
</style>
</head>
<body>
<p>Profile not found &middot; <a href="https://xcrol.com" target="_top" rel="noopener">XCROL</a></p>
</body>
</html>`;
  return new Response(html, { headers: CACHE_HEADERS });
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
