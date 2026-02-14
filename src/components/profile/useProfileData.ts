import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { VisibilityLevel } from "@/components/PersonalInfoManager";
import { z } from "zod";

// Validation constants
export const MAX_DISPLAY_NAME_LENGTH = 50;
export const MAX_BIO_LENGTH = 1000;
export const MAX_LINK_LENGTH = 200;
export const MAX_PHONE_LENGTH = 20;
export const MAX_EMAIL_LENGTH = 255;
export const MAX_URL_LENGTH = 200;
export const MAX_ADDRESS_LENGTH = 500;
export const MAX_NICKNAMES_LENGTH = 200;

const emailSchema = z.string().email("Invalid email format").max(MAX_EMAIL_LENGTH, "Email is too long").optional().or(z.literal(""));

export interface ProfileData {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  link: string | null;
  hometown_city: string | null;
  hometown_country: string | null;
  whatsapp: string | null;
  phone_number: string | null;
  private_email: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  contact_email: string | null;
  birthday_day: number | null;
  birthday_month: number | null;
  birthday_year: number | null;
  home_address: string | null;
  mailing_address: string | null;
  nicknames: string | null;
  birthday_no_year_visibility: VisibilityLevel;
  birthday_year_visibility: VisibilityLevel;
  home_address_visibility: VisibilityLevel;
  mailing_address_visibility: VisibilityLevel;
  nicknames_visibility: VisibilityLevel;
}

export interface ProfileContactData {
  whatsapp: string;
  phone_number: string;
  private_email: string;
  instagram_url: string;
  linkedin_url: string;
  contact_email: string;
}

export interface PersonalInfoState {
  birthday_day: number | null;
  birthday_month: number | null;
  birthday_year: number | null;
  home_address: string | null;
  mailing_address: string | null;
  nicknames: string | null;
  birthday_no_year_visibility: VisibilityLevel;
  birthday_year_visibility: VisibilityLevel;
  home_address_visibility: VisibilityLevel;
  mailing_address_visibility: VisibilityLevel;
  nicknames_visibility: VisibilityLevel;
}

