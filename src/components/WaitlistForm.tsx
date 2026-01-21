import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle } from "lucide-react";

interface WaitlistFormProps {
  onBack: () => void;
}

export const WaitlistForm = ({ onBack }: WaitlistFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert({ email: email.toLowerCase().trim() });

      if (insertError) {
        if (insertError.code === '23505') {
          setError("This email is already on the waitlist!");
        } else {
          throw insertError;
        }
        return;
      }

      setSubmitted(true);
      toast.success("You've been added to the waitlist!");
    } catch (err: any) {
      console.error('Waitlist error:', err);
      setError("Failed to join waitlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold">You're on the list!</h3>
        <p className="text-muted-foreground">
          We'll notify you at <span className="font-medium text-foreground">{email}</span> when a spot opens up.
        </p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          Back to Sign Up
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Join the Waitlist</h3>
        <p className="text-sm text-muted-foreground">
          Xcrol is currently invite-only. Enter your email to be notified when a spot opens up.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="waitlist-email">Email</Label>
          <Input
            id="waitlist-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-muted/20 border-primary/30"
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <Button
          type="submit"
          variant="divine"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Waitlist"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onBack}
        >
          Back to Sign Up
        </Button>
      </form>
    </div>
  );
};
