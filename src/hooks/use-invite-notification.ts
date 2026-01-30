import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTutorial } from "@/components/onboarding";

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

      try {
        // Check if user has already seen the notification
        const { data: seenData } = await supabase
          .from('invite_notification_seen')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!seenData) {
          // User hasn't seen the notification yet
          setHasSeenNotification(false);
        } else {
          setHasSeenNotification(true);
        }
      } catch (err) {
        // If no record found, user hasn't seen it
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