export function useProfileData() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");

  const [contactData, setContactData] = useState<ProfileContactData>({
    whatsapp: "",
    phone_number: "",
    private_email: "",
    instagram_url: "",
    linkedin_url: "",
    contact_email: "",
  });

  const [personalInfo, setPersonalInfo] = useState<PersonalInfoState>({
    birthday_day: null,
    birthday_month: null,
    birthday_year: null,
    home_address: null,
    mailing_address: null,
    nicknames: null,
    birthday_no_year_visibility: "buddy",
    birthday_year_visibility: "close_friend",
    home_address_visibility: "close_friend",
    mailing_address_visibility: "close_friend",
    nicknames_visibility: "friendly_acquaintance",
  });

  const handleContactChange = (field: keyof ProfileContactData, value: string) => {
    setContactData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadProfile(user.id);
  }, [user?.id, authLoading]);

  // Scroll to hash anchor
  useEffect(() => {
    if (location.hash && !loading) {
      const elementId = location.hash.slice(1);
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 400);
    }
  }, [location.hash, loading]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const p = data as unknown as ProfileData;
        setProfile(p);
        setDisplayName(p.display_name || "");
        setUsername(p.username || "");
        setAvatarUrl(p.avatar_url || "");
        setBio(p.bio || "");
        setLink(p.link || "");
        setContactData({
          whatsapp: p.whatsapp || "",
          phone_number: p.phone_number || "",
          private_email: p.private_email || "",
          instagram_url: p.instagram_url || "",
          linkedin_url: p.linkedin_url || "",
          contact_email: p.contact_email || "",
        });
        setPersonalInfo({
          birthday_day: p.birthday_day,
          birthday_month: p.birthday_month,
          birthday_year: p.birthday_year,
          home_address: p.home_address,
          mailing_address: p.mailing_address,
          nicknames: p.nicknames,
          birthday_no_year_visibility: (p.birthday_no_year_visibility as VisibilityLevel) || "buddy",
          birthday_year_visibility: (p.birthday_year_visibility as VisibilityLevel) || "close_friend",
          home_address_visibility: (p.home_address_visibility as VisibilityLevel) || "close_friend",
          mailing_address_visibility: (p.mailing_address_visibility as VisibilityLevel) || "close_friend",
          nicknames_visibility: (p.nicknames_visibility as VisibilityLevel) || "friendly_acquaintance",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = (value: string): string | null => {
    if (!value) return null;
    if (value.length < 2) return "Username must be at least 2 characters";
    if (value.length > 30) return "Username must be less than 30 characters";
    if (!/^[a-z0-9_]+$/.test(value)) return "Only lowercase letters, numbers, and underscores allowed";
    return null;
  };

  const handleUsernameChange = (value: string) => {
    const lowercased = value.toLowerCase();
    setUsername(lowercased);
    setUsernameError(validateUsername(lowercased));
  };

  const validateProfileData = (): boolean => {
    const usernameValidation = validateUsername(username);
    if (usernameValidation) {
      toast.error(usernameValidation);
      return false;
    }

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      toast.error(`Name must be less than ${MAX_DISPLAY_NAME_LENGTH} characters`);
      return false;
    }

    if (contactData.private_email) {
      const result = emailSchema.safeParse(contactData.private_email);
      if (!result.success) {
        toast.error("Invalid private email format");
        return false;
      }
    }

    if (contactData.contact_email) {
      const result = emailSchema.safeParse(contactData.contact_email);
      if (!result.success) {
        toast.error("Invalid contact email format");
        return false;
      }
    }

    if (contactData.phone_number && contactData.phone_number.length > MAX_PHONE_LENGTH) {
      toast.error(`Phone number must be less than ${MAX_PHONE_LENGTH} characters`);
      return false;
    }

    if (contactData.whatsapp && contactData.whatsapp.length > MAX_PHONE_LENGTH) {
      toast.error(`WhatsApp number must be less than ${MAX_PHONE_LENGTH} characters`);
      return false;
    }

    if (contactData.instagram_url && contactData.instagram_url.length > MAX_URL_LENGTH) {
      toast.error(`Instagram URL must be less than ${MAX_URL_LENGTH} characters`);
      return false;
    }

    if (contactData.linkedin_url && contactData.linkedin_url.length > MAX_URL_LENGTH) {
      toast.error(`LinkedIn URL must be less than ${MAX_URL_LENGTH} characters`);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validateProfileData()) return;

    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        display_name: displayName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH),
        avatar_url: avatarUrl,
        bio: bio.trim().slice(0, MAX_BIO_LENGTH),
        link: link.trim().slice(0, MAX_LINK_LENGTH) || null,
        whatsapp: contactData.whatsapp.trim().slice(0, MAX_PHONE_LENGTH) || null,
        phone_number: contactData.phone_number.trim().slice(0, MAX_PHONE_LENGTH) || null,
        private_email: contactData.private_email.trim().slice(0, MAX_EMAIL_LENGTH) || null,
        instagram_url: contactData.instagram_url.trim().slice(0, MAX_URL_LENGTH) || null,
        linkedin_url: contactData.linkedin_url.trim().slice(0, MAX_URL_LENGTH) || null,
        contact_email: contactData.contact_email.trim().slice(0, MAX_EMAIL_LENGTH) || null,
        birthday_day: personalInfo.birthday_day,
        birthday_month: personalInfo.birthday_month,
        birthday_year: personalInfo.birthday_year,
        home_address: personalInfo.home_address?.trim().slice(0, MAX_ADDRESS_LENGTH) || null,
        mailing_address: personalInfo.mailing_address?.trim().slice(0, MAX_ADDRESS_LENGTH) || null,
        nicknames: personalInfo.nicknames?.trim().slice(0, MAX_NICKNAMES_LENGTH) || null,
        birthday_no_year_visibility: personalInfo.birthday_no_year_visibility,
        birthday_year_visibility: personalInfo.birthday_year_visibility,
        home_address_visibility: personalInfo.home_address_visibility,
        mailing_address_visibility: personalInfo.mailing_address_visibility,
        nicknames_visibility: personalInfo.nicknames_visibility,
      };

      if (!profile?.username && username.trim()) {
        updateData.username = username.trim();
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("This username is already taken");
          return;
        }
        throw error;
      }

      toast.success("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
    setAvatarUrl(urlWithTimestamp);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlWithTimestamp })
      .eq("id", user.id);

    if (updateError) throw updateError;

    toast.success("Avatar uploaded successfully!");
  };

  const hometown =
    profile?.hometown_city && profile?.hometown_country
      ? `${profile.hometown_city}, ${profile.hometown_country}`
      : null;

  return {
    user,
    profile,
    loading,
    saving,
    displayName,
    setDisplayName,
    username,
    usernameError,
    handleUsernameChange,
    avatarUrl,
    bio,
    setBio,
    link,
    setLink,
    contactData,
    handleContactChange,
    personalInfo,
    setPersonalInfo,
    handleSave,
    handleAvatarUpload,
    hometown,
  };
}
