import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserMinus, Edit2, MessageSquare, UserPlus, Clock, X, Check } from "lucide-react";
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
  uses_custom_type?: boolean;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string | null;
  created_at: string;
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

type FriendshipLevel = "close_friend" | "family" | "buddy" | "friendly_acquaintance" | "secret_friend" | "secret_enemy";
type FriendshipSelection = FriendshipLevel | "custom";

interface CustomFriendshipType {
  id: string;
  name: string;
}

const levelLabels: Record<string, string> = {
  close_friend: "Close Friend",
  family: "Family",
  buddy: "Buddy",
  friendly_acquaintance: "Acquaintance",
  secret_friend: "Secret Friend",
  secret_enemy: "Friend", // Display as normal friend to the secret enemy
};

const FriendsList = ({ userId, viewerId, showLevels = false }: FriendsListProps) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSeeLevels, setCanSeeLevels] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [unfriendingFriend, setUnfriendingFriend] = useState<Friend | null>(null);
  const [messagingFriend, setMessagingFriend] = useState<Friend | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<FriendshipLevel>("buddy");
  const [selectedUsesCustomType, setSelectedUsesCustomType] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [customFriendshipType, setCustomFriendshipType] = useState<CustomFriendshipType | null>(null);
  const [acceptingRequest, setAcceptingRequest] = useState<FriendRequest | null>(null);
  const [acceptLevel, setAcceptLevel] = useState<FriendshipSelection>("buddy");
  const isOwnProfile = viewerId === userId;

  useEffect(() => {
    loadFriends();
    if (viewerId && viewerId !== userId) {
      checkMutualCloseFriend();
    } else if (viewerId === userId) {
      setCanSeeLevels(true);
      loadCustomFriendshipType();
      loadFriendRequests();
    }
  }, [userId, viewerId]);

  const loadCustomFriendshipType = async () => {
    if (!viewerId) return;
    
    try {
      const { data, error } = await supabase
        .from("custom_friendship_types")
        .select("id, name")
        .eq("user_id", viewerId)
        .maybeSingle();
      
      if (error) throw error;
      setCustomFriendshipType(data);
    } catch (error) {
      console.error("Error loading custom friendship type:", error);
    }
  };

  const loadFriendRequests = async () => {
    if (!viewerId) return;
    
    try {
      // Load sent requests
      const { data: sentData, error: sentError } = await supabase
        .from("friend_requests")
        .select("id, from_user_id, to_user_id, message, created_at")
        .eq("from_user_id", viewerId);
      
      if (sentError) throw sentError;
      
      // Load received requests
      const { data: receivedData, error: receivedError } = await supabase
        .from("friend_requests")
        .select("id, from_user_id, to_user_id, message, created_at")
        .eq("to_user_id", viewerId);
      
      if (receivedError) throw receivedError;
      
      // Fetch profiles for sent requests (to_user_id)
      const sentUserIds = (sentData || []).map(r => r.to_user_id);
      const receivedUserIds = (receivedData || []).map(r => r.from_user_id);
      const allUserIds = [...new Set([...sentUserIds, ...receivedUserIds])];
      
      let profilesMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      
      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", allUserIds);
        
        (profilesData || []).forEach(p => {
          profilesMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
        });
      }
      
      setSentRequests((sentData || []).map(r => ({
        ...r,
        profile: profilesMap.get(r.to_user_id)
      })));
      
      setReceivedRequests((receivedData || []).map(r => ({
        ...r,
        profile: profilesMap.get(r.from_user_id)
      })));
    } catch (error) {
      console.error("Error loading friend requests:", error);
    }
  };

  const cancelSentRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);
      
      if (error) throw error;
      
      setSentRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success("Friend request cancelled");
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);
      
      if (error) throw error;
      
      setReceivedRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success("Friend request declined");
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error("Failed to decline request");
    }
  };

  const handleAcceptRequest = async () => {
    if (!acceptingRequest) return;
    
    setProcessing(true);
    try {
      // Determine the actual level to use
      const levelToUse = acceptLevel === "custom" ? "buddy" : acceptLevel;
      
      const { error } = await supabase.rpc("accept_friend_request", {
        request_id: acceptingRequest.id,
        friendship_level: levelToUse
      });
      
      if (error) throw error;
      
      // If custom type, update the friendship to use custom type
      if (acceptLevel === "custom" && customFriendshipType) {
        const { error: updateError } = await supabase
          .from("friendships")
          .update({ uses_custom_type: true })
          .eq("user_id", viewerId)
          .eq("friend_id", acceptingRequest.from_user_id);
        
        if (updateError) {
          console.error("Error setting custom type:", updateError);
        }
      }
      
      toast.success("Friend request accepted!");
      setReceivedRequests(prev => prev.filter(r => r.id !== acceptingRequest.id));
      setAcceptingRequest(null);
      setAcceptLevel("buddy");
      loadFriends();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    } finally {
      setProcessing(false);
    }
  };

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
      setLoading(true);

      // Use backend function so logged-out viewers can still see public friends + basic friend profile info.
      // (Direct reads from `profiles` are auth-gated.)
      const { data, error } = await supabase.rpc("get_visible_friends", {
        profile_id: userId,
        viewer_id: viewerId ?? null,
      });

      if (error) throw error;

      // Get uses_custom_type for each friend (only needed for own profile)
      let friendsWithCustomType: Friend[] = [];
      
      if (viewerId === userId) {
        // Fetch uses_custom_type for all friendships
        const friendshipIds = (data || []).map((row: any) => row.id);
        const { data: customTypeData } = await supabase
          .from("friendships")
          .select("id, uses_custom_type")
          .in("id", friendshipIds);
        
        const customTypeMap = new Map(
          (customTypeData || []).map((f: any) => [f.id, f.uses_custom_type])
        );
        
        friendsWithCustomType = (data || []).map((row: any) => ({
          id: row.id,
          friend_id: row.friend_id,
          level: row.level,
          uses_custom_type: customTypeMap.get(row.id) || false,
          profile: {
            display_name: row.display_name,
            avatar_url: row.avatar_url,
          },
        }));
      } else {
        friendsWithCustomType = (data || []).map((row: any) => ({
          id: row.id,
          friend_id: row.friend_id,
          level: row.level,
          profile: {
            display_name: row.display_name,
            avatar_url: row.avatar_url,
          },
        }));
      }

      setFriends(friendsWithCustomType);
    } catch (error) {
      console.error("Error loading friends:", error);
      setFriends([]);
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

  const handleEditLevel = async (friend: Friend) => {
    // Check if this friend uses custom type
    const { data } = await supabase
      .from("friendships")
      .select("uses_custom_type")
      .eq("id", friend.id)
      .single();
    
    setEditingFriend(friend);
    setSelectedUsesCustomType(data?.uses_custom_type || false);
    setSelectedLevel(friend.level as FriendshipLevel);
  };

  const handleUpdateLevel = async () => {
    if (!editingFriend) return;
    setProcessing(true);

    try {
      // When using custom type, store as "buddy" in DB (for RLS purposes) but set the flag
      const levelToStore = selectedUsesCustomType ? "buddy" : selectedLevel;
      
      const { error } = await supabase
        .from("friendships")
        .update({ 
          level: levelToStore,
          uses_custom_type: selectedUsesCustomType
        })
        .eq("id", editingFriend.id);

      if (error) throw error;

      setFriends((prev) =>
        prev.map((f) =>
          f.id === editingFriend.id 
            ? { ...f, level: levelToStore, uses_custom_type: selectedUsesCustomType } 
            : f
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

  const handleSelectCustomType = () => {
    setSelectedUsesCustomType(true);
    // Custom type uses buddy as the base level for RLS purposes
    setSelectedLevel("buddy");
  };

  const handleSelectStandardLevel = (level: FriendshipLevel) => {
    setSelectedUsesCustomType(false);
    setSelectedLevel(level);
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
  const regularFriends = friends.filter(f => !["secret_friend", "secret_enemy"].includes(f.level));
  const secretFriends = friends.filter(f => f.level === "secret_friend");
  const secretEnemies = friends.filter(f => f.level === "secret_enemy");

  const renderFriendItem = (friend: Friend, showLevelBadge = false) => (
    <div
      key={friend.id}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
    >
      <Avatar 
        className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        onClick={() => navigate(`/u/${friend.friend_id}`)}
      >
        <AvatarImage src={friend.profile?.avatar_url || undefined} />
        <AvatarFallback>
          {(friend.profile?.display_name || "?").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/u/${friend.friend_id}`)}
      >
        <p className="font-medium truncate hover:text-primary transition-colors">
          {friend.profile?.display_name || "Unknown"}
        </p>
      </div>
      {/* Only show level badges to the profile owner */}
      {showLevelBadge && isOwnProfile && !["secret_friend", "secret_enemy"].includes(friend.level) && (
        <Badge 
          variant={friend.uses_custom_type ? "default" : "secondary"} 
          className={`text-xs ${friend.uses_custom_type ? "bg-primary/80" : ""}`}
        >
          {friend.uses_custom_type && customFriendshipType 
            ? customFriendshipType.name 
            : (levelLabels[friend.level] || friend.level)}
        </Badge>
      )}
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
          <CardTitle 
            className="text-lg flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate("/the-forest")}
          >
            <Users className="w-5 h-5" />
            Friends ({regularFriends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Owner-only: Incoming Friend Requests */}
          {isOwnProfile && receivedRequests.length > 0 && (
            <div className="mb-6 pb-4 border-b border-border">
              <h4 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Friend Requests ({receivedRequests.length})
              </h4>
              <p className="text-xs text-muted-foreground mb-2">People who want to be your friend</p>
              <div className="space-y-2">
                {receivedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/u/${request.from_user_id}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {(request.profile?.display_name || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {request.profile?.display_name || "Unknown"}
                        </p>
                        {request.message && (
                          <p className="text-xs text-muted-foreground truncate">{request.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAcceptingRequest(request);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Accept</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              declineRequest(request.id);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Decline</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Owner-only: Secret Enemies */}
          {isOwnProfile && secretEnemies.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-red-500 mb-3">Secret Enemies ({secretEnemies.length})</h4>
              <p className="text-xs text-muted-foreground mb-2">They think they're your friend, but get no real access or see decoy info.</p>
              <div className="space-y-2">
                {secretEnemies.map((friend) => renderFriendItem(friend, false))}
              </div>
            </div>
          )}

          {/* Owner-only: Sent Requests - at the bottom */}
          {isOwnProfile && sentRequests.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-blue-500 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Sent Requests ({sentRequests.length})
              </h4>
              <p className="text-xs text-muted-foreground mb-2">Waiting for their response</p>
              <div className="space-y-2">
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/u/${request.to_user_id}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {(request.profile?.display_name || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {request.profile?.display_name || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => cancelSentRequest(request.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cancel request</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for editing friendship level */}
      <Dialog open={!!editingFriend} onOpenChange={(open) => !open && setEditingFriend(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Friendship Level</DialogTitle>
            <DialogDescription>
              Change how you classify {editingFriend?.profile?.display_name || "this friend"}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <RadioGroup 
              value={selectedUsesCustomType ? "custom" : selectedLevel} 
              onValueChange={(v: FriendshipSelection) => {
                if (v === "custom") {
                  handleSelectCustomType();
                } else {
                  handleSelectStandardLevel(v as FriendshipLevel);
                }
              }}
              className="space-y-3"
            >
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="close_friend" id="edit_close_friend" className="mt-1" />
              <Label htmlFor="edit_close_friend" className="flex-1 cursor-pointer">
                <span className="font-medium">Close Friend</span>
                <p className="text-sm text-muted-foreground">Can see your WhatsApp, phone number, or private email.</p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border border-orange-500/50 hover:bg-orange-500/10">
              <RadioGroupItem value="family" id="edit_family" className="mt-1" />
              <Label htmlFor="edit_family" className="flex-1 cursor-pointer">
                <span className="font-medium text-orange-500">Family</span>
                <p className="text-sm text-muted-foreground">Independent category: phone, private email, and full birthday only. No social links.</p>
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

            {/* Custom friendship type - only show if user has created one */}
            {customFriendshipType && (
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-primary/50 hover:bg-primary/10">
                <RadioGroupItem value="custom" id="edit_custom" className="mt-1" />
                <Label htmlFor="edit_custom" className="flex-1 cursor-pointer">
                  <span className="font-medium text-primary">{customFriendshipType.name}</span>
                  <p className="text-sm text-muted-foreground">Your custom friendship level with personalized visibility settings.</p>
                </Label>
              </div>
            )}
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="secret_friend" id="edit_secret_friend" className="mt-1" />
              <Label htmlFor="edit_secret_friend" className="flex-1 cursor-pointer">
                <span className="font-medium">Secret Friend</span>
                <p className="text-sm text-muted-foreground">All privileges of close friend, but hidden from friends lists.</p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border border-red-500/50 hover:bg-red-500/10">
              <RadioGroupItem value="secret_enemy" id="edit_secret_enemy" className="mt-1" />
              <Label htmlFor="edit_secret_enemy" className="flex-1 cursor-pointer">
                <span className="font-medium text-red-600">Secret Enemy</span>
                <p className="text-sm text-muted-foreground">They'll think you're friends, but get no access or see decoy info.</p>
              </Label>
            </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
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

      {/* Dialog for accepting friend request */}
      <Dialog open={!!acceptingRequest} onOpenChange={(open) => !open && setAcceptingRequest(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Accept Friend Request</DialogTitle>
            <DialogDescription>
              Choose your friendship level with {acceptingRequest?.profile?.display_name || "this person"}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <RadioGroup 
              value={acceptLevel} 
              onValueChange={(v: FriendshipSelection) => setAcceptLevel(v)}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
                <RadioGroupItem value="close_friend" id="accept_close_friend" className="mt-1" />
                <Label htmlFor="accept_close_friend" className="flex-1 cursor-pointer">
                  <span className="font-medium">Close Friend</span>
                  <p className="text-sm text-muted-foreground">Can see your WhatsApp, phone, or private email.</p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-orange-500/50 hover:bg-orange-500/10">
                <RadioGroupItem value="family" id="accept_family" className="mt-1" />
                <Label htmlFor="accept_family" className="flex-1 cursor-pointer">
                  <span className="font-medium text-orange-500">Family</span>
                  <p className="text-sm text-muted-foreground">Independent category: phone, private email, and full birthday only. No social links.</p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
                <RadioGroupItem value="buddy" id="accept_buddy" className="mt-1" />
                <Label htmlFor="accept_buddy" className="flex-1 cursor-pointer">
                  <span className="font-medium">Buddy</span>
                  <p className="text-sm text-muted-foreground">Can see your Instagram or social profile.</p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
                <RadioGroupItem value="friendly_acquaintance" id="accept_friendly_acquaintance" className="mt-1" />
                <Label htmlFor="accept_friendly_acquaintance" className="flex-1 cursor-pointer">
                  <span className="font-medium">Friendly Acquaintance</span>
                  <p className="text-sm text-muted-foreground">Can see your LinkedIn or contact email.</p>
                </Label>
              </div>

              {customFriendshipType && (
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-primary/50 hover:bg-primary/10">
                  <RadioGroupItem value="custom" id="accept_custom" className="mt-1" />
                  <Label htmlFor="accept_custom" className="flex-1 cursor-pointer">
                    <span className="font-medium text-primary">{customFriendshipType.name}</span>
                    <p className="text-sm text-muted-foreground">Your custom friendship level.</p>
                  </Label>
                </div>
              )}
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
                <RadioGroupItem value="secret_friend" id="accept_secret_friend" className="mt-1" />
                <Label htmlFor="accept_secret_friend" className="flex-1 cursor-pointer">
                  <span className="font-medium">Secret Friend</span>
                  <p className="text-sm text-muted-foreground">Close friend privileges, but hidden from lists.</p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-red-500/50 hover:bg-red-500/10">
                <RadioGroupItem value="secret_enemy" id="accept_secret_enemy" className="mt-1" />
                <Label htmlFor="accept_secret_enemy" className="flex-1 cursor-pointer">
                  <span className="font-medium text-red-600">Secret Enemy</span>
                  <p className="text-sm text-muted-foreground">They'll think you're friends, but get no access or see decoy info.</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <Button onClick={handleAcceptRequest} disabled={processing} className="flex-1">
              {processing ? "Accepting..." : "Accept"}
            </Button>
            <Button variant="outline" onClick={() => setAcceptingRequest(null)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FriendsList;