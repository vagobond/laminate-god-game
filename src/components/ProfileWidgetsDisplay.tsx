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
};

interface ProfileWidgetsDisplayProps {
  userId: string;
  username: string | null;
}

export const ProfileWidgetsDisplay = ({ userId, username: usernameProp }: ProfileWidgetsDisplayProps) => {
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(usernameProp);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [widgetRes, profileRes] = await Promise.all([
          supabase
            .from("profile_widgets")
            .select("widget_key")
            .eq("user_id", userId)
            .eq("enabled", true),
          // Fetch username if not provided
          !usernameProp
            ? supabase.from("profiles").select("username").eq("id", userId).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (widgetRes.error) throw widgetRes.error;
        setEnabledKeys((widgetRes.data || []).map((w) => w.widget_key));

        if (profileRes.data?.username) {
          setResolvedUsername(profileRes.data.username);
        }
      } catch (err) {
        console.error("Error loading profile widgets:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, usernameProp]);

  if (loading || enabledKeys.length === 0 || !resolvedUsername) return null;

  const widgetsToRender = enabledKeys
    .map((key) => ({ key, ...WIDGET_REGISTRY[key], embedUrl: WIDGET_REGISTRY[key]?.getEmbedUrl(resolvedUsername!) }))
    .filter((w) => w.name); // only render known widgets

  if (widgetsToRender.length === 0) return null;

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
