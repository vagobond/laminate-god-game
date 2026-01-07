import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, MapPin } from "lucide-react";

interface CreateMeetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetupCreated: () => void;
  mapboxToken: string | null;
}

export const CreateMeetupDialog = ({
  open,
  onOpenChange,
  onMeetupCreated,
  mapboxToken,
}: CreateMeetupDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isOpenEnded, setIsOpenEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const geocodeLocation = async () => {
    if (!mapboxToken || !locationName) return;

    const query = locationAddress || locationName;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setCoordinates({ lat, lng });
        return { lat, lng };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !locationName.trim()) {
      toast.error("Please provide a title and location");
      return;
    }

    if (!isOpenEnded && (!startDate || !startTime)) {
      toast.error("Please provide start date/time or mark as open-ended");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to create a meetup");
        return;
      }

      // Geocode the location
      const coords = await geocodeLocation();

      const startDateTime = startDate && startTime 
        ? new Date(`${startDate}T${startTime}`).toISOString()
        : null;
      
      const endDateTime = endDate && endTime
        ? new Date(`${endDate}T${endTime}`).toISOString()
        : null;

      const { error } = await supabase.from("meetups").insert({
        creator_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        location_name: locationName.trim(),
        location_address: locationAddress.trim() || null,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        is_open_ended: isOpenEnded,
      });

      if (error) throw error;

      toast.success("Meetup created!");
      onMeetupCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating meetup:", error);
      toast.error("Failed to create meetup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocationName("");
    setLocationAddress("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setIsOpenEnded(false);
    setCoordinates(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-yellow-500" />
            Create Meetup/Event
          </DialogTitle>
          <DialogDescription>
            Create a meetup or event for others to join
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Coffee meetup in Paris"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Location *
            </Label>
            <Input
              id="location"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="City or town (e.g., Paris, France)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Specific Address (optional)</Label>
            <Input
              id="address"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="123 Main Street, Café du Monde"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what this meetup is about..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="open-ended"
              checked={isOpenEnded}
              onCheckedChange={(checked) => setIsOpenEnded(checked === true)}
            />
            <Label htmlFor="open-ended" className="text-sm cursor-pointer">
              Open-ended (no specific time)
            </Label>
          </div>

          {!isOpenEnded && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time *</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {isSubmitting ? "Creating..." : "Create Meetup"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
