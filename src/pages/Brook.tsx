import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Droplets, 
  Settings2, 
  Moon, 
  Archive, 
  RotateCcw,
  Edit2,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { BrookComposer } from "@/components/BrookComposer";
import { BrookPostCard } from "@/components/BrookPostCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BrookData {
  id: string;
  user1_id: string;
  user2_id: string;
  custom_name: string | null;
  status: string;
  inactivity_days: number;
  last_post_at: string | null;
  created_at: string;
}

interface BrookPost {
  id: string;
  content: string;
  link: string | null;
  user_id: string;
  created_at: string;
  author: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

const Brook = () => {
  const { brookId } = useParams<{ brookId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [brook, setBrook] = useState<BrookData | null>(null);
  const [partner, setPartner] = useState<{ display_name: string | null; username: string | null } | null>(null);
  const [posts, setPosts] = useState<BrookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [customName, setCustomName] = useState("");
  const [myUsername, setMyUsername] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.id && brookId) {
      loadBrook();
      loadMyProfile();
    }
  }, [user?.id, brookId]);

  const loadMyProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    setMyUsername(data?.username || null);
  };

  const loadBrook = async () => {
    if (!brookId || !user?.id) return;

    setLoading(true);
    try {
      // Load brook data
      const { data: brookData, error: brookError } = await supabase
        .from("brooks")
        .select("*")
        .eq("id", brookId)
        .single();

      if (brookError) throw brookError;

      // Verify user is a participant
      if (brookData.user1_id !== user.id && brookData.user2_id !== user.id) {
        toast.error("You don't have access to this brook");
        navigate("/my-xcrol");
        return;
      }

      setBrook(brookData);
      setCustomName(brookData.custom_name || "");

      // Load partner profile
      const partnerId = brookData.user1_id === user.id ? brookData.user2_id : brookData.user1_id;
      const { data: partnerData } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", partnerId)
        .single();

      setPartner(partnerData);

      // Load posts
      await loadPosts();
    } catch (error) {
      console.error("Error loading brook:", error);
      toast.error("Failed to load brook");
      navigate("/my-xcrol");
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!brookId) return;

    try {
      const { data: postsData, error } = await supabase
        .from("brook_posts")
        .select("*")
        .eq("brook_id", brookId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get author profiles
      const userIds = [...new Set((postsData || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      setPosts((postsData || []).map(post => ({
        ...post,
        author: profileMap.get(post.user_id) || {
          display_name: null,
          avatar_url: null,
          username: null
        }
      })));
    } catch (error) {
      console.error("Error loading brook posts:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("brook_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success("Post deleted");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleSaveName = async () => {
    if (!brook) return;

    try {
      const { error } = await supabase
        .from("brooks")
        .update({ custom_name: customName.trim() || null })
        .eq("id", brook.id);

      if (error) throw error;
      setBrook({ ...brook, custom_name: customName.trim() || null });
      setEditingName(false);
      toast.success("Name updated");
    } catch (error) {
      console.error("Error updating brook name:", error);
      toast.error("Failed to update name");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!brook) return;

    try {
      const { error } = await supabase
        .from("brooks")
        .update({ status: newStatus })
        .eq("id", brook.id);

      if (error) throw error;
      setBrook({ ...brook, status: newStatus });
      toast.success(`Brook ${newStatus === "active" ? "reactivated" : newStatus}`);
    } catch (error) {
      console.error("Error updating brook status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleInactivityDaysChange = async (days: string) => {
    if (!brook) return;

    try {
      const { error } = await supabase
        .from("brooks")
        .update({ inactivity_days: parseInt(days) })
        .eq("id", brook.id);

      if (error) throw error;
      setBrook({ ...brook, inactivity_days: parseInt(days) });
      toast.success("Inactivity setting updated");
    } catch (error) {
      console.error("Error updating inactivity days:", error);
      toast.error("Failed to update setting");
    }
  };

  const getBrookName = () => {
    if (brook?.custom_name) return brook.custom_name;
    const partnerName = partner?.username || partner?.display_name || "Partner";
    return `${myUsername || "You"} & ${partnerName} Brook`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!brook) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-20">
        <div className="text-muted-foreground">Brook not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/my-xcrol")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings2 className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">Inactivity reminder</p>
                <Select 
                  value={brook.inactivity_days.toString()} 
                  onValueChange={handleInactivityDaysChange}
                >
                  <SelectTrigger className="mt-1 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">After 3 days</SelectItem>
                    <SelectItem value="7">After 7 days</SelectItem>
                    <SelectItem value="9">After 9 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DropdownMenuSeparator />
              {brook.status === "active" && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusChange("rested")}>
                    <Moon className="w-4 h-4 mr-2" />
                    Let it rest
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                </>
              )}
              {(brook.status === "rested" || brook.status === "archived") && (
                <DropdownMenuItem onClick={() => handleStatusChange("active")}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reactivate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Droplets className="w-8 h-8 text-primary" />
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={getBrookName()}
                  className="max-w-xs"
                />
                <Button size="icon" variant="ghost" onClick={handleSaveName}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{getBrookName()}</h1>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => setEditingName(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          {brook.status !== "active" && (
            <p className="text-sm text-muted-foreground">
              {brook.status === "pending" && "Waiting for response..."}
              {brook.status === "rested" && "This brook is resting"}
              {brook.status === "archived" && "This brook is archived"}
            </p>
          )}
        </div>

        {/* Composer - only for active brooks */}
        {brook.status === "active" && user && (
          <BrookComposer
            brookId={brook.id}
            userId={user.id}
            onPostCreated={loadPosts}
          />
        )}

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Droplets className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No posts yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to share something in this brook!
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <BrookPostCard
                key={post.id}
                post={post}
                currentUserId={user?.id || ""}
                onDelete={handleDeletePost}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Brook;