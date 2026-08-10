import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit } from "../_shared/ratelimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const limited = await enforceRateLimit(req, "og-publication", { limit: 30 }, corsHeaders);
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    if (!slug) return fallback();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pub } = await supabase
      .from("scroll_publications")
      .select("id, user_id, slug, title, subtitle, blurb, cover_image_url, published_at, visibility, unpublished_at")
      .eq("slug", slug)
      .is("unpublished_at", null)
      .maybeSingle();
    if (!pub) return fallback();

    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", pub.user_id)
      .maybeSingle();

    const authorName = prof?.display_name || prof?.username || "XCROL author";
    const canonical = `https://xcrol.com/library/${pub.slug}`;
    const description = (pub.blurb || pub.subtitle || `${authorName} on XCROL`).slice(0, 200);
    const image = pub.cover_image_url || prof?.avatar_url || "https://xcrol.com/favicon.png";
    const title = `${pub.title} — by ${authorName}`;

    const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:site_name" content="XCROL">
<meta property="article:published_time" content="${pub.published_at}">
<meta property="article:author" content="${esc(authorName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="canonical" href="${esc(canonical)}">
<meta http-equiv="refresh" content="0;url=${esc(canonical)}">
</head><body><p>Redirecting to <a href="${esc(canonical)}">${esc(title)}</a>…</p></body></html>`;

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    console.error(e);
    return fallback();
  }
});

function fallback() {
  const html = `<!DOCTYPE html><html><head><title>XCROL Library</title><meta http-equiv="refresh" content="0;url=https://xcrol.com/the-castle/library"></head><body><a href="https://xcrol.com/the-castle/library">Browse the Castle Library</a></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function esc(s: string) {
  if (!s) return "";
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
