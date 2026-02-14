import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Blocks } from "lucide-react";
import { getWidgetByKey } from "@/lib/widget-registry";

// Friendship level hierarchy for visibility checks
const LEVEL_RANK: Record<string, number> = {
  public: 0,
  friendly_acquaintance: 1,
  buddy: 2,
  close_friend: 3,
  family: 3,
  secret_friend: 3,
};

function canViewWidget(requiredLevel: string, viewerLevel: string | null, isOwnProfile: boolean): boolean {
  if (isOwnProfile) return true;
  if (!requiredLevel || requiredLevel === "public") return true;
  if (!viewerLevel) return false;
  const required = LEVEL_RANK[requiredLevel] ?? 0;
  const viewer = LEVEL_RANK[viewerLevel] ?? 0;
  return viewer >= required;
}

interface ProfileWidgetsDisplayProps {
  userId: string;
  username?: string | null;
  viewerFriendshipLevel?: string | null;
  isOwnProfile?: boolean;
}

export const ProfileWidgetsDisplay = ({ userId, viewerFriendshipLevel = null, isOwnProfile = false }: ProfileWidgetsDisplayProps) => {
  const [widgetsToRender, setWidgetsToRender] = useState<{ key: string; name: string; siteName: string; embedUrl: string; height: number; minLevel: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("profile_widgets")
          .select("widget_key, config")
          .eq("user_id", userId)
          .eq("enabled", true);

        if (error) throw error;

        const rendered = (data || [])
          .map((w: any) => {
            const reg = getWidgetByKey(w.widget_key);
            const config = (w.config as Record<string, string>) || {};
            if (!reg || !config.username) return null;
            return {
              key: w.widget_key,
              name: reg.name,
              siteName: reg.siteName,
              embedUrl: reg.getEmbedUrl(config.username),
              height: reg.height,
              minLevel: config.min_friendship_level || "public",
            };
          })
          .filter(Boolean) as { key: string; name: string; siteName: string; embedUrl: string; height: number; minLevel: string }[];

        setWidgetsToRender(rendered);
      } catch (err) {
        console.error("Error loading profile widgets:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const visibleWidgets = widgetsToRender.filter(w => canViewWidget(w.minLevel, viewerFriendshipLevel, isOwnProfile));

  if (loading || visibleWidgets.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Blocks className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Xcrol Integrations</h2>
      </div>
      <div className="space-y-4">
        {visibleWidgets.map((widget) => (
          <LazyIframe key={widget.key} widget={widget} />
        ))}
      </div>
    </div>
  );
};

const LazyIframe = ({ widget }: { widget: { key: string; name: string; siteName: string; embedUrl: string; height: number } }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="rounded-lg overflow-hidden border border-border">
      <div className="px-3 py-2 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
        {widget.siteName}
      </div>
      {visible ? (
        <iframe
          src={widget.embedUrl}
          title={widget.name}
          className="w-full border-0"
          style={{ height: widget.height }}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      ) : (
        <div style={{ height: widget.height }} className="bg-muted/20 animate-pulse" />
      )}
    </div>
  );
};

export default ProfileWidgetsDisplay;
