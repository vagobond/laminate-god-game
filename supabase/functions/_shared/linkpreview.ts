// Shared link-preview resolution: host detection, oEmbed probes, OG scraping.
//
// Extracted from functions/link-preview so the backfill function can resolve
// previews directly — without an HTTP round-trip through the public endpoint
// (which would consume its per-IP rate limit and require a user token).
//
// Every outbound fetch to a user-controlled host goes through safeFetch(),
// which re-validates each redirect hop (SSRF guard).

import { assertPublicUrl, safeFetch, readJsonLimited, readTextLimited } from "./safefetch.ts";

export interface LinkPreviewResult {
  type: 'pixelfed' | 'peertube' | 'generic' | 'unknown';
  title?: string;
  description?: string;
  image_url?: string;
  video_embed_url?: string;
  duration?: number;
  site_name?: string;
  favicon_url?: string;
  original_url: string;
}

// SSRF guard: scheme + blocked hosts + IP-literal ranges + DNS resolution
// (see _shared/safefetch.ts). Every outbound fetch to a user-controlled host
// goes through safeFetch(), which re-validates each redirect hop.
async function isBlockedUrl(url: string): Promise<boolean> {
  try {
    await assertPublicUrl(url);
    return false;
  } catch {
    return true;
  }
}

// Only accept http(s) URLs as embed/iframe sources handed to the client.
function httpUrlOrUndefined(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

const MAX_JSON_BYTES = 256 * 1024;

// ─── Host detection helpers ─────────────────────────────────────────

function getHost(url: string): string {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}

function isYouTube(host: string): boolean {
  return ['youtube.com', 'youtu.be', 'm.youtube.com'].includes(host);
}

function isVimeo(host: string): boolean {
  return host === 'vimeo.com' || host === 'player.vimeo.com';
}

function isTikTok(host: string): boolean {
  return host === 'tiktok.com' || host.endsWith('.tiktok.com');
}

function isSpotify(host: string): boolean {
  return host === 'open.spotify.com';
}

function isSoundCloud(host: string): boolean {
  return host === 'soundcloud.com' || host === 'm.soundcloud.com';
}

function isInstagram(host: string): boolean {
  return host === 'instagram.com' || host.endsWith('.instagram.com');
}

function isTwitter(host: string): boolean {
  return ['twitter.com', 'x.com', 'mobile.twitter.com'].includes(host);
}

function isLinkedIn(host: string): boolean {
  return host === 'linkedin.com' || host.endsWith('.linkedin.com');
}

// ─── oEmbed helper ──────────────────────────────────────────────────

async function fetchOEmbed(
  oembedUrl: string,
  originalUrl: string,
  siteName: string,
): Promise<LinkPreviewResult | null> {
  try {
    // Provider endpoints are hardcoded (not user hosts), so plain fetch is
    // fine — but keep the deadline across the body read and cap the size.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(oembedUrl, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const d = (await readJsonLimited(res, MAX_JSON_BYTES)) as Record<string, unknown>;

      // Video embed: ONLY an <iframe src>. TikTok's oEmbed html is a
      // <blockquote> + <script src="…/embed.js"> — matching any src= there
      // handed the client a JS file as an iframe URL.
      const embedMatch = typeof d.html === 'string'
        ? d.html.match(/<iframe[^>]+src=["']([^"']+)["']/i)
        : null;
      const embedUrl = httpUrlOrUndefined(embedMatch?.[1]);

      return {
        type: embedUrl ? 'peertube' : 'generic', // reuse peertube renderer for play-button cards
        title: typeof d.title === 'string' ? d.title : undefined,
        description: typeof d.description === 'string' ? d.description.substring(0, 200) : undefined,
        image_url: httpUrlOrUndefined(d.thumbnail_url),
        video_embed_url: embedUrl,
        duration: typeof d.duration === 'number' ? d.duration : undefined,
        site_name: siteName,
        favicon_url: undefined,
        original_url: originalUrl,
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}

// ─── YouTube privacy-enhanced embed ─────────────────────────────────

function sanitizeYouTubeEmbed(embedUrl: string | undefined): string | undefined {
  if (!embedUrl) return undefined;
  // Replace the youtube.com HOST with youtube-nocookie.com for privacy
  try {
    const u = new URL(embedUrl);
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') u.hostname = 'www.youtube-nocookie.com';
    return u.toString();
  } catch {
    return undefined;
  }
}

// ─── Twitter via fxtwitter ──────────────────────────────────────────

async function probeTwitter(url: string): Promise<LinkPreviewResult> {
  // fxtwitter.com returns proper OG tags for tweets without requiring auth
  let fxUrl = url;
  try {
    const u = new URL(url);
    u.hostname = 'fxtwitter.com'; // host already validated as twitter.com / x.com / mobile.twitter.com
    fxUrl = u.toString();
  } catch { /* fall through with the original */ }
  return fetchOgPreview(fxUrl, 'generic', 'X');
}

// ─── Instagram via browser-UA OG scrape ─────────────────────────────
// Meta locked oEmbed behind full business verification + app review.
// Instagram does serve og:image to browser-like UAs (same way iMessage/
// Signal/Slack get previews). Use that instead.

async function probeInstagram(url: string): Promise<LinkPreviewResult> {
  const result = await fetchOgPreview(url, 'generic', 'Instagram', true);
  // If we got an image, promote to pixelfed-style inline image render
  if (result.type !== 'unknown' && result.image_url) {
    return {
      type: 'pixelfed',
      title: result.title,
      image_url: result.image_url,
      original_url: url,
    };
  }
  return result;
}

// ─── LinkedIn via browser-like UA OG scrape ─────────────────────────

async function probeLinkedIn(url: string): Promise<LinkPreviewResult> {
  return fetchOgPreview(url, 'generic', 'LinkedIn', true);
}

// ─── Existing helpers (unchanged) ───────────────────────────────────

// Extract PeerTube video ID from path patterns
function extractPeerTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const wMatch = parsed.pathname.match(/^\/w\/([^/?]+)/);
    const watchMatch = parsed.pathname.match(/^\/videos\/watch\/([^/?]+)/);
    return wMatch?.[1] || watchMatch?.[1] || null;
  } catch {
    return null;
  }
}

// Check if URL has PixelFed path pattern (/p/{user}/{id})
function hasPixelFedPath(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /^\/p\/[^/]+\/\d+/.test(parsed.pathname);
  } catch {
    return false;
  }
}

