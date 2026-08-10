import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit } from "../_shared/ratelimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fallback() {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>XCROL Hearth Surf</title>
<meta http-equiv="refresh" content="0;url=https://xcrol.com/hearthsurf"></head>
<body><p>Redirecting to <a href="https://xcrol.com/hearthsurf">XCROL Hearth Surf</a>…</p></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const limited = await enforceRateLimit(req, "og-host", { limit: 30 }, corsHeaders);
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const usernameParam = url.searchParams.get("username");
    if (!usernameParam) return fallback();
    const handle = usernameParam.startsWith("@") ? usernameParam.slice(1) : usernameParam;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, bio, hometown_city, hometown_country")
      .eq("username", handle)
      .maybeSingle();
    if (!profile) return fallback();

    const { data: prefs } = await supabase
      .from("hosting_preferences")
      .select("is_open_to_hosting, is_hosting_paused, hosting_description, accommodation_type, max_guests")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!prefs || !prefs.is_open_to_hosting || prefs.is_hosting_paused) return fallback();

    const displayName = profile.display_name || (profile.username ? `@${profile.username}` : "Host");
    const location = [profile.hometown_city, profile.hometown_country].filter(Boolean).join(", ");
    const title = `Stay with ${displayName} on XCROL Hearth Surf`;
    let description =
      prefs.hosting_description ||
      `${displayName} hosts travelers on XCROL.${location ? ` Based in ${location}.` : ""}`;
    if (description.length > 155) description = description.slice(0, 152) + "...";

    const canonical = `https://xcrol.com/host/${profile.username || profile.id}`;
    const image = profile.avatar_url || "https://xcrol.com/placeholder.svg";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:site_name" content="XCROL">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonical)}">
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(canonical)}">${escapeHtml(displayName)} on XCROL</a>…</p>
</body>
</html>`;
    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    console.error("og-host error", e);
    return fallback();
  }
});
