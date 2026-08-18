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
  /** kept for call-site compatibility; the server now applies the threshold */
  friendshipLevel?: string | null;
}

export function ProfileConstellation({ userId, viewerId, displayName, isOwnProfile }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [named, setNamed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Server decides everything: whether the constellation is shown at all
        // (owner's 'hidden' setting / blocks), which tiers are included, and
        // whether the caller meets the owner's threshold for names + links.
        // Identity columns come back NULL when they don't.
        const { data, error } = await supabase.rpc("get_constellation", { profile_id: userId });
        if (error) throw error;
        const rows = data || [];
        setNamed(rows.length > 0 && rows.every((r) => r.named));
        setFriends(
          rows.map((r, i) => ({
            id: r.id ?? `anon-${i}`,
            friend_id: r.friend_id ?? "",
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
  }, [userId, viewerId]);

  if (loading || friends.length === 0) return null;

  const showInteractive = isOwnProfile || named;

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
