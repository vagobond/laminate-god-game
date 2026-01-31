import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coffee, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MeetupPreferences {
  id?: string;
  is_open_to_meetups: boolean;
  meetup_description: string | null;
  min_friendship_level: string;
}

interface MeetupPreferencesManagerProps {
  userId: string;
}

export const MeetupPreferencesManager = ({ userId }: MeetupPreferencesManagerProps) => {
  const [preferences, setPreferences] = useState<MeetupPreferences>({
    is_open_to_meetups: false,
    meetup_description: null,
    min_friendship_level: "buddy",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("meetup_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          id: data.id,
          is_open_to_meetups: data.is_open_to_meetups,
          meetup_description: data.meetup_description,
          min_friendship_level: data.min_friendship_level,
        });
      }
    } catch (error) {
      console.error("Error loading meetup preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (preferences.id) {
        const { error } = await supabase
          .from("meetup_preferences")
          .update({
            is_open_to_meetups: preferences.is_open_to_meetups,
            meetup_description: preferences.meetup_description,
            min_friendship_level: preferences.min_friendship_level,
          })
          .eq("id", preferences.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("meetup_preferences")
          .insert({
            user_id: userId,
            is_open_to_meetups: preferences.is_open_to_meetups,
            meetup_description: preferences.meetup_description,
            min_friendship_level: preferences.min_friendship_level,
          })
          .select()
          .single();

        if (error) throw error;
        setPreferences({ ...preferences, id: data.id });
      }

      toast.success("Meetup preferences saved!");
    } catch (error) {
      console.error("Error saving meetup preferences:", error);
      toast.error("Failed to save meetup preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coffee className="w-5 h-5" />
          Meetup Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="meetup-toggle">Open to Meetups</Label>
            <p className="text-sm text-muted-foreground">
              Allow friends to request meetups with you
            </p>
          </div>
          <Switch
            id="meetup-toggle"
            checked={preferences.is_open_to_meetups}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, is_open_to_meetups: checked })
            }
          />
        </div>

        {preferences.is_open_to_meetups && (
          <>
            <div className="space-y-2">
              <Label>Who can request meetups?</Label>
              <Select
                value={preferences.min_friendship_level}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, min_friendship_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly_acquaintance">Wayfarers (Acquaintances) & Above</SelectItem>
                  <SelectItem value="buddy">Companions (Buddies) & Above</SelectItem>
                  <SelectItem value="close_friend">Oath Bound (Close Friends) Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetup-description">
                Describe the kind of meetups you're interested in
              </Label>
              <Textarea
                id="meetup-description"
                placeholder="e.g., Happy to grab coffee, go for walks, show visitors around my neighborhood, try new restaurants..."
                value={preferences.meetup_description || ""}
                onChange={(e) =>
                  setPreferences({ ...preferences, meetup_description: e.target.value })
                }
                rows={3}
              />
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Meetup Preferences
        </Button>
      </CardContent>
    </Card>
  );
};
