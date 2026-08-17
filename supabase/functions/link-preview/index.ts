import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LinkPreviewResult {
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

// Block private/internal IP ranges and localhost (unchanged SSRF protection)
function isBlockedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]') return true;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.)/.test(hostname)) return true;
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') return true;
    return false;
  } catch {
    return true;
  }
}

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(oembedUrl, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const d = await res.json();

    // Video embed (YouTube, Vimeo, TikTok)
    const embedMatch = typeof d.html === 'string'
      ? d.html.match(/src=["']([^"']+)["']/)
      : null;
    const embedUrl = embedMatch?.[1];

    return {
      type: embedUrl ? 'peertube' : 'generic', // reuse peertube renderer for play-button cards
      title: d.title,
      description: d.description?.substring(0, 200),
      image_url: d.thumbnail_url,
      video_embed_url: embedUrl,
      duration: typeof d.duration === 'number' ? d.duration : undefined,
      site_name: siteName,
      favicon_url: undefined,
      original_url: originalUrl,
    };
  } catch {
    return null;
  }
}

// ─── YouTube privacy-enhanced embed ─────────────────────────────────

function sanitizeYouTubeEmbed(embedUrl: string | undefined): string | undefined {
  if (!embedUrl) return undefined;
  // Replace youtube.com with youtube-nocookie.com for privacy
  return embedUrl.replace('youtube.com', 'youtube-nocookie.com');
}

// ─── Twitter via fxtwitter ──────────────────────────────────────────

async function probeTwitter(url: string): Promise<LinkPreviewResult> {
  // fxtwitter.com returns proper OG tags for tweets without requiring auth
  const fxUrl = url
    .replace('twitter.com', 'fxtwitter.com')
    .replace('x.com', 'fxtwitter.com');
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      // Validate it's actually PeerTube JSON
      if (data.name && (data.uuid || data.id)) {
        return {
          type: 'peertube',
          title: data.name,
          description: data.description?.substring(0, 200),
          image_url: data.previewPath
            ? `${parsed.origin}${data.previewPath}`
            : (data.thumbnailPath ? `${parsed.origin}${data.thumbnailPath}` : undefined),
          video_embed_url: `${parsed.origin}/videos/embed/${data.uuid || videoId}`,
          duration: data.duration,
          original_url: url,
        };
      }
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(oembedUrl, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.url || data.thumbnail_url) {
        return {
          type: 'pixelfed',
          title: data.title || data.author_name,
          image_url: data.url || data.thumbnail_url,
          original_url: url,
        };
      }
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const ua = browserUa
      ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (compatible; XcrolBot/1.0)';

    const res = await fetch(url, {
      headers: { 'User-Agent': ua },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const reader = res.body?.getReader();
    if (!reader) return { type: 'unknown', original_url: url };

    let html = '';
    const decoder = new TextDecoder();
    const MAX_BYTES = 50 * 1024;
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.length;
      html += decoder.decode(value, { stream: true });
      if (totalBytes >= MAX_BYTES) break;
    }
    reader.cancel();

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
      image_url: ogImage,
      video_embed_url: type === 'peertube' ? ogVideo : undefined,
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

// ─── Main handler ───────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication (unchanged)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. SSRF check
    if (isBlockedUrl(url)) {
      return new Response(JSON.stringify({ type: 'unknown', original_url: url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: LinkPreviewResult;
    const host = getHost(url);

    // 2. Walled garden handlers (oEmbed / proxy / browser-UA)
    if (isYouTube(host)) {
      const oembed = await fetchOEmbed(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        url, 'YouTube',
      );
      if (oembed) {
        oembed.video_embed_url = sanitizeYouTubeEmbed(oembed.video_embed_url);
        result = oembed;
      } else {
        result = await fetchOgPreview(url, 'generic', 'YouTube');
      }
    } else if (isVimeo(host)) {
      result = await fetchOEmbed(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
        url, 'Vimeo',
      ) ?? await fetchOgPreview(url, 'generic', 'Vimeo');
    } else if (isTikTok(host)) {
      result = await fetchOEmbed(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        url, 'TikTok',
      ) ?? await fetchOgPreview(url, 'generic', 'TikTok');
    } else if (isSpotify(host)) {
      result = await fetchOEmbed(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
        url, 'Spotify',
      ) ?? await fetchOgPreview(url, 'generic', 'Spotify');
    } else if (isSoundCloud(host)) {
      result = await fetchOEmbed(
        `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        url, 'SoundCloud',
      ) ?? await fetchOgPreview(url, 'generic', 'SoundCloud');
    } else if (isInstagram(host)) {
      result = await probeInstagram(url);
    } else if (isTwitter(host)) {
      result = await probeTwitter(url);
    } else if (isLinkedIn(host)) {
      result = await probeLinkedIn(url);
    }
    // 3. Fediverse handlers (existing)
    else {
      const peerTubeVideoId = extractPeerTubeVideoId(url);
      if (peerTubeVideoId) {
        result = await probePeerTube(url, peerTubeVideoId);
      } else if (hasPixelFedPath(url)) {
        result = await probePixelFed(url);
      }
      // 4. Generic OG preview
      else {
        result = await fetchOgPreview(url, 'generic');
      }
    }

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        // Same URL is previewed by many viewers — let the CDN serve it.
        'Cache-Control': 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ type: 'unknown', error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
