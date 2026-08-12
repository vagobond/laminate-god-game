// Cloudflare Worker: serve OG-preview HTML to link-preview scrapers, and
// embeddable profile cards on /embed/*.
//
// The SPA renders /post/:id meta tags client-side, which scrapers never
// execute — so shared links showed no preview. For scraper user agents
// requesting /post/:id we proxy the og-post Supabase edge function
// (public-only gate + cache headers live there).
//
// /embed/<username> proxies the embed-profile edge function with
// cacheEverything, so repeated iframe loads are served from Cloudflare's
// edge cache and Supabase only sees cache misses. Everything else falls
// through to the static SPA assets.

interface Env {
  ASSETS: Fetcher;
  SUPABASE_URL: string;
}

const BOT_UA =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|slack-imgproxy|telegrambot|whatsapp|discordbot|mastodon|pleroma|akkoma|misskey|redditbot|pinterest|signal|skypeuripreview|viber|line-poker|snapchat|iframely|embedly|opengraph|bufferbot|bitlybot|vkshare|qwantbot|applebot|bingbot|googlebot|yandex|duckduckbot/i;

const POST_PATH = /^\/post\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const EMBED_PATH = /^\/embed\/@?([A-Za-z0-9_.-]{1,40})$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const embedMatch = url.pathname.match(EMBED_PATH);
    if (embedMatch) {
      const id = embedMatch[1];
      const param = UUID_RE.test(id)
        ? `userId=${encodeURIComponent(id)}`
        : `username=${encodeURIComponent(id)}`;
      const embedUrl = `${env.SUPABASE_URL}/functions/v1/embed-profile?${param}`;
      return fetch(embedUrl, {
        cf: { cacheTtl: 21600, cacheEverything: true },
      } as RequestInit);
    }

    const match = url.pathname.match(POST_PATH);
    const ua = request.headers.get("user-agent") || "";

    if (match && BOT_UA.test(ua)) {
      try {
        const ogUrl = `${env.SUPABASE_URL}/functions/v1/og-post?postId=${match[1]}`;
        const ogRes = await fetch(ogUrl, {
          headers: { "user-agent": ua },
          cf: { cacheTtl: 3600, cacheEverything: true },
        } as RequestInit);
        if (ogRes.ok) return ogRes;
      } catch {
        // fall through to the SPA on any failure
      }
    }

    return env.ASSETS.fetch(request);
  },
};
