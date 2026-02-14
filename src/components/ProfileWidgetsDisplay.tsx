import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Blocks } from "lucide-react";

// Must match the registry in ProfileWidgetsManager
const WIDGET_REGISTRY: Record<string, {
  name: string;
  getEmbedUrl: (username: string) => string;
  height: number;
}> = {
  microvictoryarmy: {
    name: "MicroVictoryArmy",
    getEmbedUrl: (username) => `https://microvictoryarmy.com/embed/${username}`,
    height: 400,
  },
  w3wu: {
    name: "W3WU",
    getEmbedUrl: (username) => `https://w3wu.lovable.app/embed/${username}`,
    height: 400,
  },
};

interface ProfileWidgetsDisplayProps {
  userId: string;
  username?: string | null; // kept for backwards compat but no longer used for embed URL
}

export const ProfileWidgetsDisplay = ({ userId }: ProfileWidgetsDisplayProps) => {
  const [widgetsToRender, setWidgetsToRender] = useState<{ key: string; name: string; embedUrl: string; height: number }[]>([]);
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
            const reg = WIDGET_REGISTRY[w.widget_key];
            const config = (w.config as Record<string, string>) || {};
            if (!reg || !config.username) return null;
            return {
              key: w.widget_key,
              name: reg.name,
              embedUrl: reg.getEmbedUrl(config.username),
              height: reg.height,
            };
          })
          .filter(Boolean) as { key: string; name: string; embedUrl: string; height: number }[];

        setWidgetsToRender(rendered);
      } catch (err) {
        console.error("Error loading profile widgets:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading || widgetsToRender.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Blocks className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Widgets</h2>
      </div>
      <div className="space-y-4">
        {widgetsToRender.map((widget) => (
          <div key={widget.key} className="rounded-lg overflow-hidden border border-border">
            <iframe
              src={widget.embedUrl}
              title={widget.name}
              className="w-full border-0"
              style={{ height: widget.height }}
              sandbox="allow-scripts allow-same-origin allow-popups"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileWidgetsDisplay;
