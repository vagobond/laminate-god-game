import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Users, Clock, Inbox, ArrowLeft, Waves } from "lucide-react";
import { toast } from "sonner";
import FriendsList from "@/components/FriendsList";
import IntroductionRequestsManager from "@/components/IntroductionRequestsManager";
import { BrookList } from "@/components/BrookList";

interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string | null;
  created_at: string;
  profiles?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface PendingFriendship {
  id: string;
  to_user_id: string;
  message: string | null;
  created_at: string;
  profiles?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const TheForest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const initialTab = searchParams.get("tab") || "friends";
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [pendingFriendships, setPendingFriendships] = useState<PendingFriendship[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      loadFriendRequests(user.id);
      loadPendingFriendships(user.id);
      loadUsername(user.id);
    }
    setLoading(false);
  }, [user, authLoading]);

  const loadUsername = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    setUsername(data?.username ?? null);
  };

  const loadFriendRequests = async (userId: string) => {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("to_user_id", userId);

    if (error) {
      console.error("Error loading friend requests:", error);
      return;
    }

    if (!data || data.length === 0) {
      setFriendRequests([]);
      return;
    }

    // Batch fetch profiles using .in() instead of N+1 queries
    const fromUserIds = [...new Set(data.map(r => r.from_user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", fromUserIds);

    const profilesMap = new Map(
      (profiles || []).map(p => [p.id, p])
    );

    const requestsWithProfiles = data.map(request => ({
      ...request,
      profiles: profilesMap.get(request.from_user_id),
    }));

    setFriendRequests(requestsWithProfiles);
  };

  const loadPendingFriendships = async (userId: string) => {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("from_user_id", userId);

    if (error) {
      console.error("Error loading pending friendships:", error);
      return;
    }

    if (!data || data.length === 0) {
      setPendingFriendships([]);
      return;
    }

    // Batch fetch profiles using .in() instead of N+1 queries
    const toUserIds = [...new Set(data.map(r => r.to_user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", toUserIds);

    const profilesMap = new Map(
      (profiles || []).map(p => [p.id, p])
    );

    const pendingWithProfiles = data.map(request => ({
      ...request,
      profiles: profilesMap.get(request.to_user_id),
    }));

    setPendingFriendships(pendingWithProfiles);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, username")
      .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
      .limit(20);

    if (error) {
      console.error("Error searching users:", error);
      toast.error("Error searching users");
    } else {
      // Filter out current user
      setSearchResults((data || []).filter(p => p.id !== user?.id));
    }
    setSearching(false);
  };

  const handleAcceptRequest = async (requestId: string, fromUserId: string) => {
    try {
      // Use the database function to accept the friend request
      const { error } = await supabase.rpc("accept_friend_request", {
        request_id: requestId,
        friendship_level: "friendly_acquaintance"
      });

      if (error) throw error;

      toast.success("Friend request accepted!");
      if (user) {
        loadFriendRequests(user.id);
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Friend request declined");
      if (user) {
        loadFriendRequests(user.id);
      }
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error("Failed to decline request");
    }
  };

  const handleCancelPending = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Friend request cancelled");
      if (user) {
        loadPendingFriendships(user.id);
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground/60">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold">Sign in to view your friends</h1>
        <Button onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/powers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-glow">The Forest</h1>
            <p className="text-foreground/60">Your network of connections</p>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find People
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                    onClick={() => navigate(`/u/${profile.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>
                          {profile.display_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.display_name || "Anonymous"}</p>
                        {profile.username && (
                          <p className="text-sm text-foreground/60">@{profile.username}</p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">View Profile</Button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/invite-friends")}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Friends to Join
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="friends" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Friends</span>
            </TabsTrigger>
            <TabsTrigger value="brooks" className="flex items-center gap-1">
              <Waves className="h-4 w-4" />
              <span className="hidden sm:inline">Brooks</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-1">
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">Requests</span>
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Pending</span>
              {pendingFriendships.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingFriendships.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="introductions" className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Intros</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Friends</CardTitle>
              </CardHeader>
              <CardContent>
                <FriendsList userId={user.id} viewerId={user.id} showLevels={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brooks" className="mt-4">
            <BrookList userId={user.id} currentUsername={username} />
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {friendRequests.length === 0 ? (
                  <p className="text-foreground/60 text-center py-8">No pending friend requests</p>
                ) : (
                  <div className="space-y-3">
                    {friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.profiles?.avatar_url || undefined} />
                            <AvatarFallback>
                              {request.profiles?.display_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {request.profiles?.display_name || "Anonymous"}
                            </p>
                            {request.message && (
                              <p className="text-sm text-foreground/60">{request.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id, request.from_user_id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineRequest(request.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests (Sent)</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingFriendships.length === 0 ? (
                  <p className="text-foreground/60 text-center py-8">No pending requests sent</p>
                ) : (
                  <div className="space-y-3">
                    {pendingFriendships.map((pending) => (
                      <div
                        key={pending.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={pending.profiles?.avatar_url || undefined} />
                            <AvatarFallback>
                              {pending.profiles?.display_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {pending.profiles?.display_name || "Anonymous"}
                            </p>
                            {pending.message && (
                              <p className="text-sm text-foreground/60">{pending.message}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelPending(pending.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="introductions" className="mt-4">
            <IntroductionRequestsManager userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TheForest;
