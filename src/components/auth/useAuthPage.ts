import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { signInSchema, signUpSchema, resetPasswordSchema, type AuthView, type AuthErrors } from "./schemas";

export const useAuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [inviteCode, setInviteCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("default");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showContentPolicy, setShowContentPolicy] = useState(false);
  const [agreedToContentPolicy, setAgreedToContentPolicy] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message || "Failed to sign in with Google");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    let didRedirect = false;

    const redirectTo = async (url: string) => {
      if (didRedirect) return;
      didRedirect = true;
      // Make sure Supabase has finished writing the session before leaving the
      // auth screen. A full reload here can race browser storage/service-worker
      // startup and make the next route appear signed out.
      try {
        await supabase.auth.getSession();
      } catch {
        // Continue; AuthProvider will handle the actual session state.
      }
      if (url.startsWith("/") && !url.startsWith("//")) {
        navigate(url, { replace: true });
      } else {
        window.location.assign(url);
      }
    };

    const bounceIfAlreadySignedIn = (session: any | null) => {
      if (!session || authView === "update-password") return;
      // Don't bounce if URL has recovery hash — let the recovery handler run first
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get("type") === "recovery") return;
      // Same for a PKCE recovery link (?code=) and for error links: an
      // already-signed-in user must still reach the reset form, not be bounced home.
      if (new URLSearchParams(window.location.search).get("code")) return;
      if (hashParams.get("error")) return;
      if (returnUrl) {
        redirectTo(returnUrl);
      } else {
        navigate("/", { replace: true });
      }
    };

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    // Supabase reports dead links (expired/already-used tokens) as an error in
    // the hash, not as a thrown error. Without this branch the user lands on a
    // normal sign-in screen with no explanation of why their link did nothing.
    const hashError = hashParams.get("error");
    if (hashError) {
      const code = hashParams.get("error_code");
      const description = hashParams.get("error_description")?.replace(/\+/g, " ");
      const message =
        code === "otp_expired"
          ? "That password reset link has expired. Request a new one below."
          : description || "That link is no longer valid. Please request a new one.";
      window.history.replaceState(null, "", window.location.pathname);
      // Show it in the form itself: the toaster mounts lazily and drops a toast
      // fired during this first effect pass, so a toast alone can go unseen.
      setErrors({ email: message });
      // Fire the toast once the toaster is mounted.
      setTimeout(() => toast.error(message), 0);
      setAuthView("forgot-password");
      return;
    }

    if (type === "recovery") {
      setAuthView("update-password");
      return;
    }

    // PKCE recovery links arrive as ?code=... instead of a hash fragment. The
    // client currently defaults to the implicit (hash) flow, so this branch is
    // inert today — it exists so that switching flowType to "pkce", or a future
    // supabase-js default flip, cannot silently break password reset again.
    const codeParam = new URLSearchParams(window.location.search).get("code");
    if (codeParam) {
      supabase.auth.exchangeCodeForSession(codeParam).then(({ error }) => {
        // Strip the code from the URL either way so a refresh can't replay it.
        window.history.replaceState(null, "", window.location.pathname);
        if (error) {
          const message = "That password reset link has expired. Request a new one below.";
          setErrors({ email: message });
          toast.error(message);
          setAuthView("forgot-password");
          return;
        }
        setAuthView("update-password");
      });
      return;
    }

    if (type === "signup" && accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(async ({ data, error }) => {
        if (!error && data.session) {
          window.history.replaceState(null, '', window.location.pathname);

          // Consume the pending invite code now that email is confirmed
          // Try sessionStorage first (same browser), then fall back to user metadata (cross-browser)
          let pendingInviteCode = sessionStorage.getItem('pendingInviteCode');
          let pendingInviteEmail = sessionStorage.getItem('pendingInviteEmail');
          
          if (!pendingInviteCode && data.session.user) {
            // Cross-browser: check user metadata for invite code stored during signup
            const metaInviteCode = data.session.user.user_metadata?.invite_code;
            if (metaInviteCode) {
              pendingInviteCode = metaInviteCode;
              pendingInviteEmail = data.session.user.email || '';
            }
          }
          
          if (pendingInviteCode && data.session.user) {
            try {
              await supabase.rpc('use_invite_code', {
                p_invite_code: pendingInviteCode,
                p_user_id: data.session.user.id,
                p_email: pendingInviteEmail || data.session.user.email || '',
              });
              // Clear invite_code from user metadata to prevent re-use
              await supabase.auth.updateUser({
                data: { invite_code: null }
              });
            } catch (err) {
              console.error('Failed to consume invite code:', err);
            } finally {
              sessionStorage.removeItem('pendingInviteCode');
              sessionStorage.removeItem('pendingInviteEmail');
            }
          }

          toast.success("Email confirmed! Welcome to Xcrol!");
          setShowWelcomeModal(true);
        } else {
          console.error("Failed to set session from email confirmation:", error);
          toast.error("Email confirmed but there was an issue signing you in. Please try logging in.");
        }
      });
      return;
    }

    // Use getSession only for initial bounce check — no duplicate onAuthStateChange listener
    // The AuthProvider already handles global auth state via onAuthStateChange.
    // This hook only needs to react to hash-based flows (signup confirmation, recovery)
    // and check if user is already signed in to bounce them away.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        bounceIfAlreadySignedIn(session);
      })
      .catch(() => {});

    // Listen only for PASSWORD_RECOVERY and SIGNED_IN events specific to auth page flows
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthView("update-password");
        return;
      }

      // Only handle SIGNED_IN from explicit login actions (not initial session)
      if (event === "SIGNED_IN" && session && authView !== "update-password") {
        // Use setTimeout to avoid conflicting with AuthProvider's state update
        setTimeout(() => {
          if (returnUrl) {
            redirectTo(returnUrl);
          } else {
            setShowWelcomeModal(true);
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, authView, returnUrl]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signUpSchema.safeParse({ displayName, email, password, inviteCode, agreedToTerms });
    if (!result.success) {
      const fieldErrors: AuthErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof AuthErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Show content policy dialog if not yet acknowledged
    if (!agreedToContentPolicy) {
      setShowContentPolicy(true);
      return;
    }

    setLoading(true);
    try {
      // If an invite code was provided, validate it (optional referral tracking)
      if (result.data.inviteCode) {
        const { data: isValid, error: checkError } = await supabase
          .rpc('check_invite_code', { p_invite_code: result.data.inviteCode });

        if (checkError || !isValid) {
          setErrors({ inviteCode: "Invalid or already used invite code" });
          setLoading(false);
          return;
        }
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            display_name: result.data.displayName,
            invite_code: result.data.inviteCode || null,
          }
        }
      });

      if (error) throw error;

      // Check if this is a genuinely new user (has identities) vs already-exists case
      const isNewUser = signUpData.user && 
        signUpData.user.identities && 
        signUpData.user.identities.length > 0;

      if (!isNewUser) {
        toast.error("An account with this email already exists. Please sign in instead.");
        setLoading(false);
        return;
      }

      // Store invite code to be consumed AFTER email confirmation
      // Save in sessionStorage for same-browser flow AND in DB for cross-browser flow
      if (result.data.inviteCode) {
        sessionStorage.setItem('pendingInviteCode', result.data.inviteCode);
        sessionStorage.setItem('pendingInviteEmail', result.data.email);
      }

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
      const fieldErrors: AuthErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof AuthErrors;
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

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed") ||
            error.message.toLowerCase().includes("email_not_confirmed")) {
          setAuthView("email-not-confirmed");
          return;
        }
        throw error;
      }
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });

      if (error) throw error;
      toast.success("Confirmation email sent! Check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend confirmation email");
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
      const fieldErrors: AuthErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof AuthErrors;
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
      window.history.replaceState(null, '', window.location.pathname);
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetEmail = async () => {
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
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });
      if (error) throw error;
      toast.success("Verification email resent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email");
    } finally {
      setLoading(false);
    }
  };

  // Called when user accepts content policy from the dialog
  const handleContentPolicyAccepted = () => {
    setAgreedToContentPolicy(true);
    setShowContentPolicy(false);
    // Re-trigger signup by submitting programmatically after state update
  };

  // After agreeing to content policy, auto-submit
  useEffect(() => {
    if (agreedToContentPolicy && !showContentPolicy) {
      // Create a synthetic form submit
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }
  }, [agreedToContentPolicy, showContentPolicy]);

  return {
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    displayName, setDisplayName,
    loading,
    errors,
    inviteCode, setInviteCode,
    agreedToTerms, setAgreedToTerms,
    showEmailConfirmation, setShowEmailConfirmation,
    authView, setAuthView,
    showWelcomeModal, setShowWelcomeModal,
    googleLoading,
    showContentPolicy, setShowContentPolicy,
    agreedToContentPolicy,
    handleContentPolicyAccepted,
    navigate,
    handleGoogleSignIn,
    handleSignUp,
    handleSignIn,
    handleResendConfirmation,
    handleForgotPassword,
    handleUpdatePassword,
    handleResendResetEmail,
    handleResendVerification,
  };
};
