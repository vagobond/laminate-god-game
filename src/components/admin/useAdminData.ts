import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  UserProfile,
  UserRole,
  FlaggedReference,
  AllReference,
  DeletionRequest,
  WaitlistEntry,
  AdminStats,
} from "./types";

export function useAdminData() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalFriendships: 0 });
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [flaggedReferences, setFlaggedReferences] = useState<FlaggedReference[]>([]);
  const [allReferences, setAllReferences] = useState<AllReference[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [processingDeletion, setProcessingDeletion] = useState<string | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [deleteRefId, setDeleteRefId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please sign in to access admin dashboard");
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
      return;
    }

    setCurrentUserId(user.id);
    setIsAdmin(true);
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const [
        usersResult,
        rolesResult,
        userCountResult,
        friendshipCountResult,
        waitlistResult,
        flaggedResult,
        refsResult,
        deletionResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id, display_name, username, email, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("id, user_id, role, created_at").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("friendships").select("*", { count: "exact", head: true }),
        supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
        supabase.from("flagged_references").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("user_references").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("account_deletion_requests").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      ]);

      if (usersResult.data) {
        const { data: inviteData } = await supabase
          .from("user_invites")
          .select("invitee_id, invitee_email, inviter_id")
          .eq("status", "accepted");

        const inviterMap = new Map<string, string>();
        (inviteData || []).forEach((inv) => {
          if (inv.invitee_id) inviterMap.set(inv.invitee_id, inv.inviter_id);
          if (inv.invitee_email) {
            const matchedUser = usersResult.data!.find((u) => u.email === inv.invitee_email);
            if (matchedUser && !inviterMap.has(matchedUser.id)) {
              inviterMap.set(matchedUser.id, inv.inviter_id);
            }
          }
        });

        const inviterIds = [...new Set(inviterMap.values())];
        const inviterProfiles = new Map<string, { display_name: string | null; email: string | null }>();
        if (inviterIds.length > 0) {
          const { data: invProfiles } = await supabase
            .from("profiles")
            .select("id, display_name, email")
            .in("id", inviterIds);
          (invProfiles || []).forEach((p) => {
            inviterProfiles.set(p.id, { display_name: p.display_name, email: p.email });
          });
        }

        const enrichedUsers = usersResult.data.map((user) => {
          const inviterId = inviterMap.get(user.id);
          const inviter = inviterId ? inviterProfiles.get(inviterId) : null;
          return { ...user, invited_by_name: inviter?.display_name || null, invited_by_email: inviter?.email || null };
        });
        setUsers(enrichedUsers);
      }

      setStats({ totalUsers: userCountResult.count || 0, totalFriendships: friendshipCountResult.count || 0 });
      if (waitlistResult.data) setWaitlist(waitlistResult.data);

      const allUserIds = new Set<string>();
      rolesResult.data?.forEach((r) => allUserIds.add(r.user_id));
      flaggedResult.data?.forEach((f) => allUserIds.add(f.flagged_by));

      const flaggedReferenceIds = [...new Set((flaggedResult.data || []).map((f) => f.reference_id))];
      let referencesForFlagged: any[] = [];
      if (flaggedReferenceIds.length > 0) {
        const { data: refs } = await supabase.from("user_references").select("*").in("id", flaggedReferenceIds);
        referencesForFlagged = refs || [];
        referencesForFlagged.forEach((r) => { allUserIds.add(r.from_user_id); allUserIds.add(r.to_user_id); });
      }

      refsResult.data?.forEach((r) => { allUserIds.add(r.from_user_id); allUserIds.add(r.to_user_id); });
      deletionResult.data?.forEach((r: any) => allUserIds.add(r.user_id));

      const profilesMap = new Map<string, { display_name: string | null; email: string | null; username?: string | null }>();
      if (allUserIds.size > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, display_name, email, username").in("id", [...allUserIds]);
        (profiles || []).forEach((p) => { profilesMap.set(p.id, { display_name: p.display_name, email: p.email, username: p.username }); });
      }

      if (rolesResult.data && rolesResult.data.length > 0) {
        setRoles(rolesResult.data.map((role) => ({ ...role, profile: profilesMap.get(role.user_id) })));
      }

      if (flaggedResult.data && flaggedResult.data.length > 0) {
        const referencesMap = new Map(referencesForFlagged.map((r) => [r.id, r]));
        setFlaggedReferences(
          flaggedResult.data.map((flag) => {
            const reference = referencesMap.get(flag.reference_id);
            return { ...flag, reference, flagger: profilesMap.get(flag.flagged_by), from_user: reference ? profilesMap.get(reference.from_user_id) : null, to_user: reference ? profilesMap.get(reference.to_user_id) : null };
          })
        );
      }

      if (refsResult.data && refsResult.data.length > 0) {
        setAllReferences(refsResult.data.map((ref) => ({ ...ref, from_user: profilesMap.get(ref.from_user_id), to_user: profilesMap.get(ref.to_user_id) })));
      }

      if (deletionResult.data && deletionResult.data.length > 0) {
        setDeletionRequests(deletionResult.data.map((req: any) => ({ ...req, profile: profilesMap.get(req.user_id) })));
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcastMessage = async () => {
    if (!broadcastMessage.trim() || !currentUserId) {
      toast.error("Please enter a message");
      return;
    }
    setSendingBroadcast(true);
    try {
      const { data: allUsers, error: usersError } = await supabase.from("profiles").select("id").neq("id", currentUserId);
      if (usersError) throw usersError;
      if (!allUsers || allUsers.length === 0) { toast.error("No users to send message to"); setSendingBroadcast(false); return; }
      const messages = allUsers.map((user) => ({ from_user_id: currentUserId, to_user_id: user.id, content: broadcastMessage.trim(), platform_suggestion: "system_broadcast" }));
      const { error: insertError } = await supabase.from("messages").insert(messages);
      if (insertError) throw insertError;
      toast.success(`Broadcast sent to ${allUsers.length} users`);
      setBroadcastMessage("");
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast.error("Failed to send broadcast message");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDeleteReference = async (refId: string) => {
    try {
      const { error } = await supabase.from("user_references").delete().eq("id", refId);
      if (error) throw error;
      toast.success("Reference deleted");
      setAllReferences((prev) => prev.filter((r) => r.id !== refId));
      setFlaggedReferences((prev) => prev.filter((f) => f.reference_id !== refId));
      setShowDeleteDialog(false);
      setDeleteRefId(null);
    } catch (error) {
      console.error("Error deleting reference:", error);
      toast.error("Failed to delete reference");
    }
  };

  const handleResolveFlag = async (flagId: string, action: "dismissed" | "resolved") => {
    try {
      const { error } = await supabase.from("flagged_references").update({ status: action, resolved_at: new Date().toISOString(), resolved_by: currentUserId }).eq("id", flagId);
      if (error) throw error;
      toast.success(`Flag ${action}`);
      setFlaggedReferences((prev) => prev.filter((f) => f.id !== flagId));
    } catch (error) {
      console.error("Error resolving flag:", error);
      toast.error("Failed to update flag");
    }
  };

  const handleProcessDeletionRequest = async (requestId: string, action: "approved" | "rejected") => {
    setProcessingDeletion(requestId);
    try {
      const { error } = await supabase.from("account_deletion_requests").update({ status: action, processed_by: currentUserId, processed_at: new Date().toISOString() }).eq("id", requestId);
      if (error) throw error;
      toast.success(action === "approved" ? "Deletion request approved. User account will be deleted." : "Deletion request rejected.");
      setDeletionRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error("Error processing deletion request:", error);
      toast.error("Failed to process deletion request");
    } finally {
      setProcessingDeletion(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ userId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to delete user");
      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setShowDeleteUserDialog(false);
      setDeleteUserId(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeletingUser(false);
    }
  };

  return {
    isAdmin,
    loading,
    users,
    roles,
    stats,
    broadcastMessage,
    setBroadcastMessage,
    sendingBroadcast,
    currentUserId,
    flaggedReferences,
    allReferences,
    deletionRequests,
    processingDeletion,
    waitlist,
    deleteRefId,
    setDeleteRefId,
    showDeleteDialog,
    setShowDeleteDialog,
    deleteUserId,
    setDeleteUserId,
    showDeleteUserDialog,
    setShowDeleteUserDialog,
    deletingUser,
    loadDashboardData,
    sendBroadcastMessage,
    handleDeleteReference,
    handleResolveFlag,
    handleProcessDeletionRequest,
    handleDeleteUser,
  };
}
