import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const useInviteNotification = () => {
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);

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
          setShowNotification(true);
        }
      } catch (err) {
        // If no record found, show the notification
        setShowNotification(true);
      } finally {
        setLoading(false);
      }
    };

    checkNotificationStatus();
  }, [user]);

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
