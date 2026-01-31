import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface HostingPreferences {
  id?: string;
  is_open_to_hosting: boolean;
  hosting_description: string | null;
  accommodation_type: string | null;
  max_guests: number;
  min_friendship_level: string;
}

interface HostingPreferencesManagerProps {
  userId: string;
}

export const HostingPreferencesManager = ({ userId }: HostingPreferencesManagerProps) => {
  const [preferences, setPreferences] = useState<HostingPreferences>({
    is_open_to_hosting: false,
    hosting_description: null,
    accommodation_type: null,
    max_guests: 1,
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
        .from("hosting_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          id: data.id,
          is_open_to_hosting: data.is_open_to_hosting,
          hosting_description: data.hosting_description,
          accommodation_type: data.accommodation_type,
          max_guests: data.max_guests || 1,
          min_friendship_level: data.min_friendship_level,
        });
      }
    } catch (error) {
      console.error("Error loading hosting preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (preferences.id) {
        const { error } = await supabase
          .from("hosting_preferences")
          .update({
            is_open_to_hosting: preferences.is_open_to_hosting,
            hosting_description: preferences.hosting_description,
            accommodation_type: preferences.accommodation_type,
            max_guests: preferences.max_guests,
            min_friendship_level: preferences.min_friendship_level,
          })
          .eq("id", preferences.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("hosting_preferences")
          .insert({
            user_id: userId,
            is_open_to_hosting: preferences.is_open_to_hosting,
            hosting_description: preferences.hosting_description,
            accommodation_type: preferences.accommodation_type,
            max_guests: preferences.max_guests,
            min_friendship_level: preferences.min_friendship_level,
          })
          .select()
          .single();

        if (error) throw error;
        setPreferences({ ...preferences, id: data.id });
      }

      toast.success("Hosting preferences saved!");
    } catch (error) {
      console.error("Error saving hosting preferences:", error);
      toast.error("Failed to save hosting preferences");
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
          <Home className="w-5 h-5" />
          Hosting Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="hosting-toggle">Open to Hosting</Label>
            <p className="text-sm text-muted-foreground">
              Allow friends to request to stay with you
            </p>
          </div>
          <Switch
            id="hosting-toggle"
            checked={preferences.is_open_to_hosting}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, is_open_to_hosting: checked })
            }
          />
        </div>

        {preferences.is_open_to_hosting && (
          <>
            <div className="space-y-2">
              <Label>Who can request hosting?</Label>
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
              <Label htmlFor="accommodation-type">Accommodation Type</Label>
              <Select
                value={preferences.accommodation_type || ""}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, accommodation_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select accommodation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private_room">Private Room</SelectItem>
                  <SelectItem value="shared_room">Shared Room</SelectItem>
                  <SelectItem value="couch">Couch</SelectItem>
                  <SelectItem value="floor_space">Floor Space</SelectItem>
                  <SelectItem value="guest_house">Guest House / Separate Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-guests">Maximum Guests</Label>
              <Input
                id="max-guests"
                type="number"
                min="1"
                max="10"
                value={preferences.max_guests}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    max_guests: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hosting-description">
                Describe your hosting situation
              </Label>
              <Textarea
                id="hosting-description"
                placeholder="e.g., I have a spare room with a comfortable bed, shared bathroom. Quiet neighborhood, close to public transit. Pets in the house. Kitchen access available..."
                value={preferences.hosting_description || ""}
                onChange={(e) =>
                  setPreferences({ ...preferences, hosting_description: e.target.value })
                }
                rows={4}
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
          Save Hosting Preferences
        </Button>
      </CardContent>
    </Card>
  );
};
