import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import SendMessageDialog from "@/components/SendMessageDialog";
import FriendshipLevelRadioGroup from "./FriendshipLevelRadioGroup";
import type { Friend, FriendRequest, CustomFriendshipType, FriendshipLevel, FriendshipSelection } from "./types";

// --- Edit Level Dialog ---

interface EditLevelDialogProps {
  friend: Friend | null;
  customFriendshipType: CustomFriendshipType | null;
  processing: boolean;
  onClose: () => void;
  onSave: (friendId: string, level: string, usesCustomType: boolean) => void;
}

export const EditLevelDialog = ({ friend, customFriendshipType, processing, onClose, onSave }: EditLevelDialogProps) => {
  const [selectedLevel, setSelectedLevel] = useState<FriendshipLevel>(friend?.level as FriendshipLevel || "buddy");
  const [selectedUsesCustomType, setSelectedUsesCustomType] = useState(false);

  // Re-sync state when friend changes
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  // Need to load custom type state when opening
  const handleValueChange = (value: FriendshipSelection) => {
    if (value === "custom") {
      setSelectedUsesCustomType(true);
      setSelectedLevel("buddy");
    } else {
      setSelectedUsesCustomType(false);
      setSelectedLevel(value as FriendshipLevel);
    }
  };

  const currentValue: FriendshipSelection = selectedUsesCustomType ? "custom" : selectedLevel;

  return (
    <Dialog open={!!friend} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Friendship Level</DialogTitle>
          <DialogDescription>
            Change how you classify {friend?.profile?.display_name || "this friend"}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <FriendshipLevelRadioGroup
            value={currentValue}
            onValueChange={handleValueChange}
            customFriendshipType={customFriendshipType}
            idPrefix="edit"
          />
        </div>
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button onClick={() => friend && onSave(friend.id, selectedUsesCustomType ? "custom" : selectedLevel, selectedUsesCustomType)} disabled={processing} className="flex-1">
            {processing ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Accept Request Dialog ---

interface AcceptRequestDialogProps {
  request: FriendRequest | null;
  customFriendshipType: CustomFriendshipType | null;
  processing: boolean;
  onClose: () => void;
  onAccept: (request: FriendRequest, level: string, useCustomType: boolean) => void;
}

export const AcceptRequestDialog = ({ request, customFriendshipType, processing, onClose, onAccept }: AcceptRequestDialogProps) => {
  const [acceptLevel, setAcceptLevel] = useState<FriendshipSelection>("buddy");

  const handleValueChange = (value: FriendshipSelection) => {
    setAcceptLevel(value);
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Accept Friend Request</DialogTitle>
          <DialogDescription>
            Choose your friendship level with {request?.profile?.display_name || "this person"}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <FriendshipLevelRadioGroup
            value={acceptLevel}
            onValueChange={handleValueChange}
            customFriendshipType={customFriendshipType}
            idPrefix="accept"
          />
        </div>
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button onClick={() => request && onAccept(request, acceptLevel === "custom" ? "custom" : acceptLevel, acceptLevel === "custom")} disabled={processing} className="flex-1">
            {processing ? "Accepting..." : "Accept"}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Unfriend Confirmation ---

interface UnfriendDialogProps {
  friend: Friend | null;
  onClose: () => void;
  onConfirm: (friend: Friend) => void;
}

export const UnfriendDialog = ({ friend, onClose, onConfirm }: UnfriendDialogProps) => (
  <AlertDialog open={!!friend} onOpenChange={(open) => !open && onClose()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Unfriend {friend?.profile?.display_name || "this person"}?</AlertDialogTitle>
        <AlertDialogDescription>
          This will remove them from your friends list and you from theirs. You can always send a new friend request later.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => friend && onConfirm(friend)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Unfriend
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// --- Message Dialog wrapper ---

interface MessageFriendDialogProps {
  friend: Friend | null;
  onClose: () => void;
}

export const MessageFriendDialog = ({ friend, onClose }: MessageFriendDialogProps) => {
  if (!friend) return null;

  return (
    <SendMessageDialog
      recipientId={friend.friend_id}
      recipientName={friend.profile?.display_name || "Unknown"}
      friendshipLevel={friend.level}
      open={!!friend}
      onOpenChange={(open) => !open && onClose()}
    />
  );
};
