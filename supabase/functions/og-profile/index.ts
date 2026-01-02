import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const userId = url.searchParams.get("userId");

    if (!username && !userId) {
      return new Response("Missing username or userId", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let profile;

    if (username) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, bio")
        .eq("username", username)
        .maybeSingle();

      if (error || !data) {
        return generateFallbackHtml();
      }
      profile = data;
    } else {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, bio")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        return generateFallbackHtml();
      }
      profile = data;
    }

    const displayName = profile.display_name || profile.username || "XCROL User";
    const bio = profile.bio || "Check out my profile on XCROL";
    const avatarUrl = profile.avatar_url || "https://lovable.dev/opengraph-image-p98pqg.png";
    const profilePath = profile.username ? `/@${profile.username}` : `/u/${profile.id}`;
    const siteUrl = Deno.env.get("SITE_URL") || "https://xcrol.com";
    const canonicalUrl = `${siteUrl}${profilePath}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(displayName)} - XCROL</title>
  <meta name="description" content="${escapeHtml(bio.slice(0, 160))}">
  
  <meta property="og:title" content="${escapeHtml(displayName)} - XCROL">
  <meta property="og:description" content="${escapeHtml(bio.slice(0, 160))}">
  <meta property="og:image" content="${escapeHtml(avatarUrl)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="profile">
  
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(displayName)} - XCROL">
  <meta name="twitter:description" content="${escapeHtml(bio.slice(0, 160))}">
  <meta name="twitter:image" content="${escapeHtml(avatarUrl)}">
  
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}">
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(canonicalUrl)}">${escapeHtml(displayName)}'s profile</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating OG profile:", error);
    return generateFallbackHtml();
  }
});

function generateFallbackHtml() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>XCROL - Take Control of Your Own Networks</title>
  <meta property="og:title" content="XCROL - Take Control of Your Own Networks">
  <meta property="og:description" content="Build connections, shape your world, and own your digital presence.">
  <meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png">
  <meta http-equiv="refresh" content="0;url=/">
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
