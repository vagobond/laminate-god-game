import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useInviteVerified } from "@/hooks/use-invite-verified";
import { InviteCodeGate } from "@/components/InviteCodeGate";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireInvite?: boolean;
}

export const ProtectedRoute = ({ children, requireInvite = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isVerified, loading: verifyLoading, refetch } = useInviteVerified();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect unauthenticated users to /auth
  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = location.pathname + location.search;
      navigate(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
    }
  }, [authLoading, user, navigate, location]);

  // Show loading spinner while checking auth/verification status
  if (authLoading || verifyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Still waiting for redirect
  if (!user) {
    return null;
  }

  // If invite verification is required and user is not verified, show the gate
  if (requireInvite && !isVerified) {
    return <InviteCodeGate onVerified={refetch} />;
  }

  return <>{children}</>;
};
