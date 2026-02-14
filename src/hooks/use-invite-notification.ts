import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTutorial } from "@/components/onboarding";

const CACHE_KEY = "xcrol-invite-notification-seen";

function getCachedSeen(userId: string): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.userId === userId && parsed.seen === true;
  } catch {
    return false;
  }
}

function setCachedSeen(userId: string) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, seen: true }));
}

export const useInviteNotification = () => {
  const { user } = useAuth();
  const { isVisible: tutorialVisible } = useTutorial();
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasSeenNotification, setHasSeenNotification] = useState(false);

  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Check localStorage cache first
      if (getCachedSeen(user.id)) {
        setHasSeenNotification(true);
        setLoading(false);
        return;
      }

      try {
        const { data: seenData } = await supabase
          .from('invite_notification_seen')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (seenData) {
          setHasSeenNotification(true);
          setCachedSeen(user.id);
        } else {
          setHasSeenNotification(false);
        }
      } catch (err) {
        setHasSeenNotification(false);
      } finally {
        setLoading(false);
      }
    };

    checkNotificationStatus();
  }, [user]);

  // Only show notification if user hasn't seen it AND tutorial is not visible
  useEffect(() => {
    if (!loading) {
      setShowNotification(!hasSeenNotification && !tutorialVisible);
    }
  }, [hasSeenNotification, tutorialVisible, loading]);

  const dismissNotification = async () => {
    if (!user) return;

    setShowNotification(false);
    setCachedSeen(user.id);
    
    try {
      await supabase
        .from('invite_notification_seen')
        .insert({ user_id: user.id });
    } catch (err) {
      console.error('Failed to mark notification as seen:', err);
    }
  };

  return {
    showNotification,
    dismissNotification,
    loading
  };
};
