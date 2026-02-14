import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Blocks } from "lucide-react";
import { friendshipLevelLabels, type FriendshipLevelKey } from "@/lib/friendship-labels";
import { WIDGET_REGISTRY } from "@/lib/widget-registry";

const VISIBILITY_OPTIONS: { value: string; label: string }[] = [
  { value: "public", label: "Everyone (Public)" },
  ...( ["friendly_acquaintance", "buddy", "close_friend", "family", "secret_friend"] as FriendshipLevelKey[]).map(key => ({
    value: key,
    label: friendshipLevelLabels[key].shortLabel,
  })),
];

interface WidgetRow {
  widget_key: string;
  enabled: boolean;
  config: Record<string, string> | null;
}

interface ProfileWidgetsManagerProps {
  userId: string;
  username: string | null;
}

export const ProfileWidgetsManager = ({ userId, username }: ProfileWidgetsManagerProps) => {
  const [widgets, setWidgets] = useState<Record<string, { enabled: boolean; config: Record<string, string> }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadWidgets();
  }, [userId]);

  const loadWidgets = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_widgets")
        .select("widget_key, enabled, config")
        .eq("user_id", userId);

      if (error) throw error;

      const widgetMap: Record<string, { enabled: boolean; config: Record<string, string> }> = {};
      (data || []).forEach((w: any) => {
        widgetMap[w.widget_key] = {
          enabled: w.enabled,
          config: (w.config as Record<string, string>) || {},
        };
      });
      setWidgets(widgetMap);
    } catch (error) {
      console.error("Error loading widgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveWidget = async (widgetKey: string, enabled: boolean, config: Record<string, string>) => {
    setSaving(widgetKey);
    try {
      const { error } = await supabase
        .from("profile_widgets")
        .upsert(
          { user_id: userId, widget_key: widgetKey, enabled, config },
          { onConflict: "user_id,widget_key" }
        );

      if (error) throw error;

      setWidgets((prev) => ({ ...prev, [widgetKey]: { enabled, config } }));
      toast.success(enabled ? "Widget updated!" : "Widget disabled");
    } catch (error) {
      console.error("Error saving widget:", error);
      toast.error("Failed to update widget");
    } finally {
      setSaving(null);
    }
  };

  const toggleWidget = (widgetKey: string, enabled: boolean) => {
    const current = widgets[widgetKey] || { enabled: false, config: {} };
    if (enabled && !current.config?.username) {
      toast.error("Please enter your username for this widget first");
      return;
    }
    saveWidget(widgetKey, enabled, current.config);
  };

  const updateWidgetUsername = (widgetKey: string, value: string) => {
    setWidgets((prev) => ({
      ...prev,
      [widgetKey]: {
        enabled: prev[widgetKey]?.enabled ?? false,
        config: { ...(prev[widgetKey]?.config || {}), username: value },
      },
    }));
  };

  const saveWidgetUsername = (widgetKey: string) => {
    const current = widgets[widgetKey];
    if (!current?.config?.username) return;
    saveWidget(widgetKey, current.enabled, current.config);
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
      </p>

      <div className="space-y-3">
        {WIDGET_REGISTRY.map((widget) => {
          const state = widgets[widget.key] || { enabled: false, config: {} };
          return (
            <div
              key={widget.key}
              className="p-4 border border-border rounded-lg bg-card/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{widget.icon}</span>
                  <div>
                    <div className="font-medium">{widget.name}</div>
                    <div className="text-xs text-muted-foreground">{widget.description}</div>
                  </div>
                </div>
                <Switch
                  checked={state.enabled}
                  onCheckedChange={(checked) => toggleWidget(widget.key, checked)}
                  disabled={saving === widget.key}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{widget.usernameLabel}</label>
                <div className="flex gap-2">
                  <Input
                    value={state.config?.username || ""}
                    onChange={(e) => updateWidgetUsername(widget.key, e.target.value)}
                    placeholder={widget.usernamePlaceholder}
                    className="flex-1"
                  />
                  <button
                    onClick={() => saveWidgetUsername(widget.key)}
                    disabled={saving === widget.key || !state.config?.username}
                    className="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Who can see this widget?</label>
                <div className="flex gap-2">
                  <Select
                    value={state.config?.min_friendship_level || "public"}
                    onValueChange={(value) => {
                      setWidgets((prev) => ({
                        ...prev,
                        [widget.key]: {
                          enabled: prev[widget.key]?.enabled ?? false,
                          config: { ...(prev[widget.key]?.config || {}), min_friendship_level: value },
                        },
                      }));
                      const current = widgets[widget.key] || { enabled: false, config: {} };
                      saveWidget(widget.key, current.enabled, { ...current.config, min_friendship_level: value });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileWidgetsManager;
