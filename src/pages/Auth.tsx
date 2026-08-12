import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import xcrolLogo from "@/assets/xcrol-logo.webp";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WelcomeModal } from "@/components/WelcomeModal";
import { ContentPolicyDialog } from "@/components/auth/ContentPolicyDialog";
import { WaitlistForm } from "@/components/WaitlistForm";
import { useAuthPage } from "@/components/auth/useAuthPage";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordSent } from "@/components/auth/ResetPasswordSent";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { EmailNotConfirmed } from "@/components/auth/EmailNotConfirmed";

const Auth = () => {
  const auth = useAuthPage();
  const [tab, setTab] = useState("signin");

  const renderContent = () => {
    if (auth.authView === "forgot-password") {
      return (
        <ForgotPasswordForm
          email={auth.email}
          setEmail={auth.setEmail}
          errors={auth.errors}
          loading={auth.loading}
          onSubmit={auth.handleForgotPassword}
          onBack={() => auth.setAuthView("default")}
        />
      );
    }

    if (auth.authView === "reset-password-sent") {
      return (
        <ResetPasswordSent
          email={auth.email}
          loading={auth.loading}
          onResend={auth.handleResendResetEmail}
          onBack={() => auth.setAuthView("default")}
        />
      );
    }

    if (auth.authView === "update-password") {
      return (
        <UpdatePasswordForm
          password={auth.password}
          setPassword={auth.setPassword}
          confirmPassword={auth.confirmPassword}
          setConfirmPassword={auth.setConfirmPassword}
          errors={auth.errors}
          loading={auth.loading}
          onSubmit={auth.handleUpdatePassword}
        />
      );
    }

    if (auth.authView === "email-not-confirmed") {
      return (
        <EmailNotConfirmed
          email={auth.email}
          loading={auth.loading}
          onResend={auth.handleResendConfirmation}
          onBack={() => auth.setAuthView("default")}
        />
      );
    }

    if (auth.authView === "waitlist") {
      return <WaitlistForm onBack={() => auth.setAuthView("default")} />;
    }

    return (
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-4">
          <SignInForm
            email={auth.email}
            setEmail={auth.setEmail}
            password={auth.password}
            setPassword={auth.setPassword}
            errors={auth.errors}
            loading={auth.loading}
            googleLoading={auth.googleLoading}
            onSubmit={auth.handleSignIn}
            onForgotPassword={() => auth.setAuthView("forgot-password")}
            onGoogleSignIn={auth.handleGoogleSignIn}
          />
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          <SignUpForm
            email={auth.email}
            setEmail={auth.setEmail}
            password={auth.password}
            setPassword={auth.setPassword}
            displayName={auth.displayName}
            setDisplayName={auth.setDisplayName}
            inviteCode={auth.inviteCode}
            setInviteCode={auth.setInviteCode}
            agreedToTerms={auth.agreedToTerms}
            setAgreedToTerms={auth.setAgreedToTerms}
            errors={auth.errors}
            loading={auth.loading}
            googleLoading={auth.googleLoading}
            showEmailConfirmation={auth.showEmailConfirmation}
            setShowEmailConfirmation={auth.setShowEmailConfirmation}
            onSubmit={auth.handleSignUp}
            onGoogleSignIn={auth.handleGoogleSignIn}
            onResendVerification={auth.handleResendVerification}
            setAuthView={auth.setAuthView}
          />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <Helmet>
        <title>Sign In or Join XCROL</title>
        <meta name="description" content="Sign in or create your XCROL account. Take control of your networks — invite-only, no ads, no tracking." />
        <link rel="canonical" href="https://xcrol.com/auth" />
        <meta property="og:title" content="Sign In or Join XCROL" />
        <meta property="og:description" content="Sign in or create your XCROL account. Take control of your networks — invite-only, no ads, no tracking." />
        <meta property="og:url" content="https://xcrol.com/auth" />
      </Helmet>
      <div className="max-w-md w-full animate-fade-in space-y-8">
        <div className="space-y-4">
          <img src={xcrolLogo} alt="XCROL" className="mx-auto h-16 w-auto" />
          <h1 className="text-4xl md:text-5xl font-bold text-center text-glow">
            {tab === "signup" ? "Join XCROL" : "Welcome Back"}
          </h1>
        </div>

        <Card className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow-teal">
          {renderContent()}
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => auth.navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            Back to Home
          </Button>
        </div>
      </div>

      <WelcomeModal
        open={auth.showWelcomeModal}
        onOpenChange={(open) => {
          auth.setShowWelcomeModal(open);
        }}
      />

      <ContentPolicyDialog
        open={auth.showContentPolicy}
        onAccept={auth.handleContentPolicyAccepted}
        onCancel={() => auth.setShowContentPolicy(false)}
      />
    </div>
  );
};

export default Auth;
