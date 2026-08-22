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
  /** Optional shared secret (wrangler secret put WORKER_TRUST_SECRET) letting
   *  the edge functions trust our x-forwarded-for as the real visitor IP. */
  WORKER_TRUST_SECRET?: string;
}

const BOT_UA =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|slack-imgproxy|telegrambot|whatsapp|discordbot|mastodon|pleroma|akkoma|misskey|redditbot|pinterest|signal|skypeuripreview|viber|line-poker|snapchat|iframely|embedly|opengraph|bufferbot|bitlybot|vkshare|qwantbot|applebot|bingbot|googlebot|yandex|duckduckbot/i;

const POST_PATH = /^\/post\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const EMBED_PATH = /^\/embed\/@?([A-Za-z0-9_.-]{1,40})$/;
// /card/<username|uuid>.png|.svg → profile-card edge function (PNG/SVG image)
const CARD_PATH = /^\/card\/@?([A-Za-z0-9_.-]{1,40})\.(png|svg)$/;
// Profile pages: /@<username> and /u/<uuid>. For link-preview bots we serve
// og-profile's HTML (meta tags + redirect) so a pasted profile link unfurls
// as a real card on social networks; humans get the SPA as usual.
const PROFILE_AT_PATH = /^\/@([A-Za-z0-9_.-]{1,40})$/;
const PROFILE_U_PATH = /^\/u\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const embedMatch = url.pathname.match(EMBED_PATH);
    if (embedMatch) {
      const id = embedMatch[1];
      // Usernames are stored lowercase; lowercase here (like /card/* and
      // og-profile do) so mixed-case embed URLs don't 404.
      const param = UUID_RE.test(id)
        ? `userId=${encodeURIComponent(id)}`
        : `username=${encodeURIComponent(id.toLowerCase())}`;
      const embedUrl = `${env.SUPABASE_URL}/functions/v1/embed-profile?${param}`;
      try {
        const res = await fetch(embedUrl, {
          headers: {
            // Forward the visitor IP so the edge function's per-IP rate limit
            // buckets per visitor instead of one shared bucket for Cloudflare's
            // egress IP (which would 429 everyone on a burst of cache misses).
            "x-forwarded-for": request.headers.get("cf-connecting-ip") || "",
            ...(env.WORKER_TRUST_SECRET ? { "x-worker-secret": env.WORKER_TRUST_SECRET } : {}),
            "user-agent": request.headers.get("user-agent") || "",
          },
          cf: {
            cacheEverything: true,
            // Cache only successful cards; never pin a 429/5xx to the slug for 6h.
            cacheTtlByStatus: { "200-299": 21600, "404": 300, "400-499": 0, "500-599": 0 },
          },
        } as RequestInit);
        if (res.ok || res.status === 404) return res;
      } catch {
        // fall through to a graceful card below
      }
      return new Response(
        "<!doctype html><meta charset=utf-8><meta name=robots content=noindex>" +
          "<body style=\"margin:0;font:14px system-ui;color:#666;padding:16px\">Profile card temporarily unavailable.</body>",
        { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
      );
    }

    const cardMatch = url.pathname.match(CARD_PATH);
    if (cardMatch) {
      const id = cardMatch[1];
      const fmt = cardMatch[2];
      const size = url.searchParams.get("size") === "badge" ? "badge" : "og";
      const param = UUID_RE.test(id)
        ? `userId=${encodeURIComponent(id)}`
        : `username=${encodeURIComponent(id.toLowerCase())}`;
      const cardUrl = `${env.SUPABASE_URL}/functions/v1/profile-card?${param}&size=${size}&format=${fmt}`;
      try {
        const res = await fetch(cardUrl, {
          headers: {
            "x-forwarded-for": request.headers.get("cf-connecting-ip") || "",
            ...(env.WORKER_TRUST_SECRET ? { "x-worker-secret": env.WORKER_TRUST_SECRET } : {}),
            "user-agent": request.headers.get("user-agent") || "",
          },
          cf: {
            cacheEverything: true,
            cacheTtlByStatus: { "200-299": 21600, "400-499": 60, "500-599": 0 },
          },
        } as RequestInit);
        if (res.ok) return res;
      } catch {
        // fall through
      }
      return new Response("card unavailable", { status: 503, headers: { "cache-control": "no-store" } });
    }

    const match = url.pathname.match(POST_PATH);
    const ua = request.headers.get("user-agent") || "";

    const atMatch = url.pathname.match(PROFILE_AT_PATH);
    const uMatch = url.pathname.match(PROFILE_U_PATH);
    if ((atMatch || uMatch) && BOT_UA.test(ua)) {
      try {
        const param = atMatch
          ? `username=${encodeURIComponent(atMatch[1].toLowerCase())}`
          : `userId=${encodeURIComponent(uMatch![1])}`;
        const ogUrl = `${env.SUPABASE_URL}/functions/v1/og-profile?${param}`;
        const ogRes = await fetch(ogUrl, {
          headers: { "user-agent": ua },
          cf: { cacheTtl: 3600, cacheEverything: true },
        } as RequestInit);
        if (ogRes.ok) return ogRes;
      } catch {
        // fall through to the SPA on any failure
      }
    }

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
