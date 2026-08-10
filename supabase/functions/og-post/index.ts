import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit } from "../_shared/ratelimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await enforceRateLimit(req, "og-post", { limit: 30 }, corsHeaders);
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId");

    if (!postId) {
      return generateFallbackHtml();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: entry, error } = await supabase
      .from("xcrol_entries")
      .select("id, content, link, entry_date, privacy_level, user_id")
      .eq("id", postId)
      .eq("privacy_level", "public")
      .maybeSingle();

    if (error || !entry) {
      return generateFallbackHtml();
    }

    // Fetch author profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", entry.user_id)
      .maybeSingle();

    const displayName = profile?.display_name || profile?.username || "XCROL User";
    const usernameDisplay = profile?.username ? `@${profile.username}` : "";
    const avatarUrl = profile?.avatar_url || "https://xcrol.com/favicon.png";

    // Truncate content for OG description
    let description = entry.content;
    if (description.length > 155) {
      description = description.substring(0, 152) + "...";
    }

    const title = usernameDisplay
      ? `${escapeHtml(displayName)} (${escapeHtml(usernameDisplay)}) on XCROL`
      : `${escapeHtml(displayName)} on XCROL`;

    const canonicalUrl = `https://xcrol.com/post/${entry.id}`;
    const entryDate = new Date(entry.entry_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(avatarUrl)}">
  <meta property="og:image:width" content="400">
  <meta property="og:image:height" content="400">
  <meta property="og:site_name" content="XCROL">
  <meta property="article:published_time" content="${entry.entry_date}">
  ${usernameDisplay ? `<meta property="article:author" content="${escapeHtml(displayName)}">` : ""}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(avatarUrl)}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  
  <!-- Redirect to actual post page -->
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
      padding: 2.5rem;
      background: rgba(30, 41, 59, 0.8);
      border-radius: 1.5rem;
      border: 1px solid rgba(148, 163, 184, 0.2);
      backdrop-filter: blur(16px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      max-width: 420px;
    }
    .header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .avatar {
      width: 48px; height: 48px; border-radius: 50%; object-fit: cover;
      border: 2px solid rgba(99, 102, 241, 0.6);
    }
    .name { font-size: 1.1rem; font-weight: 700; color: #f8fafc; }
    .username { font-size: 0.85rem; color: #94a3b8; }
    .content {
      font-size: 1rem; color: #cbd5e1; line-height: 1.6;
      margin-bottom: 1rem; white-space: pre-wrap; word-break: break-word;
    }
    .date { font-size: 0.8rem; color: #64748b; }
    .redirect { font-size: 0.8rem; color: #64748b; margin-top: 0.75rem; }
    a { color: #818cf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(displayName)}" class="avatar" onerror="this.style.display='none'">
      <div>
        <div class="name">${escapeHtml(displayName)}</div>
        ${usernameDisplay ? `<div class="username">${escapeHtml(usernameDisplay)}</div>` : ""}
      </div>
    </div>
    <div class="content">${escapeHtml(entry.content)}</div>
    <div class="date">${entryDate}</div>
    <p class="redirect">Redirecting to <a href="${escapeHtml(canonicalUrl)}">XCROL</a>...</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error generating OG post:", error);
    return generateFallbackHtml();
  }
});

function generateFallbackHtml() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>XCROL - Not Being Used to Control You</title>
  <meta name="description" content="Not Being Used to Control You. Build connections, shape your world, and own your digital presence.">
  <meta property="og:title" content="XCROL - Not Being Used to Control You">
  <meta property="og:description" content="Not Being Used to Control You. Build connections, shape your world, and own your digital presence.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://xcrol.com">
  <meta http-equiv="refresh" content="0;url=https://xcrol.com">
</head>
<body>
  <p>Redirecting to <a href="https://xcrol.com">XCROL</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
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
