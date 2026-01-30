import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { WaitlistForm } from "@/components/WaitlistForm";

interface InviteCodeGateProps {
  onVerified: () => void;
}

export const InviteCodeGate = ({ onVerified }: InviteCodeGateProps) => {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    if (!user) {
      setError("You must be signed in");
      return;
    }

    setLoading(true);
    try {
      // Validate the invite code
      const { data: isValid, error: checkError } = await supabase
        .rpc("check_invite_code", { p_invite_code: inviteCode.trim() });

      if (checkError || !isValid) {
        setError("Invalid or already used invite code");
        setLoading(false);
        return;
      }

      // Use the invite code
      const { error: useError } = await supabase.rpc("use_invite_code", {
        p_invite_code: inviteCode.trim(),
        p_user_id: user.id,
        p_email: user.email || "",
      });

      if (useError) {
        setError("Failed to use invite code");
        setLoading(false);
        return;
      }

      // Mark user as verified
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ invite_verified: true })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating verification status:", updateError);
      }

      toast.success("Welcome to Xcrol!");
      onVerified();
    } catch (err) {
      console.error("Error verifying invite code:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showWaitlist) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <WaitlistForm onBack={() => setShowWaitlist(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Enter Your Invite Code</CardTitle>
          <CardDescription>
            Xcrol is currently invite-only. Enter your invite code to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                placeholder="Enter your invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="bg-muted/20 border-primary/30"
                disabled={loading}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button
              type="submit"
              variant="divine"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Continue"
              )}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowWaitlist(true)}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Don't have an invite code? Join the waitlist
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
