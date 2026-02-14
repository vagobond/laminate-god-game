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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FriendshipLevelSelector, type FriendshipLevel } from "@/components/FriendshipLevelSelector";
import { useNotifications } from "@/hooks/use-notifications";
import type { FriendRequest, PendingFriendship } from "@/hooks/use-notifications";
import UnreadMessagesItem from "@/components/notifications/UnreadMessagesItem";
import PendingFriendshipItem from "@/components/notifications/PendingFriendshipItem";
import FriendRequestItem from "@/components/notifications/FriendRequestItem";
import ReferenceItem from "@/components/notifications/ReferenceItem";

const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    user,
    requests,
    pendingFriendships,
    newReferences,
    unreadMessageCount,
    totalNotifications,
    dismissReferenceNotification,
    loadRequests,
    loadPendingFriendships,
  } = useNotifications();

  const [selectedRequest, setSelectedRequest] = useState<FriendRequest | null>(null);
  const [selectedPendingFriendship, setSelectedPendingFriendship] = useState<PendingFriendship | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<FriendshipLevel>("buddy");
  const [processing, setProcessing] = useState(false);
  const [hasShownMessageToast, setHasShownMessageToast] = useState(false);
  const [hasShownReferenceToast, setHasShownReferenceToast] = useState(false);

  // Show toast for unread messages (once per session)
  useEffect(() => {
    if (unreadMessageCount > 0 && !hasShownMessageToast) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/messages")) {
        toast.info(
          `You have ${unreadMessageCount} unread message${unreadMessageCount > 1 ? "s" : ""}`,
          {
            action: { label: "View", onClick: () => navigate("/messages") },
            duration: 5000,
          }
        );
        setHasShownMessageToast(true);
      }
    }
  }, [unreadMessageCount, hasShownMessageToast, navigate]);

  // Show toast for new references (once per session)
  useEffect(() => {
    if (newReferences.length > 0 && !hasShownReferenceToast) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/profile")) {
        const firstName =
          newReferences[0].from_profile?.display_name?.split(" ")[0] || "Someone";
        toast.info(`${firstName} left you a reference!`, {
          action: { label: "View", onClick: () => navigate("/profile") },
          duration: 5000,
        });
        setHasShownReferenceToast(true);
      }
    }
  }, [newReferences, hasShownReferenceToast, navigate]);

  const handleAccept = async () => {
    if (!selectedRequest || !user) return;
    setProcessing(true);
    try {
      const { error } = await supabase.rpc("accept_friend_request", {
        request_id: selectedRequest.id,
        friendship_level: selectedLevel,
      });
      if (error) throw error;

      const message =
        selectedLevel === "not_friend"
          ? "Request declined"
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

  const handleBlock = async (request: FriendRequest) => {
    if (!user) return;
    try {
      await supabase.from("friend_requests").delete().eq("id", request.id);
      await supabase.from("user_blocks").insert({
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
                {unreadMessageCount > 0 && (
                  <UnreadMessagesItem count={unreadMessageCount} />
                )}

                {pendingFriendships.map((friendship) => (
                  <PendingFriendshipItem
                    key={friendship.id}
                    friendship={friendship}
                    onChooseLevel={(f) => {
                      setSelectedPendingFriendship(f);
                      setSelectedLevel("buddy");
                    }}
                  />
                ))}

                {requests.map((request) => (
                  <FriendRequestItem
                    key={request.id}
                    request={request}
                    onRespond={setSelectedRequest}
                    onBlock={handleBlock}
                  />
                ))}

                {newReferences.map((ref) => (
                  <ReferenceItem
                    key={ref.id}
                    reference={ref}
                    onDismiss={dismissReferenceNotification}
                  />
                ))}
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
              Choose how you want to add{" "}
              {selectedRequest?.from_profile?.display_name || "this person"} as a friend.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <FriendshipLevelSelector
              value={selectedLevel}
              onChange={setSelectedLevel}
              idPrefix="accept_"
              showNotFriend={true}
              showFamily={true}
              compact={true}
            />
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
      <Dialog
        open={!!selectedPendingFriendship}
        onOpenChange={(open) => !open && setSelectedPendingFriendship(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Set Friendship Level</DialogTitle>
            <DialogDescription>
              {selectedPendingFriendship?.friend_profile?.display_name || "This person"}{" "}
              accepted your friend request! Now choose what type of friend they are to you.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <FriendshipLevelSelector
              value={selectedLevel}
              onChange={setSelectedLevel}
              idPrefix="pending_"
              showNotFriend={false}
              showFamily={true}
              compact={true}
            />
          </div>
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button onClick={handleSetFriendshipLevel} disabled={processing} className="flex-1">
              {processing ? "Saving..." : "Confirm"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedPendingFriendship(null)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationBell;
