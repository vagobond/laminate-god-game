import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
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

type FriendshipLevel = "close_friend" | "buddy" | "friendly_acquaintance" | "secret_friend" | "fake_friend" | "not_friend";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [pendingFriendships, setPendingFriendships] = useState<PendingFriendship[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<FriendRequest | null>(null);
  const [selectedPendingFriendship, setSelectedPendingFriendship] = useState<PendingFriendship | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<FriendshipLevel>("buddy");
  const [processing, setProcessing] = useState(false);

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
    }
  }, [user]);

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

  const totalNotifications = requests.length + pendingFriendships.length;

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
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog for accepting friend requests */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Accept Friend Request</DialogTitle>
            <DialogDescription>
              Choose how you want to add {selectedRequest?.from_profile?.display_name || "this person"} as a friend.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
          <RadioGroup value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as FriendshipLevel)} className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="close_friend" id="close_friend" className="mt-1" />
              <Label htmlFor="close_friend" className="flex-1 cursor-pointer">
                <span className="font-medium">Close Friend</span>
                <p className="text-sm text-muted-foreground">Can see your WhatsApp, phone number, or private email. Can see friendship levels in mutual close friends' lists.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="buddy" id="buddy" className="mt-1" />
              <Label htmlFor="buddy" className="flex-1 cursor-pointer">
                <span className="font-medium">Buddy</span>
                <p className="text-sm text-muted-foreground">Can see your Instagram or other social profile. Can see your friends list without levels.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="friendly_acquaintance" id="friendly_acquaintance" className="mt-1" />
              <Label htmlFor="friendly_acquaintance" className="flex-1 cursor-pointer">
                <span className="font-medium">Friendly Acquaintance</span>
                <p className="text-sm text-muted-foreground">Can see your LinkedIn or general contact email. Can see your friends list without levels.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="secret_friend" id="secret_friend" className="mt-1" />
              <Label htmlFor="secret_friend" className="flex-1 cursor-pointer">
                <span className="font-medium">Secret Friend</span>
                <p className="text-sm text-muted-foreground">All privileges of close friend, but neither of you appears in each other's friends lists.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-amber-500/50 hover:bg-amber-500/10">
              <RadioGroupItem value="fake_friend" id="fake_friend" className="mt-1" />
              <Label htmlFor="fake_friend" className="flex-1 cursor-pointer">
                <span className="font-medium text-amber-600">Fake Friend</span>
                <p className="text-sm text-muted-foreground">They'll think you accepted, but they get no access and won't appear in your list.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-destructive/50 hover:bg-destructive/10">
              <RadioGroupItem value="not_friend" id="not_friend" className="mt-1" />
              <Label htmlFor="not_friend" className="flex-1 cursor-pointer">
                <span className="font-medium text-destructive">Not Friend</span>
                <p className="text-sm text-muted-foreground">Decline the request without any friendship.</p>
              </Label>
            </div>
          </RadioGroup>
          </div>

          <div className="flex gap-2 mt-4 flex-shrink-0">
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
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Set Friendship Level</DialogTitle>
            <DialogDescription>
              {selectedPendingFriendship?.friend_profile?.display_name || "This person"} accepted your friend request! Now choose what type of friend they are to you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
          <RadioGroup value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as FriendshipLevel)} className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="close_friend" id="pending_close_friend" className="mt-1" />
              <Label htmlFor="pending_close_friend" className="flex-1 cursor-pointer">
                <span className="font-medium">Close Friend</span>
                <p className="text-sm text-muted-foreground">Can see your WhatsApp, phone number, or private email.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="buddy" id="pending_buddy" className="mt-1" />
              <Label htmlFor="pending_buddy" className="flex-1 cursor-pointer">
                <span className="font-medium">Buddy</span>
                <p className="text-sm text-muted-foreground">Can see your Instagram or other social profile.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="friendly_acquaintance" id="pending_friendly_acquaintance" className="mt-1" />
              <Label htmlFor="pending_friendly_acquaintance" className="flex-1 cursor-pointer">
                <span className="font-medium">Friendly Acquaintance</span>
                <p className="text-sm text-muted-foreground">Can see your LinkedIn or general contact email.</p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
              <RadioGroupItem value="secret_friend" id="pending_secret_friend" className="mt-1" />
              <Label htmlFor="pending_secret_friend" className="flex-1 cursor-pointer">
                <span className="font-medium">Secret Friend</span>
                <p className="text-sm text-muted-foreground">All privileges of close friend, but hidden from friends lists.</p>
              </Label>
            </div>
          </RadioGroup>
          </div>

          <div className="flex gap-2 mt-4 flex-shrink-0">
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