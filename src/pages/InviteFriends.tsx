import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Mail, Check, Clock, X, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Invite {
  id: string;
  invitee_email: string;
  target_country: string | null;
  is_new_country: boolean;
  status: string;
  created_at: string;
}

interface AvailableInvites {
  existing_country_remaining: number;
  new_country_remaining: number;
}

const InviteFriends = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [availableInvites, setAvailableInvites] = useState<AvailableInvites>({ existing_country_remaining: 0, new_country_remaining: 0 });
  
  // Form state
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await Promise.all([
        loadInvites(session.user.id),
        loadAvailableInvites(session.user.id)
      ]);
    }
    setLoading(false);
  };

  const loadInvites = async (userId: string) => {
    const { data } = await supabase
      .from("country_invites")
      .select("*")
      .eq("inviter_id", userId)
      .order("created_at", { ascending: false });
    
    setInvites(data || []);
  };

  const loadAvailableInvites = async (userId: string) => {
    const { data } = await supabase.rpc("get_available_invites", { user_id: userId });
    if (data && data.length > 0) {
      setAvailableInvites(data[0]);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteeEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteeEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    const totalInvites = availableInvites.existing_country_remaining + availableInvites.new_country_remaining;
    if (totalInvites <= 0) {
      toast.error("No invites remaining");
      return;
    }

    setSending(true);

    // Get user's display name for the email
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", user.id)
      .single();

    const inviterName = profile?.display_name || profile?.email?.split("@")[0] || "A Xcrol user";

    // Use existing country invite type by default
    const useNewCountry = availableInvites.existing_country_remaining <= 0;

    // Insert the invite
    const { data: inviteData, error } = await supabase.from("country_invites").insert({
      inviter_id: user.id,
      invitee_email: inviteeEmail.trim().toLowerCase(),
      target_country: null,
      is_new_country: useNewCountry
    }).select().single();

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already invited this person");
      } else {
        toast.error("Failed to send invite");
      }
      setSending(false);
      return;
    }

    // Send the email via edge function
    try {
      const { error: emailError } = await supabase.functions.invoke("send-country-invite", {
        body: {
          inviteeEmail: inviteeEmail.trim().toLowerCase(),
          inviterName,
          targetCountry: null,
          inviteCode: inviteData.invite_code,
          isNewCountry: useNewCountry
        }
      });

      if (emailError) {
        console.error("Email sending failed:", emailError);
        toast.error("Invite created but email failed to send");
      } else {
        toast.success(`Invitation sent to ${inviteeEmail}!`);
      }
    } catch (emailErr) {
      console.error("Email function error:", emailErr);
      toast.error("Invite created but email failed to send");
    }

    setInviteeEmail("");
    await Promise.all([
      loadInvites(user.id),
      loadAvailableInvites(user.id)
    ]);

    setSending(false);
  };

  const handleCancelInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from("country_invites")
      .delete()
      .eq("id", inviteId);

    if (error) {
      toast.error("Failed to cancel invite");
    } else {
      toast.success("Invite cancelled");
      await Promise.all([
        loadInvites(user.id),
        loadAvailableInvites(user.id)
      ]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "accepted":
        return <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" /> Signed Up</Badge>;
      case "completed":
        return <Badge className="gap-1 bg-green-600"><Check className="h-3 w-3" /> Joined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 pt-20">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Invite Friends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Please log in to invite friends.</p>
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalInvitesAvailable = availableInvites.existing_country_remaining + availableInvites.new_country_remaining;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 pt-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-primary/20 bg-card/60 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Invite Your Friends</CardTitle>
            <CardDescription>
              Xcrol is more fun with friends! Invite people you know to join the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-background/50 border">
                <div className="text-2xl font-bold text-primary">{totalInvitesAvailable}</div>
                <div className="text-sm text-muted-foreground">Invites Available</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50 border">
                <div className="text-2xl font-bold text-primary">{invites.length}</div>
                <div className="text-sm text-muted-foreground">Invites Sent</div>
              </div>
            </div>

            {/* Invite Form */}
            {totalInvitesAvailable > 0 ? (
              <div className="space-y-4 p-4 rounded-lg bg-background/50 border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Send an Invite
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Friend's Email</Label>
                    <Input
                      type="email"
                      placeholder="friend@example.com"
                      value={inviteeEmail}
                      onChange={(e) => setInviteeEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                    />
                  </div>

                  <Button onClick={handleSendInvite} disabled={sending} className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    {sending ? "Sending..." : "Send Invite"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-background/50 border text-center">
                <p className="text-muted-foreground">
                  You've used all your invites! Once your invitees join, you'll receive more invites.
                </p>
              </div>
            )}

            {/* Sent Invites */}
            {invites.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Your Invites</h3>
                <div className="space-y-2">
                  {invites.map(invite => (
                    <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                      <div className="space-y-1">
                        <div className="font-medium">{invite.invitee_email}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(invite.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invite.status)}
                        {invite.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelInvite(invite.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InviteFriends;
