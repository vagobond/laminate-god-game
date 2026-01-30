import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useInviteVerified } from "@/hooks/use-invite-verified";
import { InviteCodeGate } from "@/components/InviteCodeGate";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireInvite?: boolean;
}

export const ProtectedRoute = ({ children, requireInvite = true }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isVerified, loading: verifyLoading, refetch } = useInviteVerified();

  // Show loading spinner while checking auth/verification status
  if (authLoading || verifyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in, show children (individual pages handle their own auth redirects)
  if (!user) {
    return <>{children}</>;
  }

  // If invite verification is required and user is not verified, show the gate
  if (requireInvite && !isVerified) {
    return <InviteCodeGate onVerified={refetch} />;
  }

  return <>{children}</>;
};
