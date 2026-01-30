import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const useInviteVerified = () => {
  const { user, loading: authLoading } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkVerification = async () => {
    if (!user) {
      setIsVerified(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("invite_verified")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking invite verification:", error);
        setIsVerified(false);
      } else {
        setIsVerified(data?.invite_verified ?? false);
      }
    } catch (err) {
      console.error("Error checking invite verification:", err);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    checkVerification();
  }, [user, authLoading]);

  const markVerified = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ invite_verified: true })
        .eq("id", user.id);

      if (error) {
        console.error("Error marking as verified:", error);
        return false;
      }

      setIsVerified(true);
      return true;
    } catch (err) {
      console.error("Error marking as verified:", err);
      return false;
    }
  };

  return {
    isVerified,
    loading: authLoading || loading,
    markVerified,
    refetch: checkVerification,
  };
};
