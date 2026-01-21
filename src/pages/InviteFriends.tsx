import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Mail, Check, Clock, X, ArrowLeft, Sparkles, Copy, Infinity } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Invite {
  id: string;
  invite_code: string;
  invitee_email: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
  accepted_at: string | null;
}

interface InviteStats {
  accepted_count: number;
  total_slots: number;
  used_slots: number;
  available_slots: number;
  is_unlimited: boolean;
}

const InviteFriends = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteStats, setInviteStats] = useState<InviteStats | null>(null);
  
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
        loadInviteStats(session.user.id)
      ]);
    }
    setLoading(false);
  };

  const loadInvites = async (userId: string) => {
    const { data } = await supabase
      .from("user_invites")
      .select("*")
      .eq("inviter_id", userId)
      .order("created_at", { ascending: false });
    
    setInvites(data || []);
  };

  const loadInviteStats = async (userId: string) => {
    const { data, error } = await supabase.rpc("get_user_invite_stats", { p_user_id: userId });
    if (!error && data) {
      // Parse the JSON response
      const stats = typeof data === 'string' ? JSON.parse(data) : data;
      setInviteStats(stats as InviteStats);
    }
  };

  const handleCreateInvite = async () => {
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

    if (!inviteStats || inviteStats.available_slots <= 0) {
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

    // Insert the invite
    const { data: inviteData, error } = await supabase.from("user_invites").insert({
      inviter_id: user.id,
      invitee_email: inviteeEmail.trim().toLowerCase(),
      status: 'pending',
      sent_at: new Date().toISOString()
    }).select().single();

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already invited this person");
      } else {
        console.error("Invite error:", error);
        toast.error("Failed to create invite");
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
          isNewCountry: false
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
      loadInviteStats(user.id)
    ]);

    setSending(false);
  };

  const handleCancelInvite = async (inviteId: string) => {
    // Update status to available so the slot is freed up
    const { error } = await supabase
      .from("user_invites")
      .update({ status: 'cancelled' })
      .eq("id", inviteId);

    if (error) {
      toast.error("Failed to cancel invite");
    } else {
      toast.success("Invite cancelled");
      await Promise.all([
        loadInvites(user.id),
        loadInviteStats(user.id)
      ]);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied to clipboard!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "accepted":
        return <Badge className="gap-1 bg-green-600"><Check className="h-3 w-3" /> Accepted</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="gap-1"><X className="h-3 w-3" /> Cancelled</Badge>;
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

  const acceptedInvites = invites.filter(i => i.status === 'accepted');
  const pendingInvites = invites.filter(i => i.status === 'pending');

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
              Each accepted invite unlocks more invite slots. After 31 accepted invites, you get unlimited invites!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats */}
            {inviteStats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-background/50 border">
                  <div className="text-2xl font-bold text-primary flex items-center justify-center">
                    {inviteStats.is_unlimited ? (
                      <Infinity className="h-6 w-6" />
                    ) : (
                      inviteStats.available_slots
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50 border">
                  <div className="text-2xl font-bold text-amber-500">{pendingInvites.length}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50 border">
                  <div className="text-2xl font-bold text-green-500">{acceptedInvites.length}</div>
                  <div className="text-sm text-muted-foreground">Accepted</div>
                </div>
              </div>
            )}

            {/* Progression info */}
            {inviteStats && !inviteStats.is_unlimited && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-sm">
                <p className="text-foreground">
                  <span className="font-semibold">Progress:</span> {acceptedInvites.length} of 31 accepted invites
                </p>
                <p className="text-muted-foreground mt-1">
                  Next unlock: {inviteStats.total_slots - inviteStats.used_slots + inviteStats.available_slots} total slots after {
                    acceptedInvites.length < 1 ? "1 acceptance" :
                    acceptedInvites.length < 3 ? `${3 - acceptedInvites.length} more acceptances` :
                    acceptedInvites.length < 7 ? `${7 - acceptedInvites.length} more acceptances` :
                    acceptedInvites.length < 15 ? `${15 - acceptedInvites.length} more acceptances` :
                    `${31 - acceptedInvites.length} more acceptances for unlimited`
                  }
                </p>
              </div>
            )}

            {inviteStats?.is_unlimited && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                <p className="text-green-600 font-semibold flex items-center justify-center gap-2">
                  <Infinity className="h-5 w-5" />
                  You have unlimited invites!
                </p>
              </div>
            )}

            {/* Invite Form */}
            {inviteStats && inviteStats.available_slots > 0 ? (
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
                      onKeyDown={(e) => e.key === "Enter" && handleCreateInvite()}
                    />
                  </div>

                  <Button onClick={handleCreateInvite} disabled={sending} className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    {sending ? "Sending..." : "Send Invite"}
                  </Button>
                </div>
              </div>
            ) : inviteStats && inviteStats.available_slots <= 0 ? (
              <div className="p-4 rounded-lg bg-background/50 border text-center">
                <p className="text-muted-foreground">
                  You've used all your current invites! Once your pending invites are accepted, you'll unlock more.
                </p>
              </div>
            ) : null}

            {/* Sent Invites */}
            {invites.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Your Invites</h3>
                <div className="space-y-2">
                  {invites.filter(i => i.status !== 'cancelled').map(invite => (
                    <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="font-medium truncate">{invite.invitee_email || "Unused invite"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {new Date(invite.created_at).toLocaleDateString()}
                          <button
                            onClick={() => copyInviteCode(invite.invite_code)}
                            className="text-primary hover:text-primary/80 flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            Copy code
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invite.status)}
                        {invite.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelInvite(invite.id)}
                            title="Cancel invite"
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
