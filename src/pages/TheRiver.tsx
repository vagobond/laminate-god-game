import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Loader2, Filter, Waves, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiverEntryCard } from "@/components/RiverEntryCard";

interface RiverEntry {
  id: string;
  content: string;
  link: string | null;
  entry_date: string;
  privacy_level: string;
  user_id: string;
  author: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

interface FriendshipMap {
  [userId: string]: string;
}

const FILTER_OPTIONS = [
  { value: "all", label: "All Posts" },
  { value: "close_friend", label: "Close Friends" },
  { value: "buddy", label: "Buddies & Above" },
  { value: "friendly_acquaintance", label: "Acquaintances & Above" },
  { value: "public", label: "Public Only" },
];

const FRIENDSHIP_HIERARCHY = ["close_friend", "secret_friend", "buddy", "friendly_acquaintance"];

export default function TheRiver() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<RiverEntry[]>([]);
  const [friendships, setFriendships] = useState<FriendshipMap>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadEntries();
    if (user) {
      loadFriendships();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadFriendships = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("friendships")
      .select("friend_id, level")
      .eq("user_id", user.id);

    if (data) {
      const map: FriendshipMap = {};
      data.forEach((f) => {
        map[f.friend_id] = f.level;
      });
      setFriendships(map);
    }
  };

  const loadEntries = async (loadMore = false) => {
    if (!loadMore) {
      setLoading(true);
      setPage(0);
    }

    const currentPage = loadMore ? page + 1 : 0;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("xcrol_entries")
      .select(`
        id,
        content,
        link,
        entry_date,
        privacy_level,
        user_id
      `)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error loading entries:", error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      if (!loadMore) setEntries([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    // Fetch author profiles
    const userIds = [...new Set(data.map((e) => e.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, username")
      .in("id", userIds);

    const profileMap: Record<string, typeof profiles extends (infer T)[] | null ? T : never> = {};
    profiles?.forEach((p) => {
      profileMap[p.id] = p;
    });

    const entriesWithAuthors: RiverEntry[] = data.map((entry) => ({
      ...entry,
      author: {
        display_name: profileMap[entry.user_id]?.display_name ?? null,
        avatar_url: profileMap[entry.user_id]?.avatar_url ?? null,
        username: profileMap[entry.user_id]?.username ?? null,
      },
    }));

    if (loadMore) {
      setEntries((prev) => [...prev, ...entriesWithAuthors]);
      setPage(currentPage);
    } else {
      setEntries(entriesWithAuthors);
    }

    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
  };

  const getFilteredEntries = () => {
    if (filter === "all") return entries;
    if (filter === "public") {
      return entries.filter((e) => e.privacy_level === "public");
    }

    // Filter by friendship level
    const filterIndex = FRIENDSHIP_HIERARCHY.indexOf(filter);
    if (filterIndex === -1) return entries;

    return entries.filter((e) => {
      // Own posts always visible
      if (e.user_id === user?.id) return true;
      
      const level = friendships[e.user_id];
      if (!level) return false;

      const levelIndex = FRIENDSHIP_HIERARCHY.indexOf(level);
      if (levelIndex === -1) return false;

      return levelIndex <= filterIndex;
    });
  };

  const filteredEntries = getFilteredEntries();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Waves className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">The River</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/powers")}>
            Back
          </Button>
        </div>

        {/* Write prompt for logged in users */}
        {user && (
          <Card 
            className="mb-6 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate("/my-xcrol")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <PenLine className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Write your Xcrol...</span>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredEntries.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Waves className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">The River is quiet</h3>
              <p className="text-muted-foreground mb-4">
                {user 
                  ? "No posts match your filter, or your friends haven't shared anything yet."
                  : "Sign in to see posts from your friends."}
              </p>
              {!user && (
                <Button onClick={() => navigate("/auth")}>Sign In</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feed */}
        {!loading && filteredEntries.length > 0 && (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <RiverEntryCard key={entry.id} entry={entry} />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => loadEntries(true)}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Sign in prompt for unauthenticated users */}
        {!user && !loading && filteredEntries.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground mb-2">
                Sign in to see more posts from friends
              </p>
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
