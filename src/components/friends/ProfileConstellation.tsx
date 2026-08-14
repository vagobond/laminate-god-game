import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { ConstellationView } from "./ConstellationView";
import type { Friend } from "./types";

interface Props {
  userId: string;
  viewerId: string | null;
  displayName: string;
  isOwnProfile: boolean;
  friendshipLevel: string | null;
}

// Ordered from most trusted to least. A viewer qualifies if their level
// appears at or before the threshold in this list.
const LEVEL_ORDER = ["close_friend", "family", "buddy", "friendly_acquaintance"];

function viewerMeetsThreshold(viewerLevel: string | null, threshold: string): boolean {
  if (threshold === "everyone") return true;
  if (threshold === "nobody") return false;
  if (!viewerLevel) return false;
  // secret_friend gets close_friend-equivalent access
  const effective = viewerLevel === "secret_friend" ? "close_friend" : viewerLevel;
  if (effective === "secret_enemy") return false;
  const viewerIdx = LEVEL_ORDER.indexOf(effective);
  const threshIdx = LEVEL_ORDER.indexOf(threshold);
  if (viewerIdx === -1 || threshIdx === -1) return false;
  return viewerIdx <= threshIdx;
}

export function ProfileConstellation({ userId, viewerId, displayName, isOwnProfile, friendshipLevel }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [constellationVis, setConstellationVis] = useState<string>("nobody");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch the profile owner's constellation_visibility setting
        const { data: profile } = await supabase
          .from("profiles")
          .select("constellation_visibility")
          .eq("id", userId)
          .single();
        setConstellationVis(profile?.constellation_visibility ?? "nobody");

        const { data, error } = await supabase.rpc("get_visible_friends", {
          profile_id: userId,
          viewer_id: viewerId ?? null,
        });
        if (error) throw error;
        const hiddenLevels = isOwnProfile
          ? ["secret_enemy"]
          : ["secret_friend", "secret_enemy"];
        setFriends(
          (data || [])
            .filter((r: any) => !hiddenLevels.includes(r.level))
            .map((r: any) => ({
              id: r.id,
              friend_id: r.friend_id,
              level: r.level,
              profile: { display_name: r.display_name, avatar_url: r.avatar_url },
            }))
        );
      } catch {
        setFriends([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, viewerId, isOwnProfile]);

  if (loading || friends.length === 0) return null;

  const showInteractive = isOwnProfile || viewerMeetsThreshold(friendshipLevel, constellationVis);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          {isOwnProfile ? "Your Constellation" : `${displayName}'s Constellation`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <ConstellationView
          friends={friends}
          anonymous={!showInteractive}
          centerLabel={isOwnProfile ? "you" : displayName.split(" ")[0]}
        />
      </CardContent>
    </Card>
  );
}
