import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OPTIONS = [
  { value: "nobody", label: "Nobody", description: "Everyone sees anonymous dots" },
  { value: "close_friend", label: "Oath Bound (Close Friends)", description: "Only close friends see names" },
  { value: "family", label: "Blood Bound (Family)", description: "Family and above see names" },
  { value: "buddy", label: "Companion+ (Buddies+)", description: "Companions and above see names" },
  { value: "friendly_acquaintance", label: "Wayfarer+ (Acquaintances+)", description: "All friends see names" },
  { value: "everyone", label: "Everyone", description: "Any logged-in user sees names" },
];

interface Props {
  userId: string;
}

export function ConstellationVisibilitySection({ userId }: Props) {
  const [value, setValue] = useState("nobody");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("constellation_visibility")
        .eq("id", userId)
        .single();
      if (data?.constellation_visibility) setValue(data.constellation_visibility);
      setLoaded(true);
    })();
  }, [userId]);

  const handleChange = async (next: string) => {
    const prev = value;
    setValue(next);
    const { error } = await supabase
      .from("profiles")
      .update({ constellation_visibility: next })
      .eq("id", userId);
    if (error) {
      setValue(prev);
      toast.error("Failed to save setting");
    } else {
      toast.success("Constellation visibility updated");
    }
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Constellation Visibility
        </CardTitle>
        <CardDescription>
          Choose who can see the names and profiles of friends in your star map.
          Everyone else sees anonymous dots showing the shape of your network.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="constellation-vis">Show friend details to:</Label>
          <Select value={value} onValueChange={handleChange}>
            <SelectTrigger id="constellation-vis" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div>
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{opt.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
