import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Blocks } from "lucide-react";

// Predefined Xcrol-enabled widgets
const AVAILABLE_WIDGETS = [
  {
    key: "microvictoryarmy",
    name: "MicroVictoryArmy",
    description: "Show your micro victories on your profile",
    getEmbedUrl: (username: string) => `https://microvictoryarmy.com/embed/${username}`,
    icon: "🏆",
  },
];

interface ProfileWidgetsManagerProps {
  userId: string;
  username: string | null;
}

export const ProfileWidgetsManager = ({ userId, username }: ProfileWidgetsManagerProps) => {
  const [enabledWidgets, setEnabledWidgets] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadWidgets();
  }, [userId]);

  const loadWidgets = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_widgets")
        .select("widget_key, enabled")
        .eq("user_id", userId);

      if (error) throw error;

      const widgetMap: Record<string, boolean> = {};
      (data || []).forEach((w) => {
        widgetMap[w.widget_key] = w.enabled;
      });
      setEnabledWidgets(widgetMap);
    } catch (error) {
      console.error("Error loading widgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWidget = async (widgetKey: string, enabled: boolean) => {
    setSaving(widgetKey);
    try {
      const { error } = await supabase
        .from("profile_widgets")
        .upsert(
          { user_id: userId, widget_key: widgetKey, enabled },
          { onConflict: "user_id,widget_key" }
        );

      if (error) throw error;

      setEnabledWidgets((prev) => ({ ...prev, [widgetKey]: enabled }));
      toast.success(enabled ? "Widget enabled!" : "Widget disabled");
    } catch (error) {
      console.error("Error toggling widget:", error);
      toast.error("Failed to update widget");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading widgets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Blocks className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Profile Widgets</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Enable widgets from Xcrol-connected projects to display on your public profile.
        {!username && (
        <span className="text-destructive ml-1">
            Set a username above to activate widgets.
          </span>
        )}
      </p>

      <div className="space-y-3">
        {AVAILABLE_WIDGETS.map((widget) => (
          <div
            key={widget.key}
            className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{widget.icon}</span>
              <div>
                <div className="font-medium">{widget.name}</div>
                <div className="text-xs text-muted-foreground">{widget.description}</div>
              </div>
            </div>
            <Switch
              checked={enabledWidgets[widget.key] ?? false}
              onCheckedChange={(checked) => toggleWidget(widget.key, checked)}
              disabled={saving === widget.key || !username}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileWidgetsManager;
