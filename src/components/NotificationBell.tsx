import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FriendRequest {
  id: string;
  from_user_id: string;
  message: string | null;
  created_at: string;
  from_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface PendingFriendship {
  id: string;
  friend_id: string;
  friend_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface NewReference {
  id: string;
  from_user_id: string;
  reference_type: string;
  rating: number | null;
  created_at: string;
  from_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
  hasLeftReturn?: boolean;
}

type FriendshipLevel = "close_friend" | "buddy" | "friendly_acquaintance" | "secret_friend" | "fake_friend" | "secret_enemy" | "not_friend";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [pendingFriendships, setPendingFriendships] = useState<PendingFriendship[]>([]);
  const [newReferences, setNewReferences] = useState<NewReference[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<FriendRequest | null>(null);
  const [selectedPendingFriendship, setSelectedPendingFriendship] = useState<PendingFriendship | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<FriendshipLevel>("buddy");
  const [processing, setProcessing] = useState(false);
  const [hasShownMessageToast, setHasShownMessageToast] = useState(false);
  const [hasShownReferenceToast, setHasShownReferenceToast] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadRequests();
      loadPendingFriendships();
      loadUnreadMessages();
      loadNewReferences();
    }
  }, [user]);

  // Listen for messages-updated event to refresh unread count
  useEffect(() => {
    const handleMessagesUpdated = () => {
      loadUnreadMessages();
    };
    
    window.addEventListener('messages-updated', handleMessagesUpdated);
    return () => window.removeEventListener('messages-updated', handleMessagesUpdated);
  }, [user]);

  // Show toast for unread messages (once per session/page load)
  useEffect(() => {
    if (unreadMessageCount > 0 && !hasShownMessageToast) {
      const currentPath = window.location.pathname;
      // Don't show toast if already on messages page
      if (!currentPath.startsWith('/messages')) {
        toast.info(
          `You have ${unreadMessageCount} unread message${unreadMessageCount > 1 ? 's' : ''}`,
          {
            action: {
              label: 'View',
              onClick: () => navigate('/messages'),
            },
            duration: 5000,
          }
        );
        setHasShownMessageToast(true);
      }
    }
  }, [unreadMessageCount, hasShownMessageToast, navigate]);

  // Show toast for new references (once per session/page load)
  useEffect(() => {
    if (newReferences.length > 0 && !hasShownReferenceToast) {
      const currentPath = window.location.pathname;
      // Don't show toast if already on profile page
      if (!currentPath.startsWith('/profile')) {
        const firstName = newReferences[0].from_profile?.display_name?.split(' ')[0] || 'Someone';
        toast.info(
          `${firstName} left you a reference!`,
          {
            action: {
              label: 'View',
              onClick: () => navigate('/profile'),
            },
            duration: 5000,
          }
        );
        setHasShownReferenceToast(true);
      }
    }
  }, [newReferences, hasShownReferenceToast, navigate]);

  const loadUnreadMessages = async () => {
    if (!user) return;

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", user.id)
      .is("read_at", null);

    setUnreadMessageCount(count || 0);
  };

  const loadNewReferences = async () => {
    if (!user) return;

    // Get references from the last 30 days that the user hasn't seen
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("user_references")
      .select("id, from_user_id, reference_type, rating, created_at")
      .eq("to_user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading references:", error);
      return;
    }

    if (!data || data.length === 0) {
      setNewReferences([]);
      return;
    }

    // Load profiles and check if user has left a return reference
    const referencesWithDetails = await Promise.all(
      data.map(async (ref) => {
        const [profileResult, returnRefResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, avatar_url, username")
            .eq("id", ref.from_user_id)
            .single(),
          supabase
            .from("user_references")
            .select("id")
            .eq("from_user_id", user.id)
            .eq("to_user_id", ref.from_user_id)
            .limit(1)
        ]);

        return {
          ...ref,
          from_profile: profileResult.data || undefined,
          hasLeftReturn: (returnRefResult.data?.length ?? 0) > 0
        };
      })
    );

    // Only show references where user hasn't left a return reference
    const unreturned = referencesWithDetails.filter(ref => !ref.hasLeftReturn);
    setNewReferences(unreturned);
  };

  const loadRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("to_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading requests:", error);
      return;
    }

    // Load profiles for each request
    const requestsWithProfiles = await Promise.all(
      (data || []).map(async (req) => {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", req.from_user_id)
          .single();
        
        return {
          ...req,
          from_profile: profileData || undefined,
        };
      })
    );

    setRequests(requestsWithProfiles);
  };

  const loadPendingFriendships = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("friendships")
      .select("id, friend_id")
      .eq("user_id", user.id)
      .eq("needs_level_set", true);

    if (error) {
      console.error("Error loading pending friendships:", error);
      return;
    }

    // Load profiles for each pending friendship
    const friendshipsWithProfiles = await Promise.all(
      (data || []).map(async (friendship) => {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", friendship.friend_id)
          .single();
        
        return {
          ...friendship,
          friend_profile: profileData || undefined,
        };
      })
    );

    setPendingFriendships(friendshipsWithProfiles);
  };

  const handleAccept = async () => {
    if (!selectedRequest || !user) return;
    setProcessing(true);

    try {
      // Use the secure RPC function to handle friend request acceptance
      const { error } = await supabase.rpc('accept_friend_request', {
        request_id: selectedRequest.id,
        friendship_level: selectedLevel,
      });

      if (error) throw error;

      const message = selectedLevel === "not_friend"
        ? "Request declined"
        : selectedLevel === "fake_friend" 
          ? "Request handled (they'll think you're friends)" 
          : selectedLevel === "secret_enemy"
            ? "Request handled (they'll think you're friends, but get no real info)"
            : "Friend request accepted!";
      toast.success(message);
      setSelectedRequest(null);
      setSelectedLevel("buddy");
      loadRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    } finally {
      setProcessing(false);
    }
  };

  const handleSetFriendshipLevel = async () => {
    if (!selectedPendingFriendship || !user) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from("friendships")
        .update({ level: selectedLevel, needs_level_set: false })
        .eq("id", selectedPendingFriendship.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Friendship level set!");
      setSelectedPendingFriendship(null);
      setSelectedLevel("buddy");
      loadPendingFriendships();
    } catch (error) {
      console.error("Error setting friendship level:", error);
      toast.error("Failed to set friendship level");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);

      toast.success("Friend request declined");
      loadRequests();
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error("Failed to decline request");
    }
  };

  const handleBlock = async (request: FriendRequest) => {
    try {
      // Delete the request
      await supabase
        .from("friend_requests")
        .delete()
        .eq("id", request.id);

      // Add to blocks
      await supabase
        .from("user_blocks")
        .insert({
          blocker_id: user.id,
          blocked_id: request.from_user_id,
        });

      toast.success("User blocked");
      loadRequests();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
    }
  };

  if (!user) return null;

  const totalNotifications = requests.length + pendingFriendships.length + unreadMessageCount + newReferences.length;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {totalNotifications}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 bg-popover border border-border z-50">
          <div className="p-2">
            <h3 className="font-semibold mb-2">Notifications</h3>
            {totalNotifications === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No pending notifications</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {/* Unread messages notification */}
                {unreadMessageCount > 0 && (
                  <button
                    onClick={() => navigate('/messages')}
                    className="w-full p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Unread Messages</p>
                        <p className="text-sm text-muted-foreground">
                          You have {unreadMessageCount} unread message{unreadMessageCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                )}
                {/* Pending friendships - need to set level */}
                {pendingFriendships.map((friendship) => (
                  <div key={friendship.id} className="p-3 bg-primary/10 rounded-lg space-y-2 border border-primary/30">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="h-10 w-10 cursor-pointer" 
                        onClick={() => navigate(`/u/${friendship.friend_id}`)}
                      >
                        <AvatarImage src={friendship.friend_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {(friendship.friend_profile?.display_name || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p 
                          className="font-medium truncate cursor-pointer hover:underline"
                          onClick={() => navigate(`/u/${friendship.friend_id}`)}
                        >
                          {friendship.friend_profile?.display_name || "Unknown User"}
                        </p>
                        <p className="text-sm text-primary">Accepted your request! Set your friendship level.</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setSelectedPendingFriendship(friendship);
                        setSelectedLevel("buddy");
                      }}
                    >
                      Choose Friendship Level
                    </Button>
                  </div>
                ))}

                {/* Friend requests */}
                {requests.map((request) => (
                  <div key={request.id} className="p-3 bg-secondary/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="h-10 w-10 cursor-pointer" 
                        onClick={() => navigate(`/u/${request.from_user_id}`)}
                      >
                        <AvatarImage src={request.from_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {(request.from_profile?.display_name || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p 
                          className="font-medium truncate cursor-pointer hover:underline"
                          onClick={() => navigate(`/u/${request.from_user_id}`)}
                        >
                          {request.from_profile?.display_name || "Unknown User"}
                        </p>
                        {request.message && (
                          <p className="text-sm text-muted-foreground truncate">{request.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Respond
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleBlock(request)}
                      >
                        Block
                      </Button>
                    </div>
                  </div>
                ))}

                {/* New references received */}
                {newReferences.map((ref) => {
                  const profilePath = ref.from_profile?.username 
                    ? `/u/${ref.from_profile.username}` 
                    : `/u/${ref.from_user_id}`;
                  
                  const getRefTypeEmoji = (type: string) => {
                    switch (type) {
                      case 'host': return '🏠';
                      case 'guest': return '🧳';
                      case 'business': return '💼';
                      default: return '☕';
                    }
                  };

                  return (
                    <div key={ref.id} className="p-3 bg-yellow-500/10 rounded-lg space-y-2 border border-yellow-500/30">
                      <div className="flex items-center gap-3">
                        <Avatar 
                          className="h-10 w-10 cursor-pointer" 
                          onClick={() => navigate(profilePath)}
                        >
                          <AvatarImage src={ref.from_profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {(ref.from_profile?.display_name || "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p 
                            className="font-medium truncate cursor-pointer hover:underline"
                            onClick={() => navigate(profilePath)}
                          >
                            {ref.from_profile?.display_name || "Someone"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Left you a {getRefTypeEmoji(ref.reference_type)} reference
                            {ref.rating && ` (${ref.rating}★)`}
                          </p>
                        </div>
                        <Star className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        variant="outline"
                        onClick={() => navigate(profilePath)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Leave Reference Back
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog for accepting friend requests */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Accept Friend Request</DialogTitle>
            <DialogDescription>
              Choose how you want to add {selectedRequest?.from_profile?.display_name || "this person"} as a friend.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
          <RadioGroup value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as FriendshipLevel)} className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="close_friend" id="close_friend" />
                <Label htmlFor="close_friend" className="cursor-pointer font-medium">Close Friend</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  Can see your WhatsApp, phone number, or private email. Can see friendship levels in mutual close friends' lists.
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="buddy" id="buddy" />
                <Label htmlFor="buddy" className="cursor-pointer font-medium">Buddy</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  Can see your Instagram or other social profile. Can see your friends list without levels.
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="friendly_acquaintance" id="friendly_acquaintance" />
                <Label htmlFor="friendly_acquaintance" className="cursor-pointer font-medium">Friendly Acquaintance</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  Can see your LinkedIn or general contact email. Can see your friends list without levels.
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="secret_friend" id="secret_friend" />
                <Label htmlFor="secret_friend" className="cursor-pointer font-medium">Secret Friend</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  All privileges of close friend, but neither of you appears in each other's friends lists.
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg border border-amber-500/50 hover:bg-amber-500/10">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="fake_friend" id="fake_friend" />
                <Label htmlFor="fake_friend" className="cursor-pointer font-medium text-amber-600">Fake Friend</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  They'll think you accepted, but they get no access and won't appear in your list.
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg border border-red-500/50 hover:bg-red-500/10">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="secret_enemy" id="secret_enemy" />
                <Label htmlFor="secret_enemy" className="cursor-pointer font-medium text-red-600">Secret Enemy</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  They'll think you're close friends, but only see generic/fake contact info. Perfect for people you don't trust.
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg border border-destructive/50 hover:bg-destructive/10">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="not_friend" id="not_friend" />
                <Label htmlFor="not_friend" className="cursor-pointer font-medium text-destructive">Not Friend</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  Decline the request without any friendship.
                </PopoverContent>
              </Popover>
            </div>
          </RadioGroup>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <Button onClick={handleAccept} disabled={processing} className="flex-1">
              {processing ? "Accepting..." : "Confirm"}
            </Button>
            <Button variant="outline" onClick={() => setSelectedRequest(null)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for setting friendship level on accepted requests */}
      <Dialog open={!!selectedPendingFriendship} onOpenChange={(open) => !open && setSelectedPendingFriendship(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Set Friendship Level</DialogTitle>
            <DialogDescription>
              {selectedPendingFriendship?.friend_profile?.display_name || "This person"} accepted your friend request! Now choose what type of friend they are to you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
          <RadioGroup value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as FriendshipLevel)} className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="close_friend" id="pending_close_friend" />
                <Label htmlFor="pending_close_friend" className="cursor-pointer font-medium">Close Friend</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  Can see your WhatsApp, phone number, or private email.
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="buddy" id="pending_buddy" />
                <Label htmlFor="pending_buddy" className="cursor-pointer font-medium">Buddy</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  Can see your Instagram or other social profile.
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="friendly_acquaintance" id="pending_friendly_acquaintance" />
                <Label htmlFor="pending_friendly_acquaintance" className="cursor-pointer font-medium">Friendly Acquaintance</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  Can see your LinkedIn or general contact email.
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="secret_friend" id="pending_secret_friend" />
                <Label htmlFor="pending_secret_friend" className="cursor-pointer font-medium">Secret Friend</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 text-sm">
                  All privileges of close friend, but hidden from friends lists.
                </PopoverContent>
              </Popover>
            </div>
          </RadioGroup>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border">
            <Button onClick={handleSetFriendshipLevel} disabled={processing} className="flex-1">
              {processing ? "Saving..." : "Confirm"}
            </Button>
            <Button variant="outline" onClick={() => setSelectedPendingFriendship(null)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationBell;