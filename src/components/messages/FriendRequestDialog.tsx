import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import MarkdownContent from "@/components/MarkdownContent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Message } from "./types";

interface FriendRequestDialogProps {
  message: Message | null;
  onClose: () => void;
}

const FriendRequestDialog = ({ message, onClose }: FriendRequestDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={!!message} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={message?.sender?.avatar_url || undefined} />
              <AvatarFallback>
                {(message?.sender?.display_name || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>Message from {message?.sender?.display_name || "Unknown"}</span>
          </DialogTitle>
          <DialogDescription>
            Friend request received {message && formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
          <MarkdownContent
            content={message?.content || ""}
            className="text-sm break-words"
          />
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              if (message?.sender) {
                navigate(`/u/${message.from_user_id}`);
                onClose();
              }
            }}
          >
            View Profile
          </Button>
          <Button
            onClick={() => {
              onClose();
              navigate("/profile?tab=friends");
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Accept/Decline Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FriendRequestDialog;
