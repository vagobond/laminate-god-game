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
async function fetchOgPreview(url: string, type: 'pixelfed' | 'peertube' | 'generic'): Promise<LinkPreviewResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; XcrolBot/1.0)' },
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
    const ogSiteName = getOg('site_name');

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

    // 2. PeerTube path pattern? -> probe API
    const peerTubeVideoId = extractPeerTubeVideoId(url);
    if (peerTubeVideoId) {
      result = await probePeerTube(url, peerTubeVideoId);
    }
    // 3. PixelFed path pattern? -> probe oEmbed
    else if (hasPixelFedPath(url)) {
      result = await probePixelFed(url);
    }
    // 4. Generic OG preview
    else {
      result = await fetchOgPreview(url, 'generic');
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
