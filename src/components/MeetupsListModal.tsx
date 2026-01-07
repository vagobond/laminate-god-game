import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { X, CalendarIcon, MapPin, Clock, Users } from "lucide-react";
import { format } from "date-fns";

interface Meetup {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  location_name: string;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  start_datetime: string | null;
  end_datetime: string | null;
  is_open_ended: boolean;
  created_at: string;
  creator?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface MeetupsListModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMeetup: (meetup: Meetup) => void;
}

export const MeetupsListModal = ({ open, onClose, onSelectMeetup }: MeetupsListModalProps) => {
  const navigate = useNavigate();
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadMeetups();
    }
  }, [open]);

  const loadMeetups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("meetups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch creator profiles
      const creatorIds = [...new Set((data || []).map(m => m.creator_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", creatorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const meetupsWithCreators = (data || []).map(m => ({
        ...m,
        creator: profileMap.get(m.creator_id),
      }));

      setMeetups(meetupsWithCreators);
    } catch (error) {
      console.error("Error loading meetups:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full space-y-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-yellow-500" />
              Meetups & Events
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {meetups.length} active meetup{meetups.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading meetups...</p>
          ) : meetups.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No meetups yet. Be the first to create one!
            </p>
          ) : (
            meetups.map((meetup) => (
              <div
                key={meetup.id}
                onClick={() => {
                  if (meetup.latitude && meetup.longitude) {
                    onSelectMeetup(meetup);
                    onClose();
                  }
                }}
                className="border border-border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground">{meetup.title}</h3>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{meetup.location_name}</span>
                    </div>

                    {meetup.is_open_ended ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span className="italic">Open-ended</span>
                      </div>
                    ) : meetup.start_datetime && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(meetup.start_datetime), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    )}

                    {meetup.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {meetup.description}
                      </p>
                    )}

                    {meetup.creator && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/u/${meetup.creator_id}`);
                        }}
                        className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50 hover:underline"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={meetup.creator.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10">
                            {(meetup.creator.display_name || "A").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">
                          {meetup.creator.display_name || "Anonymous"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
