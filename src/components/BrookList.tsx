import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Plus, Archive, Moon, Bell } from "lucide-react";
import { toast } from "sonner";
import { CreateBrookDialog } from "./CreateBrookDialog";
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

interface Brook {
  id: string;
  user1_id: string;
  user2_id: string;
  custom_name: string | null;
  status: string;
  inactivity_days: number;
  last_post_at: string | null;
  created_at: string;
  invite_email: string | null;
  partner?: {
    display_name: string | null;
    username: string | null;
  };
}

interface BrookListProps {
  userId: string;
  currentUsername: string | null;
}

export const BrookList = ({ userId, currentUsername }: BrookListProps) => {
  const navigate = useNavigate();
  const [brooks, setBrooks] = useState<Brook[]>([]);
  const [pendingBrooks, setPendingBrooks] = useState<Brook[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inactivityBrook, setInactivityBrook] = useState<Brook | null>(null);
  const [inactivityAction, setInactivityAction] = useState<string | null>(null);

  useEffect(() => {
    loadBrooks();
  }, [userId]);

  const loadBrooks = async () => {
    try {
      // Get all brooks where user is a participant
      const { data: brookData, error } = await supabase
        .from("brooks")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get partner profiles
      const partnerIds = (brookData || []).map(b => 
        b.user1_id === userId ? b.user2_id : b.user1_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", partnerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedBrooks = (brookData || []).map(brook => ({
        ...brook,
        partner: profileMap.get(brook.user1_id === userId ? brook.user2_id : brook.user1_id)
      }));

      // Separate active/rested from pending invites to current user
      const active = enrichedBrooks.filter(b => 
        b.status !== "pending" || b.user1_id === userId
      );
      const pending = enrichedBrooks.filter(b => 
        b.status === "pending" && b.user2_id === userId
      );

      setBrooks(active);
      setPendingBrooks(pending);

      // Check for inactivity prompts on active brooks
      const now = new Date();
      for (const brook of active.filter(b => b.status === "active")) {
        if (brook.last_post_at) {
          const lastPost = new Date(brook.last_post_at);
          const daysSince = Math.floor((now.getTime() - lastPost.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince >= brook.inactivity_days) {
            // Check if current user was the last to post
            const { data: lastPostData } = await supabase
              .from("brook_posts")
              .select("user_id")
              .eq("brook_id", brook.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            // Only show inactivity prompt to the active user (last poster)
            if (lastPostData?.user_id === userId) {
              setInactivityBrook(brook);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading brooks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBrookName = (brook: Brook) => {
    if (brook.custom_name) return brook.custom_name;
    if (brook.status === "pending" && brook.invite_email) {
      return `${currentUsername || "You"} & ${brook.invite_email.split("@")[0]} Brook`;
    }
    const partnerName = brook.partner?.username || brook.partner?.display_name || "Partner";
    return `${currentUsername || "You"} & ${partnerName} Brook`;
  };

  const handleAcceptInvite = async (brookId: string) => {
    try {
      const { error } = await supabase
        .from("brooks")
        .update({ status: "active" })
        .eq("id", brookId);

      if (error) throw error;
      toast.success("Brook activated!");
      loadBrooks();
    } catch (error) {
      console.error("Error accepting brook invite:", error);
      toast.error("Failed to accept invite");
    }
  };

  const handleDeclineInvite = async (brookId: string) => {
    try {
      const { error } = await supabase
        .from("brooks")
        .update({ status: "archived" })
        .eq("id", brookId);

      if (error) throw error;
      toast.success("Invite declined");
      loadBrooks();
    } catch (error) {
      console.error("Error declining brook invite:", error);
      toast.error("Failed to decline invite");
    }
  };

  const handleInactivityAction = async (action: string) => {
    if (!inactivityBrook) return;

    try {
      if (action === "rest") {
        await supabase
          .from("brooks")
          .update({ status: "rested" })
          .eq("id", inactivityBrook.id);
        toast.success("Brook is now resting");
      } else if (action === "archive") {
        await supabase
          .from("brooks")
          .update({ status: "archived" })
          .eq("id", inactivityBrook.id);
        toast.success("Brook archived");
      } else if (action === "nudge") {
        // Just show a message - no actual notification to the other user
        toast.success("Gentle nudge sent", { description: "Your partner will see a friendly reminder next time they visit" });
      }
      setInactivityBrook(null);
      loadBrooks();
    } catch (error) {
      console.error("Error handling inactivity:", error);
      toast.error("Failed to update brook");
    }
  };

  const activeCount = brooks.filter(b => b.status === "active" || b.status === "pending").length;
  const canCreateNew = activeCount < 5;

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Your Brooks
          </h3>
        </div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Droplets className="w-5 h-5" />
          Your Brooks
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2">{activeCount}/5</Badge>
          )}
        </h3>
        {canCreateNew && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Start a Brook
          </Button>
        )}
      </div>

      {/* Pending invites */}
      {pendingBrooks.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
          {pendingBrooks.map((brook) => (
            <Card key={brook.id} className="border-primary/50">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{getBrookName(brook)}</p>
                  <p className="text-sm text-muted-foreground">
                    Invited by {brook.partner?.display_name || brook.partner?.username}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAcceptInvite(brook.id)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeclineInvite(brook.id)}>
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Active brooks */}
      {brooks.length === 0 && pendingBrooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Droplets className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No brooks yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start a private two-person stream with someone special.
            </p>
            {canCreateNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="mt-4 gap-2"
              >
                <Plus className="w-4 h-4" />
                Start a Brook
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {brooks.map((brook) => (
            <Card 
              key={brook.id} 
              className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                brook.status === "archived" ? "opacity-60" : ""
              } ${brook.status === "rested" ? "border-muted" : ""}`}
              onClick={() => navigate(`/brook/${brook.id}`)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Droplets className={`w-5 h-5 ${
                    brook.status === "active" ? "text-primary" : "text-muted-foreground"
                  }`} />
                  <div>
                    <p className="font-medium">{getBrookName(brook)}</p>
                    <p className="text-xs text-muted-foreground">
                      {brook.status === "pending" && "Waiting for response..."}
                      {brook.status === "active" && brook.last_post_at && 
                        `Last activity: ${new Date(brook.last_post_at).toLocaleDateString()}`}
                      {brook.status === "rested" && "Resting"}
                      {brook.status === "archived" && "Archived"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {brook.status === "rested" && <Moon className="w-4 h-4 text-muted-foreground" />}
                  {brook.status === "archived" && <Archive className="w-4 h-4 text-muted-foreground" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateBrookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        userId={userId}
        onCreated={loadBrooks}
      />

      {/* Inactivity dialog */}
      <AlertDialog open={!!inactivityBrook} onOpenChange={(open) => !open && setInactivityBrook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This brook has been quiet</AlertDialogTitle>
            <AlertDialogDescription>
              No posts in {inactivityBrook?.inactivity_days} days. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => handleInactivityAction("rest")} className="gap-2">
              <Moon className="w-4 h-4" />
              Let it rest
            </AlertDialogCancel>
            <Button onClick={() => handleInactivityAction("archive")} variant="outline" className="gap-2">
              <Archive className="w-4 h-4" />
              Archive
            </Button>
            <Button onClick={() => handleInactivityAction("nudge")} className="gap-2">
              <Bell className="w-4 h-4" />
              Send gentle nudge
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};