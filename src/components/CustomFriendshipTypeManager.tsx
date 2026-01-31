import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CustomFriendshipType {
  id: string;
  user_id: string;
  name: string;
  show_linkedin: boolean;
  show_contact_email: boolean;
  show_instagram: boolean;
  show_whatsapp: boolean;
  show_phone: boolean;
  show_private_email: boolean;
  show_hometown_coords: boolean;
  show_birthday_day_month: boolean;
  show_birthday_year: boolean;
  show_home_address: boolean;
  show_mailing_address: boolean;
  show_nicknames: boolean;
  can_leave_reference: boolean;
}

interface Props {
  userId: string;
}

const DEFAULT_VISIBILITY = {
  show_linkedin: false,
  show_contact_email: false,
  show_instagram: false,
  show_whatsapp: false,
  show_phone: false,
  show_private_email: false,
  show_hometown_coords: false,
  show_birthday_day_month: false,
  show_birthday_year: false,
  show_home_address: false,
  show_mailing_address: false,
  show_nicknames: false,
  can_leave_reference: false,
};

const FIELD_LABELS: Record<keyof typeof DEFAULT_VISIBILITY, string> = {
  show_linkedin: "LinkedIn Profile",
  show_contact_email: "Contact Email",
  show_instagram: "Instagram Profile",
  show_whatsapp: "WhatsApp Number",
  show_phone: "Phone Number",
  show_private_email: "Private Email",
  show_hometown_coords: "Hometown GPS Coordinates",
  show_birthday_day_month: "Birthday (Day & Month)",
  show_birthday_year: "Birthday Year",
  show_home_address: "Home Address",
  show_mailing_address: "Mailing Address",
  show_nicknames: "Nicknames",
  can_leave_reference: "Can Leave References",
};

export function CustomFriendshipTypeManager({ userId }: Props) {
  const [customType, setCustomType] = useState<CustomFriendshipType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState(DEFAULT_VISIBILITY);

  useEffect(() => {
    loadCustomType();
  }, [userId]);

  const loadCustomType = async () => {
    try {
      const { data, error } = await supabase
        .from("custom_friendship_types")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCustomType(data as CustomFriendshipType);
        setName(data.name);
        setVisibility({
          show_linkedin: data.show_linkedin,
          show_contact_email: data.show_contact_email,
          show_instagram: data.show_instagram,
          show_whatsapp: data.show_whatsapp,
          show_phone: data.show_phone,
          show_private_email: data.show_private_email,
          show_hometown_coords: data.show_hometown_coords,
          show_birthday_day_month: data.show_birthday_day_month,
          show_birthday_year: data.show_birthday_year,
          show_home_address: data.show_home_address,
          show_mailing_address: data.show_mailing_address,
          show_nicknames: data.show_nicknames,
          can_leave_reference: data.can_leave_reference,
        });
      }
    } catch (error) {
      console.error("Error loading custom friendship type:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for your custom friendship type");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("custom_friendship_types")
        .insert({
          user_id: userId,
          name: name.trim(),
          ...visibility,
        })
        .select()
        .single();

      if (error) throw error;

      setCustomType(data as CustomFriendshipType);
      setIsCreating(false);
      toast.success("Custom friendship type created!");
    } catch (error) {
      console.error("Error creating custom friendship type:", error);
      toast.error("Failed to create custom friendship type");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!customType || !name.trim()) {
      toast.error("Please enter a name for your custom friendship type");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("custom_friendship_types")
        .update({
          name: name.trim(),
          ...visibility,
        })
        .eq("id", customType.id);

      if (error) throw error;

      setCustomType(prev => prev ? { ...prev, name: name.trim(), ...visibility } : null);
      toast.success("Custom friendship type saved!");
    } catch (error) {
      console.error("Error saving custom friendship type:", error);
      toast.error("Failed to save custom friendship type");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!customType) return;

    setSaving(true);
    try {
      // First remove custom type assignment from all friendships
      await supabase
        .from("friendships")
        .update({ uses_custom_type: false })
        .eq("user_id", userId)
        .eq("uses_custom_type", true);

      // Then delete the custom type
      const { error } = await supabase
        .from("custom_friendship_types")
        .delete()
        .eq("id", customType.id);

      if (error) throw error;

      setCustomType(null);
      setName("");
      setVisibility(DEFAULT_VISIBILITY);
      toast.success("Custom friendship type deleted");
    } catch (error) {
      console.error("Error deleting custom friendship type:", error);
      toast.error("Failed to delete custom friendship type");
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = (field: keyof typeof DEFAULT_VISIBILITY) => {
    setVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Show create button if no custom type exists
  if (!customType && !isCreating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Custom Friendship Type
          </CardTitle>
          <CardDescription>
            Create a custom friendship level with your own name and visibility settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsCreating(true)} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Type
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Custom Friendship Type
            </CardTitle>
            <CardDescription>
              {customType 
                ? "Configure what friends in this custom group can see"
                : "Create a custom friendship level with your own name and visibility settings"
              }
            </CardDescription>
          </div>
          {customType && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Custom Friendship Type?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the custom type and reset all friends assigned to it back to their default level.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="custom-type-name">Name</Label>
          <Input
            id="custom-type-name"
            placeholder="e.g., Work Friends, Relatives, Bowling Companions..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            This is what you'll call this group of friends
          </p>
        </div>

        <div className="space-y-4">
          <Label>Visibility Settings</Label>
          <p className="text-xs text-muted-foreground mb-4">
            Choose what information friends in this custom group can see
          </p>
          
          <div className="grid gap-3">
            {(Object.keys(FIELD_LABELS) as Array<keyof typeof DEFAULT_VISIBILITY>).map((field) => (
              <div key={field} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm">{FIELD_LABELS[field]}</span>
                <Switch
                  checked={visibility[field]}
                  onCheckedChange={() => toggleVisibility(field)}
                />
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={customType ? handleSave : handleCreate} 
          disabled={saving || !name.trim()}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {customType ? "Save Changes" : "Create Custom Type"}
            </>
          )}
        </Button>

        {isCreating && !customType && (
          <Button 
            variant="ghost" 
            onClick={() => {
              setIsCreating(false);
              setName("");
              setVisibility(DEFAULT_VISIBILITY);
            }}
            className="w-full"
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
