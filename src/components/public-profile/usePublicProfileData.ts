import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface PublicProfileData {
  id: string;
  display_name: string | null;
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
}

export type FriendshipLevel = "close_friend" | "buddy" | "friendly_acquaintance" | "secret_friend" | null;

export function usePublicProfileData() {
  const { userId, username } = useParams<{ userId?: string; username?: string }>();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Transient failures (network blip, 401 during token refresh) are NOT
  // "not found" — they get their own state so the page can offer a retry
  // instead of claiming the profile doesn't exist.
  const [loadError, setLoadError] = useState(false);
  const [friendshipLevel, setFriendshipLevel] = useState<FriendshipLevel>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [meetupPrefs, setMeetupPrefs] = useState<any>(null);
  const [hostingPrefs, setHostingPrefs] = useState<any>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  // Mirrors `profile` so async callbacks can tell a first load from a
  // background refetch without stale-closure issues.
  const profileRef = useRef<PublicProfileData | null>(null);

  const retry = () => setReloadTick((t) => t + 1);

  // Resolve username to userId if needed. All target-dependent state resets
  // here: without the reset, a notFound latched on one profile kept showing
  // over the NEXT profile the user navigated to.
  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    profileRef.current = null;
    setNotFound(false);
    setLoadError(false);
    setFriendshipLevel(null);
    setResolvedUserId(null);
    setMeetupPrefs(null);
    setHostingPrefs(null);
    setLoading(true);

    const resolveUser = async () => {
      if (userId) {
        if (!cancelled) setResolvedUserId(userId);
        return;
      }

      if (!username) return;

      const normalizedUsername = username.trim().replace(/^@+/, "").toLowerCase();
      if (!normalizedUsername) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase.rpc("resolve_username_to_id", {
        target_username: normalizedUsername,
      });
      if (cancelled) return;

      if (error) {
        // Transport/auth failure — we don't know whether the name exists.
        console.error("Username resolution failed:", error);
        setLoadError(true);
        setLoading(false);
        return;
      }
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setResolvedUserId(data);
    };
    resolveUser();
    return () => {
      cancelled = true;
    };
  }, [userId, username, reloadTick]);

  // Load profile with secure function when we have user context. Depends on
  // currentUser?.id (not the user object): supabase-js emits a fresh user
  // object on every TOKEN_REFRESHED, which used to trigger a hidden hourly
  // refetch whose failure could replace a profile mid-read.
  useEffect(() => {
    if (!resolvedUserId) return;
    let cancelled = false;
    loadSecureProfile(resolvedUserId, currentUser?.id ?? null, () => cancelled);
    loadMeetupHostingPrefs(resolvedUserId);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUserId, currentUser?.id, reloadTick]);

  const loadMeetupHostingPrefs = async (profileId: string) => {
    setPrefsLoading(true);
    try {
      const [meetupRes, hostingRes] = await Promise.all([
        supabase.from("meetup_preferences").select("id, user_id, is_open_to_meetups, meetup_description, min_friendship_level").eq("user_id", profileId).maybeSingle(),
        supabase.from("hosting_preferences").select("id, user_id, is_open_to_hosting, hosting_description, min_friendship_level, max_guests, accommodation_type, compensation_type_preferred").eq("user_id", profileId).maybeSingle(),
      ]);

      if (meetupRes.error) console.error("Error loading meetup preferences:", meetupRes.error);
      if (hostingRes.error) console.error("Error loading hosting preferences:", hostingRes.error);

      setMeetupPrefs(meetupRes.data ?? null);
      setHostingPrefs(hostingRes.data ?? null);
    } finally {
      setPrefsLoading(false);
    }
  };

  const loadSecureProfile = async (
    profileId: string,
    viewerId: string | null,
    isCancelled: () => boolean = () => false
  ) => {
    // A background refetch (viewer id changed, retry) of an already-loaded
    // profile must not blank the page with a loading screen.
    const isRefetch = profileRef.current?.id === profileId;
    try {
      if (!isRefetch) setLoading(true);

      const { data, error } = await supabase.rpc("get_visible_profile", {
        viewer_id: viewerId ?? null,
        profile_id: profileId,
      });

      if (isCancelled()) return;
      if (error) throw error;

      if (data && data.length > 0) {
        const p = data[0];
        setLoadError(false);
        setNotFound(false);
        setProfile({
          id: p.id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          bio: p.bio,
          link: p.link,
          hometown_city: p.hometown_city,
          hometown_country: p.hometown_country,
          whatsapp: p.whatsapp,
          phone_number: p.phone_number,
          private_email: p.private_email,
          instagram_url: p.instagram_url,
          linkedin_url: p.linkedin_url,
          contact_email: p.contact_email,
          birthday_day: p.birthday_day,
          birthday_month: p.birthday_month,
          birthday_year: p.birthday_year,
          home_address: p.home_address,
          mailing_address: p.mailing_address,
          nicknames: p.nicknames,
        });
        profileRef.current = { id: p.id } as PublicProfileData;
        setFriendshipLevel(p.friendship_level as FriendshipLevel);
      } else {
        // Zero rows is the RPC's genuine "no visible profile" answer.
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      if (isCancelled()) return;
      // A failed REQUEST is not a missing PROFILE. Keep showing an
      // already-loaded profile; only surface the error state when there is
      // nothing on screen yet.
      if (!isRefetch) setLoadError(true);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  };

  // Scroll to hash anchor when page loads
  useEffect(() => {
    if (location.hash !== "#friends") return;
    if (loading) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scrollToFriends = () => {
      const element = document.getElementById("friends");
      if (!element) return;
      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    };

    requestAnimationFrame(scrollToFriends);
    const t1 = window.setTimeout(scrollToFriends, 250);
    const t2 = window.setTimeout(scrollToFriends, 900);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [location.key, location.hash, loading]);

  const isOwnProfile = currentUser?.id === resolvedUserId;

  const canSeeCloseFriendFields = friendshipLevel === "close_friend" || friendshipLevel === "secret_friend";
  const canSeeBuddyFields = canSeeCloseFriendFields || friendshipLevel === "buddy";
  const canSeeAcquaintanceFields = canSeeBuddyFields || friendshipLevel === "friendly_acquaintance";

  const canRequestMeetupOrHosting =
    !!currentUser &&
    !isOwnProfile &&
    (friendshipLevel === "friendly_acquaintance" ||
      friendshipLevel === "buddy" ||
      friendshipLevel === "close_friend" ||
      friendshipLevel === "secret_friend");

  const displayName = profile?.display_name || "Anonymous Xcroler";
  const hometown =
    profile?.hometown_city && profile?.hometown_country
      ? `${profile.hometown_city}, ${profile.hometown_country}`
      : null;

  return {
    profile,
    loading,
    notFound,
    loadError,
    retry,
    friendshipLevel,
    resolvedUserId,
    meetupPrefs,
    hostingPrefs,
    prefsLoading,
    currentUser,
    username,
    isOwnProfile,
    canSeeCloseFriendFields,
    canSeeBuddyFields,
    canSeeAcquaintanceFields,
    canRequestMeetupOrHosting,
    displayName,
    hometown,
  };
}
