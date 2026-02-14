import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Play } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface LinkPreviewData {
  type: "pixelfed" | "peertube" | "unknown";
  title?: string;
  description?: string;
  image_url?: string;
  video_embed_url?: string;
  duration?: number;
  original_url: string;
}

interface LinkPreviewProps {
  url: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Simple check for known PixelFed/PeerTube domains (client-side, to avoid unnecessary calls)
function isPreviewableUrl(url: string): boolean {
  const pixelfedDomains = [
    "pixelfed.social", "pixelfed.de", "pixelfed.art", "pixel.tchncs.de",
    "pixelfed.uno", "pxlmo.com", "pixelfed.tokyo", "pixey.org",
    "pixelfed.au", "pixelfed.cz", "gram.social", "pixelfed.fr",
  ];
  const peertubeDomains = [
    "peertube.social", "tilvids.com", "tube.tchncs.de", "peertube.tv",
    "peertube.co.uk", "peertube.live", "framatube.org", "diode.zone",
    "video.antopie.org", "peertube.debian.social",
  ];
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const allDomains = [...pixelfedDomains, ...peertubeDomains];
    if (allDomains.some((d) => hostname === d || hostname.endsWith("." + d))) return true;
    // PeerTube URL path patterns
    if (/^\/(w|videos\/watch)\//.test(parsed.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

export const LinkPreview = ({ url }: LinkPreviewProps) => {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    if (!url || !isPreviewableUrl(url)) return;

    let cancelled = false;
    setLoading(true);

    supabase.functions
      .invoke("link-preview", { body: { url } })
      .then(({ data: result, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Link preview error:", error);
          setData(null);
        } else if (result?.type && result.type !== "unknown") {
          setData(result as LinkPreviewData);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [url]);

  if (!isPreviewableUrl(url) || loading || !data) {
    // Fallback: render nothing special, let parent render the normal link
    return null;
  }

  // PixelFed: inline image
  if (data.type === "pixelfed" && data.image_url) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-border">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={data.image_url}
            alt={data.title || "PixelFed image"}
            className="w-full max-h-[400px] object-cover"
            loading="lazy"
          />
        </a>
        {data.title && (
          <div className="px-3 py-2 bg-muted/50 text-xs text-muted-foreground truncate">
            {data.title}
          </div>
        )}
      </div>
    );
  }

  // PeerTube: thumbnail with play button, click to embed or open
  if (data.type === "peertube") {
    if (showEmbed && data.video_embed_url) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border border-border">
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={data.video_embed_url}
              className="w-full h-full"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups"
              title={data.title || "PeerTube video"}
            />
          </AspectRatio>
        </div>
      );
    }

    return (
      <div
        className="mt-2 rounded-lg overflow-hidden border border-border cursor-pointer group relative"
        onClick={() => {
          if (data.video_embed_url) {
            setShowEmbed(true);
          } else {
            window.open(url, "_blank", "noopener,noreferrer");
          }
        }}
      >
        {data.image_url ? (
          <AspectRatio ratio={16 / 9}>
            <img
              src={data.image_url}
              alt={data.title || "PeerTube video"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </AspectRatio>
        ) : (
          <div className="w-full aspect-video bg-muted flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Duration badge */}
        {data.duration != null && data.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
            {formatDuration(data.duration)}
          </div>
        )}

        {/* Title bar */}
        {data.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
            <p className="text-white text-sm truncate">{data.title}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
};
