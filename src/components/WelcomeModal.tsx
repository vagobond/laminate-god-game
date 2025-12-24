import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Sparkles } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WelcomeModal = ({ open, onOpenChange }: WelcomeModalProps) => {
  const navigate = useNavigate();
  const didNavigateRef = useRef(false);

  const handleInviteFriends = () => {
    didNavigateRef.current = true;
    navigate("/invite-friends");
    // Let AlertDialog close itself; it will call onOpenChange(false)
  };

  const handleMaybeLater = () => {
    didNavigateRef.current = true;
    navigate("/");
    // Let AlertDialog close itself; it will call onOpenChange(false)
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      // If the user closes the dialog via overlay/escape, treat it like "Maybe Later".
      if (!didNavigateRef.current) {
        navigate("/");
      }
      didNavigateRef.current = false;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleDialogOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <AlertDialogTitle className="text-2xl text-center">
            Xcrol is more fun with friends!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            Invite your friends to join you on Xcrol. Explore the world together, meet up, and build your network of travelers!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction onClick={handleInviteFriends} className="w-full">
            <Users className="w-4 h-4 mr-2" />
            Invite Friends
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
