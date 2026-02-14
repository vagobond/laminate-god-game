import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserSettings {
  email_notifications: boolean;
  friend_request_notifications: boolean;
  show_online_status: boolean;
  allow_friend_requests: boolean;
  default_share_email: boolean;
  default_share_hometown: boolean;
  default_share_connections: boolean;
  default_share_xcrol: boolean;
}

export interface DeletionRequest {
  id: string;
  status: string;
  reason: string | null;
  created_at: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  email_notifications: true,
  friend_request_notifications: true,
  show_online_status: true,
  allow_friend_requests: true,
  default_share_email: false,
  default_share_hometown: false,
  default_share_connections: false,
  default_share_xcrol: false,
};

export function useSettingsData(userId: string | undefined) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [existingRequest, setExistingRequest] = useState<DeletionRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);

  useEffect(() => {
    if (!userId) return;
    loadUserSettings(userId);
    loadDeletionRequest(userId);
  }, [userId]);

  const loadUserSettings = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          email_notifications: data.email_notifications,
          friend_request_notifications: data.friend_request_notifications,
          show_online_status: data.show_online_status,
          allow_friend_requests: data.allow_friend_requests,
          default_share_email: data.default_share_email,
          default_share_hometown: data.default_share_hometown,
          default_share_connections: data.default_share_connections,
          default_share_xcrol: data.default_share_xcrol,
        });
      }
      setSettingsLoaded(true);
    } catch (error) {
      console.error("Error loading settings:", error);
      setSettingsLoaded(true);
    }
  };

  const loadDeletionRequest = async (uid: string) => {
    setLoadingRequest(true);
    try {
      const { data, error } = await supabase
        .from("account_deletion_requests")
        .select("id, status, reason, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setExistingRequest(data);
    } catch (error) {
      console.error("Error loading deletion request:", error);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleSettingChange = async <K extends keyof UserSettings>(setting: K, value: UserSettings[K]) => {
    if (!userId) return;

    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);
    setSavingSettings(true);

    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, ...newSettings }, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Setting saved");
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Failed to save setting");
      setSettings(settings);
    } finally {
      setSavingSettings(false);
    }
  };

  return {
    settings,
    settingsLoaded,
    savingSettings,
    handleSettingChange,
    existingRequest,
    setExistingRequest,
    loadingRequest,
    loadDeletionRequest,
  };
}
