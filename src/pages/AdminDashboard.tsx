import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Shield, RefreshCw, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
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
      // Load users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, display_name, email, created_at")
        .order("created_at", { ascending: false });
      
      if (usersData) setUsers(usersData);


      // Load roles with profile info
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .order("created_at", { ascending: false });
      
      if (rolesData) {
        // Fetch profile info for each role
        const rolesWithProfiles = await Promise.all(
          rolesData.map(async (role) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, email")
              .eq("id", role.user_id)
              .maybeSingle();
            return { ...role, profile };
          })
        );
        setRoles(rolesWithProfiles);
      }

      // Load stats
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      
      const { count: friendshipCount } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: userCount || 0,
        totalFriendships: friendshipCount || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
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
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Admin Roles</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Registered Users</CardTitle>
                <CardDescription>All users registered on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Email</TableHead>
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
                        <TableCell>{user.email || "No email"}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/u/${user.id}`)}
                          >
                            View Profile
                          </Button>
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
        </Tabs>
      </div>
    </div>
  );
}
