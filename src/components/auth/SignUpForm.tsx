import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { GoogleSignInButton } from "./GoogleSignInButton";
import type { AuthErrors, AuthView } from "./schemas";

interface SignUpFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  inviteCode: string;
  setInviteCode: (v: string) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (v: boolean) => void;
  errors: AuthErrors;
  loading: boolean;
  googleLoading: boolean;
  showEmailConfirmation: boolean;
  setShowEmailConfirmation: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onResendVerification: () => void;
  setAuthView: (v: AuthView) => void;
}

export const SignUpForm = ({
  email, setEmail, password, setPassword,
  displayName, setDisplayName,
  inviteCode, setInviteCode,
  agreedToTerms, setAgreedToTerms,
  errors, loading, googleLoading,
  showEmailConfirmation, setShowEmailConfirmation,
  onSubmit, onGoogleSignIn, onResendVerification, setAuthView,
}: SignUpFormProps) => {
  if (showEmailConfirmation) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Check Your Email</h3>
        <p className="text-muted-foreground">
          We've sent a verification link to <span className="font-medium text-foreground">{email}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Click the link in the email to verify your account and complete registration.
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <Button variant="outline" disabled={loading} onClick={onResendVerification}>
            {loading ? "Sending..." : "Resend Verification Email"}
          </Button>
          <Button variant="ghost" onClick={() => setShowEmailConfirmation(false)}>
            Back to Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Display Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="How you'd like to appear (e.g. your first name)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="bg-muted/20 border-primary/30"
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          You can change this anytime. You'll pick your permanent @username later.
        </p>
        {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-muted/20 border-primary/30"
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-muted/20 border-primary/30"
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-invite-code">
          Invite Code <span className="text-muted-foreground text-xs">(optional — you and your inviter both earn points)</span>
        </Label>
        <Input
          id="signup-invite-code"
          type="text"
          placeholder="Have an invite code? Enter it here"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="bg-muted/20 border-primary/30"
        />
        {errors.inviteCode && <p className="text-sm text-destructive">{errors.inviteCode}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms-checkbox"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            className="mt-1"
          />
          <label htmlFor="terms-checkbox" className="text-sm leading-relaxed cursor-pointer">
            I have read and agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80" onClick={(e) => e.stopPropagation()}>
              Terms and Conditions
            </a>,{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80" onClick={(e) => e.stopPropagation()}>
              Privacy Policy
            </a>, and{" "}
            <a href="/content-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80" onClick={(e) => e.stopPropagation()}>
              Content Policy
            </a>
          </label>
        </div>
        {errors.agreedToTerms && <p className="text-sm text-destructive">{errors.agreedToTerms}</p>}
      </div>
      <Button type="submit" variant="divine" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-primary/30" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <GoogleSignInButton onClick={onGoogleSignIn} loading={googleLoading} label="Sign up with Google" />
    </form>
  );
};
