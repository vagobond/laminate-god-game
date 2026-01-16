import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Singleton state to share unread count across components
let globalUnreadCount = 0;
let globalListeners: Set<(count: number) => void> = new Set();

const notifyListeners = (count: number) => {
  globalUnreadCount = count;
  globalListeners.forEach((listener) => listener(count));
};

export const useUnreadMessages = (userId: string | null) => {
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount);

  // Subscribe to global state changes
  useEffect(() => {
    const listener = (count: number) => setUnreadCount(count);
    globalListeners.add(listener);
    
    // Set initial value from global state
    setUnreadCount(globalUnreadCount);
    
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", userId)
      .is("read_at", null);

    notifyListeners(count || 0);
  }, [userId]);

  // Load on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadUnreadCount();
    }
  }, [userId, loadUnreadCount]);

  // Listen for messages-updated event
  useEffect(() => {
    const handleMessagesUpdated = () => {
      loadUnreadCount();
    };

    window.addEventListener("messages-updated", handleMessagesUpdated);
    return () => window.removeEventListener("messages-updated", handleMessagesUpdated);
  }, [loadUnreadCount]);

  return { unreadCount, refreshUnreadCount: loadUnreadCount };
};
