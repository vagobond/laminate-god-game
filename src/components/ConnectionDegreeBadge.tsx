import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, UserPlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ConnectionDegreeBadgeProps {
  profileId: string;
  currentUserId: string | null;
}

interface ProfileInfo {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const ConnectionDegreeBadge = ({ profileId, currentUserId }: ConnectionDegreeBadgeProps) => {
  const navigate = useNavigate();
  const [degree, setDegree] = useState<number | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChainDialog, setShowChainDialog] = useState(false);
  const [chainProfiles, setChainProfiles] = useState<ProfileInfo[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  
  // Introduction request state
  const [showIntroDialog, setShowIntroDialog] = useState(false);
  const [introMessage, setIntroMessage] = useState("");
  const [selectedIntroducer, setSelectedIntroducer] = useState<string | null>(null);
  const [sendingIntro, setSendingIntro] = useState(false);

  useEffect(() => {
    if (!currentUserId || currentUserId === profileId) {
      setLoading(false);
      return;
    }
    loadConnectionDegree();
  }, [currentUserId, profileId]);

  const loadConnectionDegree = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_connection_degree", {
        from_user_id: currentUserId!,
        to_user_id: profileId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setDegree(data[0].degree);
        setPath(data[0].path || []);
      } else {
        setDegree(null);
        setPath([]);
      }
    } catch (error) {
      console.error("Error loading connection degree:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChainProfiles = async () => {
    if (path.length === 0) return;
    
    setLoadingProfiles(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", path);

      if (error) throw error;

      // Sort profiles in path order
      const profileMap = new Map((data || []).map(p => [p.id, p]));
      const orderedProfiles = path.map(id => profileMap.get(id)).filter(Boolean) as ProfileInfo[];
      setChainProfiles(orderedProfiles);
    } catch (error) {
      console.error("Error loading chain profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleBadgeClick = () => {
    if (degree === null || degree === 0) return;
    loadChainProfiles();
    setShowChainDialog(true);
  };

  const handleRequestIntroduction = (introducerId: string) => {
    setSelectedIntroducer(introducerId);
    setIntroMessage("");
    setShowIntroDialog(true);
  };

  const sendIntroductionRequest = async () => {
    if (!currentUserId || !selectedIntroducer || !introMessage.trim()) return;
    
    setSendingIntro(true);
    try {
      const { error } = await supabase
        .from("introduction_requests")
        .insert({
          requester_id: currentUserId,
          introducer_id: selectedIntroducer,
          target_id: profileId,
          message: introMessage.trim(),
        });

      if (error) throw error;

      toast.success("Introduction request sent!");
      setShowIntroDialog(false);
      setShowChainDialog(false);
    } catch (error: any) {
      console.error("Error sending introduction request:", error);
      toast.error(error.message || "Failed to send introduction request");
    } finally {
      setSendingIntro(false);
    }
  };

  if (currentUserId === profileId) {
    return null;
  }

  if (!currentUserId) {
    return (
      <Badge
        variant="outline"
        role="button"
        tabIndex={0}
        className="cursor-pointer select-none bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
        onClick={() => navigate("/auth")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/auth");
        }}
      >
        Sign in to see connection
      </Badge>
    );
  }

  if (loading) {
    return (
      <Badge variant="outline" className="select-none bg-secondary/30 text-muted-foreground">
        Checking connection…
        <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />
      </Badge>
    );
  }

  if (degree === null || degree === 0) {
    return (
      <Badge variant="outline" className="select-none bg-secondary/30 text-muted-foreground">
        No connection
      </Badge>
    );
  }

  const getDegreeLabel = (deg: number) => {
    if (deg === 1) return "1st";
    if (deg === 2) return "2nd";
    if (deg === 3) return "3rd";
    return `${deg}th`;
  };

  const getDegreeTone = (deg: number) => {
    if (deg === 1) return "bg-primary/10 text-primary border-primary/20";
    if (deg === 2) return "bg-accent/40 text-foreground border-border";
    if (deg === 3) return "bg-secondary/40 text-foreground border-border";
    return "bg-secondary/30 text-foreground border-border";
  };

  // Find the first-degree friend in the chain who can introduce (index 1 in path)
  const getFirstDegreeIntroducer = () => {
    if (degree === 2 && path.length >= 2) {
      return path[1]; // The mutual friend
    }
    return null;
  };

  const introducerId = getFirstDegreeIntroducer();

  return (
    <>
      <Badge 
        variant="outline" 
        className={`cursor-pointer select-none hover:opacity-80 transition-opacity ${getDegreeTone(degree)}`}
        onClick={handleBadgeClick}
      >
        {getDegreeLabel(degree)} connection
      </Badge>

      {/* Connection Chain Dialog */}
      <Dialog open={showChainDialog} onOpenChange={setShowChainDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connection Path</DialogTitle>
            <DialogDescription>
              You are {getDegreeLabel(degree)} degree connected to this person
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingProfiles ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center flex-wrap gap-2">
                  {chainProfiles.map((profile, index) => (
                    <div key={profile.id} className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowChainDialog(false);
                          navigate(`/u/${profile.id}`);
                        }}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {(profile.display_name || "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium max-w-[80px] truncate">
                          {index === 0 ? "You" : profile.display_name || "Unknown"}
                        </span>
                      </button>
                      {index < chainProfiles.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Request Introduction Button for 2nd degree connections */}
                {degree === 2 && introducerId && (
                  <div className="pt-4 border-t">
                    <Button 
                      className="w-full" 
                      onClick={() => handleRequestIntroduction(introducerId)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Request Introduction
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Ask your mutual friend to introduce you
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Introduction Request Dialog */}
      <Dialog open={showIntroDialog} onOpenChange={setShowIntroDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Introduction</DialogTitle>
            <DialogDescription>
              Your mutual friend will receive this request and can choose to introduce you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Message to your mutual friend</label>
              <Textarea
                placeholder="Hi! I'd love to be introduced to this person because..."
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowIntroDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={sendIntroductionRequest}
                disabled={!introMessage.trim() || sendingIntro}
              >
                {sendingIntro && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConnectionDegreeBadge;
