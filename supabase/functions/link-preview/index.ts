const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinkPreviewResult {
  type: 'pixelfed' | 'peertube' | 'unknown';
  title?: string;
  description?: string;
  image_url?: string;
  video_embed_url?: string;
  duration?: number;
  original_url: string;
}

function isPixelFedUrl(url: string): boolean {
  // Known PixelFed instances + common patterns
  const pixelfedDomains = [
    'pixelfed.social', 'pixelfed.de', 'pixelfed.art', 'pixel.tchncs.de',
    'pixelfed.uno', 'pxlmo.com', 'pixelfed.tokyo', 'pixey.org',
    'pixelfed.au', 'pixelfed.cz', 'gram.social', 'pixelfed.fr',
  ];
  try {
    const hostname = new URL(url).hostname;
    return pixelfedDomains.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

function isPeerTubeUrl(url: string): boolean {
  const peertubeDomains = [
    'peertube.social', 'videos.lukesmith.xyz', 'tilvids.com',
    'tube.tchncs.de', 'video.ploud.fr', 'peertube.tv',
    'tube.spdns.org', 'peertube.co.uk', 'peertube.live',
    'videos.pair2jeux.tube', 'peertube.debian.social',
    'framatube.org', 'diode.zone', 'video.antopie.org',
  ];
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    // Check known domains or /w/ or /videos/watch/ path patterns (common PeerTube URL patterns)
    const hasPeerTubePath = /^\/(w|videos\/watch)\//.test(parsed.pathname);
    return peertubeDomains.some(d => hostname === d || hostname.endsWith('.' + d)) || hasPeerTubePath;
  } catch {
    return false;
  }
}

async function fetchPixelFedPreview(url: string): Promise<LinkPreviewResult> {
  const parsed = new URL(url);
  const oembedUrl = `${parsed.origin}/api/v1/oembed?url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(oembedUrl, { headers: { 'Accept': 'application/json' } });
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
    console.error('oEmbed fetch failed, trying OG fallback:', e);
  }

  // Fallback: fetch OpenGraph tags
  return fetchOgPreview(url, 'pixelfed');
}

async function fetchPeerTubePreview(url: string): Promise<LinkPreviewResult> {
  const parsed = new URL(url);

  // Try to extract video ID from URL patterns: /w/{id} or /videos/watch/{id}
  const wMatch = parsed.pathname.match(/^\/w\/([^/?]+)/);
  const watchMatch = parsed.pathname.match(/^\/videos\/watch\/([^/?]+)/);
  const videoId = wMatch?.[1] || watchMatch?.[1];

  if (videoId) {
    try {
      const apiUrl = `${parsed.origin}/api/v1/videos/${videoId}`;
      const res = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        return {
          type: 'peertube',
          title: data.name,
          description: data.description?.substring(0, 200),
          image_url: data.previewPath ? `${parsed.origin}${data.previewPath}` : (data.thumbnailPath ? `${parsed.origin}${data.thumbnailPath}` : undefined),
          video_embed_url: `${parsed.origin}/videos/embed/${data.uuid || videoId}`,
          duration: data.duration,
          original_url: url,
        };
      }
    } catch (e) {
      console.error('PeerTube API fetch failed:', e);
    }
  }

  // Fallback to OG tags
  return fetchOgPreview(url, 'peertube');
}

async function fetchOgPreview(url: string, type: 'pixelfed' | 'peertube'): Promise<LinkPreviewResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; XcrolBot/1.0)' },
      redirect: 'follow',
    });
    const html = await res.text();

    const getOg = (property: string): string | undefined => {
      const match = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, 'i'));
      return match?.[1];
    };

    const getMeta = (name: string): string | undefined => {
      const match = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
      return match?.[1];
    };

    const ogImage = getOg('image');
    const ogTitle = getOg('title');
    const ogDescription = getOg('description') || getMeta('description');
    const ogVideo = getOg('video:url') || getOg('video');
    const ogDuration = getOg('video:duration');

    return {
      type,
      title: ogTitle,
      description: ogDescription?.substring(0, 200),
      image_url: ogImage,
      video_embed_url: type === 'peertube' ? ogVideo : undefined,
      duration: ogDuration ? parseInt(ogDuration) : undefined,
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
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: LinkPreviewResult;

    if (isPixelFedUrl(url)) {
      result = await fetchPixelFedPreview(url);
    } else if (isPeerTubeUrl(url)) {
      result = await fetchPeerTubePreview(url);
    } else {
      result = { type: 'unknown', original_url: url };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ type: 'unknown', error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
