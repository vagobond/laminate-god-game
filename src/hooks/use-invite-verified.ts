import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const CACHE_KEY = "xcrol-invite-verified";

function getCached(userId: string): boolean | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.userId === userId) return parsed.verified;
  } catch {}
  return null;
}

function setCache(userId: string, verified: boolean) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, verified }));
}

export const useInviteVerified = () => {
  const { user, loading: authLoading } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkVerification = useCallback(async () => {
    if (!user) {
      setIsVerified(null);
      setLoading(false);
      return;
    }

    // Use cached value for instant render
    const cached = getCached(user.id);
    if (cached === true) {
      setIsVerified(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("invite_verified")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking invite verification:", error);
        setIsVerified(false);
      } else {
        const verified = data?.invite_verified ?? false;
        setIsVerified(verified);
        if (verified) setCache(user.id, true);
      }
    } catch (err) {
      console.error("Error checking invite verification:", err);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    checkVerification();
  }, [user, authLoading, checkVerification]);

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
      setCache(user.id, true);
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
