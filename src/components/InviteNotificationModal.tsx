import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Gift, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InviteNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

export const InviteNotificationModal = ({ 
  open, 
  onOpenChange,
  onDismiss 
}: InviteNotificationModalProps) => {
  const navigate = useNavigate();

  const handleGoToInvites = () => {
    onDismiss();
    navigate("/invite-friends");
  };

  const handleMaybeLater = () => {
    onDismiss();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-amber-500/30 flex items-center justify-center mb-4">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <AlertDialogTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Congratulations!
            <Sparkles className="w-5 h-5 text-amber-500" />
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base space-y-4">
            <p className="font-semibold text-foreground">
              Congratulations on getting into Xcrol early!
            </p>
            <p>
              We have now moved to invitation mode. Each user gets <span className="font-bold text-primary">one invitation code</span>.
            </p>
            <p>
              Invite someone who matters to you. When they accept, you will get <span className="font-semibold">two more invites</span>. When they have both accepted, you will get <span className="font-semibold">four more invites</span>.
            </p>
            <p>
              This doubling will happen until you have invited thirty-one people and they have accepted. At this point you will have <span className="font-bold text-primary">unlimited invite codes</span>.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Pick wisely. You can cancel invites that have not been used and reshare them.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction onClick={handleGoToInvites} className="w-full">
            <Gift className="w-4 h-4 mr-2" />
            View My Invites
          </AlertDialogAction>
          <AlertDialogAction
            onClick={handleMaybeLater}
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Maybe Later
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
