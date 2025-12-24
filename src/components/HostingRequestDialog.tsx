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
import { Input } from "@/components/ui/input";
import { Home, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface HostingRequestDialogProps {
  recipientId: string;
  recipientName: string;
}

export const HostingRequestDialog = ({ recipientId, recipientName }: HostingRequestDialogProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [numGuests, setNumGuests] = useState(1);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please write a message");
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Insert the hosting request
      const { error: requestError } = await supabase
        .from("hosting_requests")
        .insert({
          from_user_id: user.id,
          to_user_id: recipientId,
          message: message.trim(),
          arrival_date: arrivalDate || null,
          departure_date: departureDate || null,
          num_guests: numGuests,
        });

      if (requestError) throw requestError;

      // Also send a message to their inbox
      let dateInfo = "";
      if (arrivalDate && departureDate) {
        dateInfo = `\n\nDates: ${new Date(arrivalDate).toLocaleDateString()} - ${new Date(departureDate).toLocaleDateString()}`;
      } else if (arrivalDate) {
        dateInfo = `\n\nArrival: ${new Date(arrivalDate).toLocaleDateString()}`;
      }

      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          from_user_id: user.id,
          to_user_id: recipientId,
          content: `[Hosting Request - ${numGuests} guest${numGuests > 1 ? "s" : ""}]\n\n${message.trim()}${dateInfo}`,
          platform_suggestion: "hosting",
        });

      if (messageError) throw messageError;

      toast.success("Hosting request sent!");
      setOpen(false);
      setMessage("");
      setArrivalDate("");
      setDepartureDate("");
      setNumGuests(1);
    } catch (error) {
      console.error("Error sending hosting request:", error);
      toast.error("Failed to send hosting request");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Home className="w-4 h-4 mr-2" />
          Request to Stay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request to Stay</DialogTitle>
          <DialogDescription>
            Send a hosting request to {recipientName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arrival">Arrival Date</Label>
              <Input
                id="arrival"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Date</Label>
              <Input
                id="departure"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <Input
              id="guests"
              type="number"
              min="1"
              max="10"
              value={numGuests}
              onChange={(e) => setNumGuests(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Your message *</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself, explain why you're traveling, and why you'd like to stay with this person..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} disabled={sending} className="w-full">
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Home className="w-4 h-4 mr-2" />
            )}
            Send Hosting Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
