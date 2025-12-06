import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, UserX } from "lucide-react";
import { toast } from "sonner";

interface BlockedUser {
  id: string;
  blocked_id: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const BlockedUsersManager = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_blocks")
        .select("id, blocked_id")
        .eq("blocker_id", user.id);

      if (error) throw error;

      const blockedWithProfiles = await Promise.all(
        (data || []).map(async (block) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", block.blocked_id)
            .single();

          return {
            ...block,
            profile: profileData || undefined,
          };
        })
      );

      setBlockedUsers(blockedWithProfiles);
    } catch (error) {
      console.error("Error loading blocked users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId: string, displayName: string | null) => {
    try {
      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("id", blockId);

      if (error) throw error;

      setBlockedUsers((prev) => prev.filter((b) => b.id !== blockId));
      toast.success(`Unblocked ${displayName || "user"}`);
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("Failed to unblock user");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Loading blocked users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Blocked Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        {blockedUsers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No blocked users</p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((block) => (
              <div
                key={block.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={block.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    <UserX className="w-5 h-5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {block.profile?.display_name || "Unknown User"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(block.id, block.profile?.display_name || null)}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BlockedUsersManager;
