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
      console.log("No username or userId provided");
      return generateFallbackHtml();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let profile;

    if (username) {
      console.log("Looking up by username:", username);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, bio, hometown_city, hometown_country")
        .eq("username", username)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return generateFallbackHtml();
      }
      profile = data;
    } else {
      console.log("Looking up by userId:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, bio, hometown_city, hometown_country")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return generateFallbackHtml();
      }
      profile = data;
    }

    if (!profile) {
      console.log("Profile not found");
      return generateFallbackHtml();
    }

    console.log("Found profile:", profile.display_name || profile.username);

    const displayName = profile.display_name || profile.username || "XCROL User";
    const usernameDisplay = profile.username ? `@${profile.username}` : "";
    
    // Create a rich description
    let description = profile.bio || "Connect with me on XCROL";
    const location = [profile.hometown_city, profile.hometown_country].filter(Boolean).join(", ");
    if (location && description.length < 120) {
      description = `${description}${description.endsWith('.') ? '' : '.'} Based in ${location}.`;
    }
    if (description.length > 155) {
      description = description.substring(0, 152) + "...";
    }

    // Use a proper OG image - avatar or a default branded image
    const avatarUrl = profile.avatar_url || "https://xcrol.com/placeholder.svg";
    
    // Build canonical URL
    const profilePath = profile.username ? `@${profile.username}` : `u/${profile.id}`;
    const siteUrl = "https://xcrol.com";
    const canonicalUrl = `${siteUrl}/${profilePath}`;

    // Generate title with username if available
    const title = usernameDisplay 
      ? `${escapeHtml(displayName)} (${escapeHtml(usernameDisplay)}) on XCROL`
      : `${escapeHtml(displayName)} on XCROL`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(avatarUrl)}">
  <meta property="og:image:width" content="400">
  <meta property="og:image:height" content="400">
  <meta property="og:site_name" content="XCROL">
  ${usernameDisplay ? `<meta property="profile:username" content="${escapeHtml(usernameDisplay)}">` : ""}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(avatarUrl)}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  
  <!-- Redirect to actual profile -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}">
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      color: #e2e8f0;
    }
    .card {
      text-align: center;
      padding: 2.5rem;
      background: rgba(30, 41, 59, 0.8);
      border-radius: 1.5rem;
      border: 1px solid rgba(148, 163, 184, 0.2);
      backdrop-filter: blur(16px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      max-width: 320px;
    }
    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 1.25rem;
      border: 3px solid rgba(99, 102, 241, 0.6);
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
    }
    h1 { 
      font-size: 1.5rem; 
      font-weight: 700;
      margin-bottom: 0.25rem;
      color: #f8fafc;
    }
    .username {
      font-size: 0.95rem;
      color: #94a3b8;
      margin-bottom: 0.75rem;
    }
    .bio {
      font-size: 0.875rem;
      color: #cbd5e1;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    .redirect {
      font-size: 0.8rem;
      color: #64748b;
    }
    a { 
      color: #818cf8; 
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(displayName)}" class="avatar" onerror="this.style.display='none'">
    <h1>${escapeHtml(displayName)}</h1>
    ${usernameDisplay ? `<p class="username">${escapeHtml(usernameDisplay)}</p>` : ""}
    ${location ? `<p class="bio">📍 ${escapeHtml(location)}</p>` : ""}
    <p class="redirect">Redirecting to <a href="${escapeHtml(canonicalUrl)}">XCROL</a>...</p>
  </div>
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
  <title>XCROL - Take Control of Your Networks</title>
  <meta name="description" content="Build connections, shape your world, and own your digital presence.">
  <meta property="og:title" content="XCROL - Take Control of Your Networks">
  <meta property="og:description" content="Build connections, shape your world, and own your digital presence.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://xcrol.com">
  <meta http-equiv="refresh" content="0;url=https://xcrol.com">
</head>
<body>
  <p>Redirecting to <a href="https://xcrol.com">XCROL</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
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
