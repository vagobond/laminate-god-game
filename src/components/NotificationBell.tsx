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

type FriendshipLevel = "close_friend" | "buddy" | "friendly_acquaintance" | "secret_friend";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<FriendRequest | null>(null);
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

  const handleAccept = async () => {
    if (!selectedRequest || !user) return;
    setProcessing(true);

    try {
      // Create friendship for the accepting user (they set the level)
      const { error: friendship1Error } = await supabase
        .from("friendships")
        .insert({
          user_id: user.id,
          friend_id: selectedRequest.from_user_id,
          level: selectedLevel,
        });

      if (friendship1Error) throw friendship1Error;

      // Create reverse friendship for the requester (default to buddy, they can change later)
      const { error: friendship2Error } = await supabase
        .from("friendships")
        .insert({
          user_id: selectedRequest.from_user_id,
          friend_id: user.id,
          level: "buddy",
        });

      if (friendship2Error) throw friendship2Error;

      // Delete the request
      await supabase
        .from("friend_requests")
        .delete()
        .eq("id", selectedRequest.id);

      toast.success("Friend request accepted!");
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
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

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 bg-popover border border-border z-50">
          <div className="p-2">
            <h3 className="font-semibold mb-2">Friend Requests</h3>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No pending requests</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
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
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleDecline(request.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Friend Request</DialogTitle>
            <DialogDescription>
              Choose how you want to add {selectedRequest?.from_profile?.display_name || "this person"} as a friend.
            </DialogDescription>
          </DialogHeader>
          
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
          </RadioGroup>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleAccept} disabled={processing} className="flex-1">
              {processing ? "Accepting..." : "Confirm"}
            </Button>
            <Button variant="outline" onClick={() => setSelectedRequest(null)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationBell;