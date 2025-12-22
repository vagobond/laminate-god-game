import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserMinus, Edit2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SendMessageDialog from "@/components/SendMessageDialog";

interface Friend {
  id: string;
  friend_id: string;
  level: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface FriendsListProps {
  userId: string;
  viewerId?: string | null;
  showLevels?: boolean;
}

type FriendshipLevel = "close_friend" | "buddy" | "friendly_acquaintance" | "secret_friend" | "fake_friend" | "secret_enemy";

const levelLabels: Record<string, string> = {
  close_friend: "Close Friend",
  buddy: "Buddy",
  friendly_acquaintance: "Acquaintance",
  secret_friend: "Secret Friend",
  fake_friend: "Friend", // Display as normal friend to the fake friend
  secret_enemy: "Close Friend", // Display as close friend to the secret enemy
};

const FriendsList = ({ userId, viewerId, showLevels = false }: FriendsListProps) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSeeLevels, setCanSeeLevels] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [unfriendingFriend, setUnfriendingFriend] = useState<Friend | null>(null);
  const [messagingFriend, setMessagingFriend] = useState<Friend | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<FriendshipLevel>("buddy");
  const [processing, setProcessing] = useState(false);
  const isOwnProfile = viewerId === userId;

  useEffect(() => {
    loadFriends();
    if (viewerId && viewerId !== userId) {
      checkMutualCloseFriend();
    } else if (viewerId === userId) {
      setCanSeeLevels(true);
    }
  }, [userId, viewerId]);

  const checkMutualCloseFriend = async () => {
    if (!viewerId) return;
    
    // Check if viewer and profile owner are mutual close friends
    const { data } = await supabase.rpc("are_mutual_close_friends", {
      user1_id: viewerId,
      user2_id: userId,
    });
    
    setCanSeeLevels(data === true);
  };

  const loadFriends = async () => {
    try {
      // Get friendships where this user has added friends
      const { data, error } = await supabase
        .from("friendships")
        .select("id, friend_id, level")
        .eq("user_id", userId);

      if (error) throw error;

      // For non-owners: hide secret_friend, fake_friend, secret_enemy
      // For owners: show all friends
      const visibleFriends = (data || []).filter((f) => {
        if (viewerId === userId) return true; // Owner sees all
        // Non-owners don't see secret categories
        return !["secret_friend", "fake_friend", "secret_enemy"].includes(f.level);
      });

      // Get all friend IDs to batch fetch profiles
      const friendIds = visibleFriends.map((f) => f.friend_id);
      
      // Batch fetch all profiles at once
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", friendIds);

      // Create a map for quick lookup
      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );

      // Merge profiles with friendships
      const friendsWithProfiles = visibleFriends.map((friend) => ({
        ...friend,
        profile: profilesMap.get(friend.friend_id) || undefined,
      }));

      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmUnfriend = async () => {
    if (!unfriendingFriend) return;
    
    try {
      // Delete my friendship with them
      const { error: error1 } = await supabase
        .from("friendships")
        .delete()
        .eq("id", unfriendingFriend.id);

      if (error1) throw error1;

      // Also delete their friendship with me (if exists)
      await supabase
        .from("friendships")
        .delete()
        .eq("user_id", unfriendingFriend.friend_id)
        .eq("friend_id", userId);

      setFriends((prev) => prev.filter((f) => f.id !== unfriendingFriend.id));
      toast.success(`Unfriended ${unfriendingFriend.profile?.display_name || "user"}`);
    } catch (error) {
      console.error("Error unfriending:", error);
      toast.error("Failed to unfriend");
    } finally {
      setUnfriendingFriend(null);
    }
  };

  const handleEditLevel = (friend: Friend) => {
    setEditingFriend(friend);
    setSelectedLevel(friend.level as FriendshipLevel);
  };

  const handleUpdateLevel = async () => {
    if (!editingFriend) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from("friendships")
        .update({ level: selectedLevel })
        .eq("id", editingFriend.id);

      if (error) throw error;

      setFriends((prev) =>
        prev.map((f) =>
          f.id === editingFriend.id ? { ...f, level: selectedLevel } : f
        )
      );
      toast.success("Friendship level updated!");
      setEditingFriend(null);
    } catch (error) {
      console.error("Error updating level:", error);
      toast.error("Failed to update friendship level");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Loading friends...</p>
        </CardContent>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No friends yet</p>
        </CardContent>
      </Card>
    );
  }

  // Separate regular friends from hidden categories for the owner
  const regularFriends = friends.filter(f => !["secret_friend", "fake_friend", "secret_enemy"].includes(f.level));
  const secretFriends = friends.filter(f => f.level === "secret_friend");
  const fakeFriends = friends.filter(f => f.level === "fake_friend");
  const secretEnemies = friends.filter(f => f.level === "secret_enemy");

  const renderFriendItem = (friend: Friend, showLevelBadge = false) => (
    <div
      key={friend.id}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
    >
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/u/${friend.friend_id}`)}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={friend.profile?.avatar_url || undefined} />
          <AvatarFallback>
            {(friend.profile?.display_name || "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {friend.profile?.display_name || "Unknown"}
          </p>
        </div>
        {/* Only show level badges to the profile owner */}
        {showLevelBadge && isOwnProfile && !["secret_friend", "fake_friend", "secret_enemy"].includes(friend.level) && (
          <Badge variant="secondary" className="text-xs">
            {levelLabels[friend.level] || friend.level}
          </Badge>
        )}
      </div>
      {isOwnProfile && (
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setMessagingFriend(friend);
                }}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditLevel(friend);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit friendship level</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setUnfriendingFriend(friend);
                }}
              >
                <UserMinus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Unfriend</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friends ({regularFriends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {regularFriends.length > 0 ? (
            <div className="space-y-2">
              {regularFriends.map((friend) => renderFriendItem(friend, isOwnProfile))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No friends yet</p>
          )}

          {/* Owner-only: Secret Friends */}
          {isOwnProfile && secretFriends.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-purple-500 mb-3">Secret Friends ({secretFriends.length})</h4>
              <div className="space-y-2">
                {secretFriends.map((friend) => renderFriendItem(friend, false))}
              </div>
            </div>
          )}

          {/* Owner-only: Fake Friends */}
          {isOwnProfile && fakeFriends.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-orange-500 mb-3">Fake Friends ({fakeFriends.length})</h4>
              <p className="text-xs text-muted-foreground mb-2">They think they're your friend, but get no real access.</p>
              <div className="space-y-2">
                {fakeFriends.map((friend) => renderFriendItem(friend, false))}
              </div>
            </div>
          )}

          {/* Owner-only: Secret Enemies */}
          {isOwnProfile && secretEnemies.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-red-500 mb-3">Secret Enemies ({secretEnemies.length})</h4>
              <p className="text-xs text-muted-foreground mb-2">They think they're close friends, but see decoy info.</p>
              <div className="space-y-2">
                {secretEnemies.map((friend) => renderFriendItem(friend, false))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for editing friendship level */}
      <Dialog open={!!editingFriend} onOpenChange={(open) => !open && setEditingFriend(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Friendship Level</DialogTitle>
            <DialogDescription>
              Change how you classify {editingFriend?.profile?.display_name || "this friend"}.
            </DialogDescription>
          </DialogHeader>
          
          <RadioGroup value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as FriendshipLevel)} className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="close_friend" id="edit_close_friend" className="mt-1" />
              <Label htmlFor="edit_close_friend" className="flex-1 cursor-pointer">
                <span className="font-medium">Close Friend</span>
                <p className="text-sm text-muted-foreground">Can see your WhatsApp, phone number, or private email.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="buddy" id="edit_buddy" className="mt-1" />
              <Label htmlFor="edit_buddy" className="flex-1 cursor-pointer">
                <span className="font-medium">Buddy</span>
                <p className="text-sm text-muted-foreground">Can see your Instagram or other social profile.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="friendly_acquaintance" id="edit_friendly_acquaintance" className="mt-1" />
              <Label htmlFor="edit_friendly_acquaintance" className="flex-1 cursor-pointer">
                <span className="font-medium">Friendly Acquaintance</span>
                <p className="text-sm text-muted-foreground">Can see your LinkedIn or general contact email.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="secret_friend" id="edit_secret_friend" className="mt-1" />
              <Label htmlFor="edit_secret_friend" className="flex-1 cursor-pointer">
                <span className="font-medium">Secret Friend</span>
                <p className="text-sm text-muted-foreground">All privileges of close friend, but hidden from friends lists.</p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border border-amber-500/50 hover:bg-amber-500/10">
              <RadioGroupItem value="fake_friend" id="edit_fake_friend" className="mt-1" />
              <Label htmlFor="edit_fake_friend" className="flex-1 cursor-pointer">
                <span className="font-medium text-amber-600">Fake Friend</span>
                <p className="text-sm text-muted-foreground">They'll think you're friends, but they get no access.</p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border border-red-500/50 hover:bg-red-500/10">
              <RadioGroupItem value="secret_enemy" id="edit_secret_enemy" className="mt-1" />
              <Label htmlFor="edit_secret_enemy" className="flex-1 cursor-pointer">
                <span className="font-medium text-red-600">Secret Enemy</span>
                <p className="text-sm text-muted-foreground">They'll think you're close friends, but only see generic/fake info.</p>
              </Label>
            </div>
          </RadioGroup>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleUpdateLevel} disabled={processing} className="flex-1">
              {processing ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setEditingFriend(null)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for unfriending */}
      <AlertDialog open={!!unfriendingFriend} onOpenChange={(open) => !open && setUnfriendingFriend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfriend {unfriendingFriend?.profile?.display_name || "this person"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from your friends list and you from theirs. You can always send a new friend request later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnfriend}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unfriend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Message dialog */}
      {messagingFriend && (
        <SendMessageDialog
          recipientId={messagingFriend.friend_id}
          recipientName={messagingFriend.profile?.display_name || "Unknown"}
          friendshipLevel={messagingFriend.level}
          open={!!messagingFriend}
          onOpenChange={(open) => !open && setMessagingFriend(null)}
        />
      )}
    </>
  );
};

export default FriendsList;