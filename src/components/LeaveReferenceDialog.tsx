import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type ReferenceType = "host" | "guest" | "friendly" | "business";

interface LeaveReferenceDialogProps {
  recipientId: string;
  recipientName: string;
}

export const LeaveReferenceDialog = ({ recipientId, recipientName }: LeaveReferenceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [referenceType, setReferenceType] = useState<ReferenceType>("friendly");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [canLeaveReference, setCanLeaveReference] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [showLowRatingWarning, setShowLowRatingWarning] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);

  useEffect(() => {
    checkEligibility();
  }, [recipientId]);

  const checkEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCanLeaveReference(false);
        return;
      }

      // Check friendship level from recipient's perspective
      const { data: friendship } = await supabase
        .from("friendships")
        .select("level, uses_custom_type")
        .eq("user_id", recipientId)
        .eq("friend_id", user.id)
        .maybeSingle();

      // Check if buddy or above (including family)
      const buddyOrAbove = friendship?.level && 
        ['family', 'close_friend', 'buddy', 'secret_friend'].includes(friendship.level);

      if (buddyOrAbove) {
        setCanLeaveReference(true);
        setCheckingEligibility(false);
        return;
      }

      // Check if using custom type with can_leave_reference enabled
      if (friendship?.uses_custom_type) {
        const { data: customType } = await supabase
          .from("custom_friendship_types")
          .select("can_leave_reference")
          .eq("user_id", recipientId)
          .maybeSingle();

        if (customType?.can_leave_reference) {
          setCanLeaveReference(true);
          setCheckingEligibility(false);
          return;
        }
      }

      // Check for confirmed hosting requests
      const { data: hostingRequests } = await supabase
        .from("hosting_requests")
        .select("id")
        .eq("status", "accepted")
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${recipientId}),and(from_user_id.eq.${recipientId},to_user_id.eq.${user.id})`)
        .limit(1);

      if (hostingRequests && hostingRequests.length > 0) {
        setCanLeaveReference(true);
        setCheckingEligibility(false);
        return;
      }

      // Check for confirmed meetup requests
      const { data: meetupRequests } = await supabase
        .from("meetup_requests")
        .select("id")
        .eq("status", "accepted")
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${recipientId}),and(from_user_id.eq.${recipientId},to_user_id.eq.${user.id})`)
        .limit(1);

      if (meetupRequests && meetupRequests.length > 0) {
        setCanLeaveReference(true);
        setCheckingEligibility(false);
        return;
      }

      setCanLeaveReference(false);
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setCanLeaveReference(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleRatingClick = (star: number) => {
    if (star < 3) {
      setPendingRating(star);
      setShowLowRatingWarning(true);
    } else {
      setRating(star);
    }
  };

  const confirmLowRating = () => {
    if (pendingRating !== null) {
      setRating(pendingRating);
    }
    setShowLowRatingWarning(false);
    setPendingRating(null);
  };

  const cancelLowRating = () => {
    setShowLowRatingWarning(false);
    setPendingRating(null);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write your reference");
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase
        .from("user_references")
        .insert({
          from_user_id: user.id,
          to_user_id: recipientId,
          reference_type: referenceType,
          rating,
          content: content.trim(),
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("You've already left this type of reference");
          return;
        }
        throw error;
      }

      toast.success("Reference submitted!");
      setOpen(false);
      setContent("");
      setRating(5);
      setReferenceType("friendly");
    } catch (error) {
      console.error("Error leaving reference:", error);
      toast.error("Failed to leave reference");
    } finally {
      setSending(false);
    }
  };

  // Don't show button if still checking or not eligible
  if (checkingEligibility) {
    return null;
  }

  if (!canLeaveReference) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4 mr-2" />
            Leave Reference
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Reference</DialogTitle>
            <DialogDescription>
              Write a reference for {recipientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Reference Type</Label>
              <RadioGroup
                value={referenceType}
                onValueChange={(value) => setReferenceType(value as ReferenceType)}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                  <RadioGroupItem value="host" id="ref-host" />
                  <Label htmlFor="ref-host" className="cursor-pointer">🏠 As Host</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                  <RadioGroupItem value="guest" id="ref-guest" />
                  <Label htmlFor="ref-guest" className="cursor-pointer">🧳 As Guest</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                  <RadioGroupItem value="friendly" id="ref-friendly" />
                  <Label htmlFor="ref-friendly" className="cursor-pointer">☕ Friendly</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                  <RadioGroupItem value="business" id="ref-business" />
                  <Label htmlFor="ref-business" className="cursor-pointer">💼 Business</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Your Reference *</Label>
              <Textarea
                id="content"
                placeholder="Share your experience with this person..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>

            <Button onClick={handleSubmit} disabled={sending} className="w-full">
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Star className="w-4 h-4 mr-2" />
              )}
              Submit Reference
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showLowRatingWarning} onOpenChange={setShowLowRatingWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Rating Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to leave a rating of {pendingRating} star{pendingRating === 1 ? '' : 's'}. 
              This is considered a less than good reference. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLowRating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLowRating}>
              Yes, I'm Sure
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
