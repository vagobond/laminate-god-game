import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Play, Globe } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface LinkPreviewData {
  type: "pixelfed" | "peertube" | "generic" | "unknown";
  title?: string;
  description?: string;
  image_url?: string;
  video_embed_url?: string;
  duration?: number;
  site_name?: string;
  favicon_url?: string;
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

function isPreviewableUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const LinkPreview = ({ url }: LinkPreviewProps) => {
  // Wait for the session to load so logged-in requests carry the user's
  // token, but fetch either way: the edge function serves anonymous viewers
  // previews for links that appear in public entries.
  const { loading: authLoading } = useAuth();
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
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
  }, [url, authLoading]);

  if (!isPreviewableUrl(url) || loading || !data) {
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

        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="h-7 w-7 text-primary-foreground ml-1" fill="currentColor" />
          </div>
        </div>

        {data.duration != null && data.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
            {formatDuration(data.duration)}
          </div>
        )}

        {data.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
            <p className="text-white text-sm truncate">{data.title}</p>
          </div>
        )}
      </div>
    );
  }

  // Generic OG card
  if (data.type === "generic") {
    const hasImage = !!data.image_url;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex rounded-lg overflow-hidden border border-border bg-muted/30 hover:bg-muted/50 transition-colors no-underline"
      >
        {hasImage && (
          <div className="flex-shrink-0 w-24 sm:w-32 bg-muted">
            <img
              src={data.image_url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            {data.favicon_url ? (
              <img
                src={data.favicon_url}
                alt=""
                className="h-3.5 w-3.5 rounded-sm"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <Globe className="h-3.5 w-3.5" />
            )}
            <span className="truncate">{data.site_name}</span>
          </div>
          {data.title && (
            <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
              {data.title}
            </p>
          )}
          {data.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
      </a>
    );
  }

  return null;
};