// Probe PeerTube API with timeout
async function probePeerTube(url: string, videoId: string): Promise<LinkPreviewResult> {
  const parsed = new URL(url);
  const apiUrl = `${parsed.origin}/api/v1/videos/${videoId}`;

  try {
    const { res, timer } = await safeFetch(apiUrl, { timeoutMs: 3000, headers: { 'Accept': 'application/json' } });
    try {
      if (res.ok) {
        const data = (await readJsonLimited(res, MAX_JSON_BYTES)) as Record<string, unknown>;
        // Validate it's actually PeerTube JSON
        if (typeof data.name === 'string' && (data.uuid || data.id)) {
          const previewPath = typeof data.previewPath === 'string' ? data.previewPath
            : (typeof data.thumbnailPath === 'string' ? data.thumbnailPath : undefined);
          return {
            type: 'peertube',
            title: data.name,
            description: typeof data.description === 'string' ? data.description.substring(0, 200) : undefined,
            image_url: previewPath ? httpUrlOrUndefined(`${parsed.origin}${previewPath}`) : undefined,
            video_embed_url: `${parsed.origin}/videos/embed/${data.uuid || videoId}`,
            duration: typeof data.duration === 'number' ? data.duration : undefined,
            original_url: url,
          };
        }
      } else {
        try { await res.body?.cancel(); } catch { /* ignore */ }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    console.error('PeerTube API probe failed:', e);
  }

  // Fall back to OG scraping
  return fetchOgPreview(url, 'peertube');
}

// Probe PixelFed oEmbed with timeout
async function probePixelFed(url: string): Promise<LinkPreviewResult> {
  const parsed = new URL(url);
  const oembedUrl = `${parsed.origin}/api/v1/oembed?url=${encodeURIComponent(url)}`;

  try {
    const { res, timer } = await safeFetch(oembedUrl, { timeoutMs: 3000, headers: { 'Accept': 'application/json' } });
    try {
      if (res.ok) {
        const data = (await readJsonLimited(res, MAX_JSON_BYTES)) as Record<string, unknown>;
        const img = httpUrlOrUndefined(data.url) ?? httpUrlOrUndefined(data.thumbnail_url);
        if (img) {
          return {
            type: 'pixelfed',
            title: typeof data.title === 'string' ? data.title : (typeof data.author_name === 'string' ? data.author_name : undefined),
            image_url: img,
            original_url: url,
          };
        }
      } else {
        try { await res.body?.cancel(); } catch { /* ignore */ }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    console.error('PixelFed oEmbed probe failed:', e);
  }

  return fetchOgPreview(url, 'pixelfed');
}

// OG fallback with 50KB limit
async function fetchOgPreview(
  url: string,
  type: 'pixelfed' | 'peertube' | 'generic',
  forceSiteName?: string,
  browserUa = false,
): Promise<LinkPreviewResult> {
  try {
    const ua = browserUa
      ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (compatible; XcrolBot/1.0)';

    // Manual, re-validated redirects; 4s deadline covers the body read too.
    const { res, timer } = await safeFetch(url, { timeoutMs: 4000, headers: { 'User-Agent': ua } });
    let html = '';
    try {
      html = await readTextLimited(res, 50 * 1024);
    } finally {
      clearTimeout(timer);
    }
    if (!html) return { type: 'unknown', original_url: url };

    const getOg = (property: string): string | undefined => {
      const match = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, 'i'));
      return match?.[1];
    };

    const getMeta = (name: string): string | undefined => {
      const match = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
      return match?.[1];
    };

    const getTitle = (): string | undefined => {
      const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return m?.[1]?.trim();
    };

    const getFavicon = (): string | undefined => {
      const m = html.match(/<link[^>]*rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i)
        || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut icon|icon|apple-touch-icon)["']/i);
      const href = m?.[1];
      if (!href) {
        try { return `${new URL(url).origin}/favicon.ico`; } catch { return undefined; }
      }
      try { return new URL(href, url).toString(); } catch { return undefined; }
    };

    const ogImage = getOg('image');
    const ogTitle = getOg('title') || getTitle();
    const ogDescription = getOg('description') || getMeta('description');
    const ogVideo = getOg('video:url') || getOg('video');
    const ogDuration = getOg('video:duration');
    const ogSiteName = forceSiteName || getOg('site_name');

    if (!ogImage && !ogTitle && !ogVideo && !ogDescription) {
      return { type: 'unknown', original_url: url };
    }

    let siteName = ogSiteName;
    if (!siteName) {
      try { siteName = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
    }

    return {
      type,
      title: ogTitle,
      description: ogDescription?.substring(0, 200),
      image_url: httpUrlOrUndefined(ogImage),
      video_embed_url: type === 'peertube' ? httpUrlOrUndefined(ogVideo) : undefined,
      duration: ogDuration ? parseInt(ogDuration) : undefined,
      site_name: type === 'generic' ? siteName : undefined,
      favicon_url: type === 'generic' ? getFavicon() : undefined,
      original_url: url,
    };
  } catch (e) {
    console.error('OG fetch failed:', e);
    return { type: 'unknown', original_url: url };
  }
}


// ─── Public entry point ─────────────────────────────────────────────

/** Resolve a url to preview data. Never throws; returns type 'unknown' when
 *  the url is blocked or nothing useful was found. */
export async function resolveLinkPreview(url: string): Promise<LinkPreviewResult> {
  if (await isBlockedUrl(url)) {
    return { type: 'unknown', original_url: url };
  }

  const host = getHost(url);

  if (isYouTube(host)) {
    const oembed = await fetchOEmbed(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      url, 'YouTube',
    );
    if (oembed) {
      oembed.video_embed_url = sanitizeYouTubeEmbed(oembed.video_embed_url);
      return oembed;
    }
    return fetchOgPreview(url, 'generic', 'YouTube');
  }
  if (isVimeo(host)) {
    return await fetchOEmbed(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`, url, 'Vimeo')
      ?? await fetchOgPreview(url, 'generic', 'Vimeo');
  }
  if (isTikTok(host)) {
    return await fetchOEmbed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, url, 'TikTok')
      ?? await fetchOgPreview(url, 'generic', 'TikTok');
  }
  if (isSpotify(host)) {
    return await fetchOEmbed(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, url, 'Spotify')
      ?? await fetchOgPreview(url, 'generic', 'Spotify');
  }
  if (isSoundCloud(host)) {
    return await fetchOEmbed(`https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`, url, 'SoundCloud')
      ?? await fetchOgPreview(url, 'generic', 'SoundCloud');
  }
  if (isInstagram(host)) return probeInstagram(url);
  if (isTwitter(host)) return probeTwitter(url);
  if (isLinkedIn(host)) return probeLinkedIn(url);

  const peerTubeVideoId = extractPeerTubeVideoId(url);
  if (peerTubeVideoId) return probePeerTube(url, peerTubeVideoId);
  if (hasPixelFedPath(url)) return probePixelFed(url);
  return fetchOgPreview(url, 'generic');
}
