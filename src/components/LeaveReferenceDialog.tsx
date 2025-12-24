import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, Loader2 } from "lucide-react";
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

  return (
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
                  onClick={() => setRating(star)}
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
  );
};
