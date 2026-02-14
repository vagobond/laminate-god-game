import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Shield, RefreshCw, Send, MessageSquare, Flag, Star, Trash2, Check, X, UserX, Copy, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  created_at: string;
  invited_by_name?: string | null;
  invited_by_email?: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

interface FlaggedReference {
  id: string;
  reference_id: string;
  flagged_by: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reference?: {
    id: string;
    content: string;
    rating: number | null;
    reference_type: string;
    from_user_id: string;
    to_user_id: string;
  };
  flagger?: {
    display_name: string | null;
  };
  from_user?: {
    display_name: string | null;
  };
  to_user?: {
    display_name: string | null;
  };
}

interface AllReference {
  id: string;
  content: string;
  rating: number | null;
  reference_type: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  from_user?: {
    display_name: string | null;
  };
  to_user?: {
    display_name: string | null;
  };
}

interface DeletionRequest {
  id: string;
  user_id: string;
  reason: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  profile?: {
    display_name: string | null;
    email: string | null;
    username: string | null;
  };
}

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  invited_at: string | null;
  notes: string | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFriendships: 0,
  });
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [flaggedReferences, setFlaggedReferences] = useState<FlaggedReference[]>([]);
  const [allReferences, setAllReferences] = useState<AllReference[]>([]);
  const [deleteRefId, setDeleteRefId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [processingDeletion, setProcessingDeletion] = useState<string | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
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

    // Check if user has admin role
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

  const sendBroadcastMessage = async () => {
    if (!broadcastMessage.trim() || !currentUserId) {
      toast.error("Please enter a message");
      return;
    }

    setSendingBroadcast(true);
    
    try {
      // Get all user IDs except the admin
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("id")
        .neq("id", currentUserId);

      if (usersError) throw usersError;

      if (!allUsers || allUsers.length === 0) {
        toast.error("No users to send message to");
        setSendingBroadcast(false);
        return;
      }

      // Create messages for all users
      const messages = allUsers.map((user) => ({
        from_user_id: currentUserId,
        to_user_id: user.id,
        content: broadcastMessage.trim(),
        platform_suggestion: "system_broadcast",
      }));

      const { error: insertError } = await supabase
        .from("messages")
        .insert(messages);

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

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Parallelize all initial data fetches using Promise.all
      const [
        usersResult,
        rolesResult,
        userCountResult,
        friendshipCountResult,
        waitlistResult,
        flaggedResult,
        refsResult,
        deletionResult
      ] = await Promise.all([
        // Load users
        supabase
          .from("profiles")
          .select("id, display_name, username, email, created_at")
          .order("created_at", { ascending: false }),
        
        // Load roles
        supabase
          .from("user_roles")
          .select("id, user_id, role, created_at")
          .order("created_at", { ascending: false }),
        
        // Load user count
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true }),
        
        // Load friendship count
        supabase
          .from("friendships")
          .select("*", { count: "exact", head: true }),
        
        // Load waitlist
        supabase
          .from("waitlist")
          .select("*")
          .order("created_at", { ascending: false }),
        
        // Load flagged references
        supabase
          .from("flagged_references")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        
        // Load all references
        supabase
          .from("user_references")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        
        // Load deletion requests
        supabase
          .from("account_deletion_requests")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      ]);

      if (usersResult.data) {
        // Fetch invite data to show who invited each user
        const userIds = usersResult.data.map(u => u.id);
        const userEmails = usersResult.data.map(u => u.email).filter(Boolean) as string[];
        
        // Fetch accepted invites for these users
        const { data: inviteData } = await supabase
          .from("user_invites")
          .select("invitee_id, invitee_email, inviter_id")
          .eq("status", "accepted");
        
        // Build a map of invitee -> inviter_id
        const inviterMap = new Map<string, string>();
        (inviteData || []).forEach(inv => {
          if (inv.invitee_id) inviterMap.set(inv.invitee_id, inv.inviter_id);
          if (inv.invitee_email) {
            const matchedUser = usersResult.data!.find(u => u.email === inv.invitee_email);
            if (matchedUser && !inviterMap.has(matchedUser.id)) {
              inviterMap.set(matchedUser.id, inv.inviter_id);
            }
          }
        });

        // Fetch inviter profiles
        const inviterIds = [...new Set(inviterMap.values())];
        let inviterProfiles = new Map<string, { display_name: string | null; email: string | null }>();
        if (inviterIds.length > 0) {
          const { data: invProfiles } = await supabase
            .from("profiles")
            .select("id, display_name, email")
            .in("id", inviterIds);
          (invProfiles || []).forEach(p => {
            inviterProfiles.set(p.id, { display_name: p.display_name, email: p.email });
          });
        }

        // Enrich users with invite info
        const enrichedUsers = usersResult.data.map(user => {
          const inviterId = inviterMap.get(user.id);
          const inviter = inviterId ? inviterProfiles.get(inviterId) : null;
          return {
            ...user,
            invited_by_name: inviter?.display_name || null,
            invited_by_email: inviter?.email || null,
          };
        });
        setUsers(enrichedUsers);
      }

      // Set stats
      setStats({
        totalUsers: userCountResult.count || 0,
        totalFriendships: friendshipCountResult.count || 0,
      });

      // Set waitlist
      if (waitlistResult.data) setWaitlist(waitlistResult.data);

      // Collect all user IDs we need to fetch profiles for (batch all profile fetches)
      const allUserIds = new Set<string>();
      
      // From roles
      rolesResult.data?.forEach(r => allUserIds.add(r.user_id));
      
      // From flagged references
      flaggedResult.data?.forEach(f => allUserIds.add(f.flagged_by));
      
      // From references (need to fetch reference details first for user IDs)
      const flaggedReferenceIds = [...new Set((flaggedResult.data || []).map(f => f.reference_id))];
      
      // Fetch references for flagged items if needed
      let referencesForFlagged: any[] = [];
      if (flaggedReferenceIds.length > 0) {
        const { data: refs } = await supabase
          .from("user_references")
          .select("*")
          .in("id", flaggedReferenceIds);
        referencesForFlagged = refs || [];
        referencesForFlagged.forEach(r => {
          allUserIds.add(r.from_user_id);
          allUserIds.add(r.to_user_id);
        });
      }
      
      // From all references
      refsResult.data?.forEach(r => {
        allUserIds.add(r.from_user_id);
        allUserIds.add(r.to_user_id);
      });
      
      // From deletion requests
      deletionResult.data?.forEach((r: any) => allUserIds.add(r.user_id));

      // Single batch fetch for all profiles needed
      let profilesMap = new Map<string, { display_name: string | null; email: string | null; username?: string | null }>();
      if (allUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, email, username")
          .in("id", [...allUserIds]);
        
        (profiles || []).forEach(p => {
          profilesMap.set(p.id, { 
            display_name: p.display_name, 
            email: p.email,
            username: p.username
          });
        });
      }

      // Process roles with profiles
      if (rolesResult.data && rolesResult.data.length > 0) {
        const rolesWithProfiles = rolesResult.data.map(role => ({
          ...role,
          profile: profilesMap.get(role.user_id),
        }));
        setRoles(rolesWithProfiles);
      }

      // Process flagged references with details
      if (flaggedResult.data && flaggedResult.data.length > 0) {
        const referencesMap = new Map(referencesForFlagged.map(r => [r.id, r]));
        
        const flaggedWithDetails = flaggedResult.data.map(flag => {
          const reference = referencesMap.get(flag.reference_id);
          return {
            ...flag,
            reference,
            flagger: profilesMap.get(flag.flagged_by),
            from_user: reference ? profilesMap.get(reference.from_user_id) : null,
            to_user: reference ? profilesMap.get(reference.to_user_id) : null,
          };
        });
        setFlaggedReferences(flaggedWithDetails);
      }

      // Process all references
      if (refsResult.data && refsResult.data.length > 0) {
        const refsWithUsers = refsResult.data.map(ref => ({
          ...ref,
          from_user: profilesMap.get(ref.from_user_id),
          to_user: profilesMap.get(ref.to_user_id),
        }));
        setAllReferences(refsWithUsers);
      }

      // Process deletion requests
      if (deletionResult.data && deletionResult.data.length > 0) {
        const requestsWithProfiles = deletionResult.data.map((req: any) => ({
          ...req,
          profile: profilesMap.get(req.user_id),
        }));
        setDeletionRequests(requestsWithProfiles);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReference = async (refId: string) => {
    try {
      const { error } = await supabase
        .from("user_references")
        .delete()
        .eq("id", refId);

      if (error) throw error;

      toast.success("Reference deleted");
      setAllReferences(prev => prev.filter(r => r.id !== refId));
      setFlaggedReferences(prev => prev.filter(f => f.reference_id !== refId));
      setShowDeleteDialog(false);
      setDeleteRefId(null);
    } catch (error) {
      console.error("Error deleting reference:", error);
      toast.error("Failed to delete reference");
    }
  };

  const handleResolveFlag = async (flagId: string, action: "dismissed" | "resolved") => {
    try {
      const { error } = await supabase
        .from("flagged_references")
        .update({
          status: action,
          resolved_at: new Date().toISOString(),
          resolved_by: currentUserId,
        })
        .eq("id", flagId);

      if (error) throw error;

      toast.success(`Flag ${action}`);
      setFlaggedReferences(prev => prev.filter(f => f.id !== flagId));
    } catch (error) {
      console.error("Error resolving flag:", error);
      toast.error("Failed to update flag");
    }
  };

  const handleProcessDeletionRequest = async (requestId: string, action: "approved" | "rejected") => {
    setProcessingDeletion(requestId);
    try {
      const { error } = await supabase
        .from("account_deletion_requests")
        .update({
          status: action,
          processed_by: currentUserId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      if (action === "approved") {
        toast.success("Deletion request approved. User account will be deleted.");
        // Note: Actual account deletion would need to be handled via Supabase admin API
        // For now, we're just marking the request as approved
      } else {
        toast.success("Deletion request rejected.");
      }
      
      setDeletionRequests(prev => prev.filter(r => r.id !== requestId));
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
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      setUsers(prev => prev.filter(u => u.id !== userId));
      setShowDeleteUserDialog(false);
      setDeleteUserId(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeletingUser(false);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pt-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage users and permissions</p>
            </div>
          </div>
          <Button onClick={loadDashboardData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Friendships</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFriendships}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Admin Roles</TabsTrigger>
            <TabsTrigger value="deletions" className="flex items-center gap-1">
              <UserX className="w-3 h-3" />
              Deletions ({deletionRequests.length})
            </TabsTrigger>
            <TabsTrigger value="flagged" className="flex items-center gap-1">
              <Flag className="w-3 h-3" />
              Flagged ({flaggedReferences.length})
            </TabsTrigger>
            <TabsTrigger value="references">All References</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            <TabsTrigger value="waitlist" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Waitlist ({waitlist.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registered Users</CardTitle>
                    <CardDescription>All users registered on the platform</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const emails = users
                        .map(u => u.email)
                        .filter((email): email is string => !!email)
                        .join(", ");
                      
                      if (!emails) {
                        toast.error("No emails to copy");
                        return;
                      }
                      
                      navigator.clipboard.writeText(emails).then(() => {
                        toast.success(`Copied ${users.filter(u => u.email).length} emails to clipboard`);
                      }).catch(() => {
                        toast.error("Failed to copy emails");
                      });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Emails
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>@Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.display_name || "No name"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.username ? `@${user.username}` : "—"}
                        </TableCell>
                        <TableCell>{user.email || "No email"}</TableCell>
                        <TableCell className="text-sm">
                          {user.invited_by_name || user.invited_by_email ? (
                            <span title={user.invited_by_email || undefined}>
                              {user.invited_by_name || user.invited_by_email}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => user.username ? navigate(`/@${user.username}`) : navigate(`/u/${user.id}`)}
                          >
                            View Profile
                          </Button>
                          {user.id !== currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleteUserId(user.id);
                                setShowDeleteUserDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Admin Roles</CardTitle>
                <CardDescription>Users with special privileges</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          {role.profile?.display_name || "Unknown"}
                        </TableCell>
                        <TableCell>{role.profile?.email || "No email"}</TableCell>
                        <TableCell>
                          <Badge variant={role.role === "admin" ? "default" : "secondary"}>
                            {role.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(role.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deletions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Account Deletion Requests
                </CardTitle>
                <CardDescription>
                  Users requesting account deletion
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deletionRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending deletion requests
                  </p>
                ) : (
                  <div className="space-y-4">
                    {deletionRequests.map((request) => (
                      <div key={request.id} className="p-4 border border-destructive/30 rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {request.profile?.display_name || "Unknown User"}
                              {request.profile?.username && (
                                <span className="text-muted-foreground ml-2">
                                  @{request.profile.username}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.profile?.email || "No email"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requested: {new Date(request.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={processingDeletion === request.id}
                              onClick={() => handleProcessDeletionRequest(request.id, "rejected")}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={processingDeletion === request.id}
                              onClick={() => handleProcessDeletionRequest(request.id, "approved")}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                        {request.reason && (
                          <div className="bg-secondary/30 p-3 rounded">
                            <p className="text-sm font-medium">Reason:</p>
                            <p className="text-sm">{request.reason}</p>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => request.profile?.username 
                            ? navigate(`/@${request.profile.username}`) 
                            : navigate(`/u/${request.user_id}`)}
                        >
                          View Profile
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flagged">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Flagged References
                </CardTitle>
                <CardDescription>
                  References that users have flagged for review
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedReferences.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No flagged references pending review
                  </p>
                ) : (
                  <div className="space-y-4">
                    {flaggedReferences.map((flag) => (
                      <div key={flag.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              Flagged by: {flag.flagger?.display_name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(flag.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveFlag(flag.id, "dismissed")}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setDeleteRefId(flag.reference_id);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete Reference
                            </Button>
                          </div>
                        </div>
                        <div className="bg-destructive/10 p-2 rounded">
                          <p className="text-sm font-medium text-destructive">Flag Reason:</p>
                          <p className="text-sm">{flag.reason}</p>
                        </div>
                        {flag.reference && (
                          <div className="bg-secondary/30 p-3 rounded space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm">
                                <span className="font-medium">From:</span> {flag.from_user?.display_name || "Unknown"}
                                {" → "}
                                <span className="font-medium">To:</span> {flag.to_user?.display_name || "Unknown"}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{flag.reference.reference_type}</Badge>
                                {renderStars(flag.reference.rating)}
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{flag.reference.content}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="references">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  All References
                </CardTitle>
                <CardDescription>
                  Recent references (showing last 100)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allReferences.map((ref) => (
                      <TableRow key={ref.id}>
                        <TableCell className="font-medium">
                          {ref.from_user?.display_name || "Unknown"}
                        </TableCell>
                        <TableCell>{ref.to_user?.display_name || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{ref.reference_type}</Badge>
                        </TableCell>
                        <TableCell>{renderStars(ref.rating)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {ref.content}
                        </TableCell>
                        <TableCell>
                          {new Date(ref.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeleteRefId(ref.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Broadcast Message
                </CardTitle>
                <CardDescription>
                  Send a system message to all users. This will appear in their inbox.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your broadcast message here..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="min-h-[150px]"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    This will be sent to {stats.totalUsers - 1} users
                  </p>
                  <Button 
                    onClick={sendBroadcastMessage} 
                    disabled={sendingBroadcast || !broadcastMessage.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingBroadcast ? "Sending..." : "Send Broadcast"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waitlist">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Waitlist ({waitlist.length})
                </CardTitle>
                <CardDescription>
                  Users waiting for an invite code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {waitlist.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No users on the waitlist</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitlist.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.email}</TableCell>
                          <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(entry.email);
                                toast.success("Email copied!");
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Reference Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reference</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this reference? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteRefId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteRefId && handleDeleteReference(deleteRefId)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete this user account? This will remove all their data including profile, friendships, posts, and messages. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteUserId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deletingUser}
                onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}
              >
                {deletingUser ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
