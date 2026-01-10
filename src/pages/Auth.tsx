import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { WelcomeModal } from "@/components/WelcomeModal";

// Validation schemas
const signInSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const signUpSchema = z.object({
  displayName: z.string()
    .trim()
    .min(1, { message: "Display name is required" })
    .max(50, { message: "Display name must be 50 characters or less" }),
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" }),
  inviteCode: z.string().trim().optional(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms and Privacy Policy" }),
  }),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthView = "default" | "forgot-password" | "reset-password-sent" | "update-password";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; displayName?: string; confirmPassword?: string; inviteCode?: string; agreedToTerms?: string }>({});
  const [inviteCode, setInviteCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("default");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    let didRedirect = false;

    const redirectTo = (url: string) => {
      if (didRedirect) return;
      didRedirect = true;
      window.location.href = url;
    };

    const bounceIfAlreadySignedIn = (session: any | null) => {
      if (!session || authView === "update-password") return;
      if (returnUrl) {
        redirectTo(returnUrl);
      } else {
        navigate("/");
      }
    };

    // Check URL hash for auth events (email confirmation, password recovery)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (type === "recovery") {
      setAuthView("update-password");
      return;
    }

    // Handle email confirmation - if we have tokens in the hash, set the session
    if (type === "signup" && accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        if (!error && data.session) {
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          toast.success("Email confirmed! Welcome to Xcrol!");
          setShowWelcomeModal(true);
        } else {
          console.error("Failed to set session from email confirmation:", error);
          toast.error("Email confirmed but there was an issue signing you in. Please try logging in.");
        }
      });
      return;
    }

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthView("update-password");
        return;
      }

      // If user visits /auth while already signed in, bounce them to returnUrl or home.
      if (event === "INITIAL_SESSION") {
        bounceIfAlreadySignedIn(session);
        return;
      }

      // After a successful sign-in/sign-up, redirect to returnUrl or show welcome modal.
      if (event === "SIGNED_IN" && session && authView !== "update-password") {
        if (returnUrl) {
          redirectTo(returnUrl);
        } else {
          setShowWelcomeModal(true);
        }
      }
    });

    // THEN check for existing session (covers cases where INITIAL_SESSION doesn't fire)
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        bounceIfAlreadySignedIn(session);
      })
      .catch(() => {
        // ignore
      });

    return () => subscription.unsubscribe();
  }, [navigate, authView, returnUrl]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signUpSchema.safeParse({ displayName, email, password, inviteCode, agreedToTerms });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      // If invite code provided, validate it first
      if (result.data.inviteCode) {
        const { data: inviteData, error: inviteError } = await supabase
          .from('country_invites')
          .select('id, invitee_email, status')
          .eq('invite_code', result.data.inviteCode)
          .single();

        if (inviteError || !inviteData) {
          setErrors({ inviteCode: "Invalid invite code" });
          setLoading(false);
          return;
        }

        if (inviteData.status !== 'pending') {
          setErrors({ inviteCode: "This invite code has already been used" });
          setLoading(false);
          return;
        }

        if (inviteData.invitee_email.toLowerCase() !== result.data.email.toLowerCase()) {
          setErrors({ inviteCode: "This invite code was sent to a different email address" });
          setLoading(false);
          return;
        }
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: result.data.displayName,
            invite_code: result.data.inviteCode || null,
          }
        }
      });

      if (error) throw error;

      // If invite code was used and user was created, update the invite status
      if (result.data.inviteCode && signUpData.user) {
        await supabase
          .from('country_invites')
          .update({ 
            status: 'accepted', 
            invitee_id: signUpData.user.id 
          })
          .eq('invite_code', result.data.inviteCode);
      }

      // Send welcome email to new user
      if (signUpData.user) {
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: result.data.email,
              displayName: result.data.displayName,
            }
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't block signup if welcome email fails
        }
      }

      setShowEmailConfirmation(true);
      toast.success("Check your email to verify your account!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) throw error;
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailValidation = z.string().trim().email({ message: "Please enter a valid email address" });
    const result = emailValidation.safeParse(email);
    
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(result.data, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;
      setAuthView("reset-password-sent");
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: result.data.password,
      });

      if (error) throw error;
      toast.success("Password updated successfully!");
      setAuthView("default");
      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname);
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const renderForgotPasswordForm = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Reset Your Password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-muted/20 border-primary/30"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>
        <Button
          type="submit"
          variant="divine"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setAuthView("default")}
        >
          Back to Sign In
        </Button>
      </form>
    </div>
  );

  const renderResetPasswordSent = () => (
    <div className="text-center space-y-4 py-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold">Check Your Email</h3>
      <p className="text-muted-foreground">
        We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Click the link in the email to reset your password.
      </p>
      <div className="flex flex-col gap-2 mt-4">
        <Button
          variant="outline"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth`,
              });
              if (error) throw error;
              toast.success("Reset email resent!");
            } catch (error: any) {
              toast.error(error.message || "Failed to resend email");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Sending..." : "Resend Reset Email"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setAuthView("default")}
        >
          Back to Sign In
        </Button>
      </div>
    </div>
  );

  const renderUpdatePasswordForm = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Set New Password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>
      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-muted/20 border-primary/30"
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
          <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-muted/20 border-primary/30"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>
        <Button
          type="submit"
          variant="divine"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );

  const renderContent = () => {
    if (authView === "forgot-password") {
      return renderForgotPasswordForm();
    }
    
    if (authView === "reset-password-sent") {
      return renderResetPasswordSent();
    }
    
    if (authView === "update-password") {
      return renderUpdatePasswordForm();
    }

    return (
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/20 border-primary/30"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/20 border-primary/30"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <Button
              type="submit"
              variant="divine"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => setAuthView("forgot-password")}
            >
              Forgot your password?
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          {showEmailConfirmation ? (
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
                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { error } = await supabase.auth.resend({
                        type: 'signup',
                        email: email,
                        options: {
                          emailRedirectTo: `${window.location.origin}/`,
                        }
                      });
                      if (error) throw error;
                      toast.success("Verification email resent!");
                    } catch (error: any) {
                      toast.error(error.message || "Failed to resend email");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? "Sending..." : "Resend Verification Email"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowEmailConfirmation(false)}
                >
                  Back to Sign Up
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Display Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="username"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-muted/20 border-primary/30"
                  maxLength={50}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName}</p>
                )}
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
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
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
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-invite-code">Invite Code (optional)</Label>
                <Input
                  id="signup-invite-code"
                  type="text"
                  placeholder="Enter invite code if you have one"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="bg-muted/20 border-primary/30"
                />
                {errors.inviteCode && (
                  <p className="text-sm text-destructive">{errors.inviteCode}</p>
                )}
                <p className="text-xs text-muted-foreground">If someone invited you, enter their code here</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms-checkbox"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-1"
                  />
                  <label
                    htmlFor="terms-checkbox"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    I have read and agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms and Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.agreedToTerms && (
                  <p className="text-sm text-destructive">{errors.agreedToTerms}</p>
                )}
              </div>
              <Button
                type="submit"
                variant="divine"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full animate-fade-in space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-glow">
          Join XCROL
        </h1>

        <Card className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow-teal">
          {renderContent()}
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            Back to Home
          </Button>
        </div>
      </div>

      <WelcomeModal 
        open={showWelcomeModal} 
        onOpenChange={(open) => {
          setShowWelcomeModal(open);
        }} 
      />
    </div>
  );
};

export default Auth;
