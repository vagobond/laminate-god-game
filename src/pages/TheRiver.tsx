import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Filter, Waves, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
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

import type { Reaction } from "@/components/XcrolReactions";

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

export type ReactionData = Reaction;

export interface ReactionsMap {
  [entryId: string]: Reaction[];
}

const FILTER_OPTIONS = [
  { value: "all", label: "All Posts" },
  { value: "close_friend", label: "Oath Bound (Close Friends)" },
  { value: "family", label: "Blood Bound (Family)" },
  { value: "buddy", label: "Companions & Above" },
  { value: "friendly_acquaintance", label: "Wayfarers & Above" },
  { value: "public", label: "Public Only" },
];

export default function TheRiver() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedPostId = searchParams.get("post");
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<RiverEntry[]>([]);
  const [reactions, setReactions] = useState<ReactionsMap>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [hasScrolledToPost, setHasScrolledToPost] = useState(false);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (authLoading) return;
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, filter]);

  // Scroll to highlighted post when it becomes available
  useEffect(() => {
    if (!highlightedPostId || hasScrolledToPost || loading) return;
    
    const postElement = postRefs.current.get(highlightedPostId);
    if (postElement) {
      postElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHasScrolledToPost(true);
    }
  }, [highlightedPostId, hasScrolledToPost, loading, entries]);

  const loadEntries = async (loadMore = false) => {
    if (!loadMore) {
      setLoading(true);
      setPage(0);
    }

    const currentPage = loadMore ? page + 1 : 0;
    const offset = currentPage * PAGE_SIZE;

    const { data, error } = await supabase.rpc("get_river_entries", {
      p_viewer_id: user?.id ?? null,
      p_limit: PAGE_SIZE,
      p_offset: offset,
      p_filter: filter,
    });

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

    const entryIds = data.map((e: any) => e.id);
    const allUserIds = new Set(data.map((e: any) => e.user_id));

    // Fetch reactions
    const { data: reactionsData } = await supabase
      .from("xcrol_reactions")
      .select("entry_id, emoji, user_id")
      .in("entry_id", entryIds);

    // Collect reactor user IDs for profile lookup
    const reactorIds = new Set<string>();
    (reactionsData || []).forEach(r => {
      if (!allUserIds.has(r.user_id)) reactorIds.add(r.user_id);
    });

    // Fetch reactor profiles (authors already come from the RPC)
    let reactorProfileMap: Record<string, { display_name: string | null; username: string | null }> = {};
    if (reactorIds.size > 0) {
      const { data: reactorProfiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", [...reactorIds]);
      reactorProfiles?.forEach(p => {
        reactorProfileMap[p.id] = p;
      });
    }

    // Build author map from RPC data
    const authorMap: Record<string, { display_name: string | null; username: string | null }> = {};
    data.forEach((e: any) => {
      authorMap[e.user_id] = { display_name: e.author_display_name, username: e.author_username };
    });
    const profileMap = { ...authorMap, ...reactorProfileMap };

    // Group reactions by entry_id
    const newReactionsMap: ReactionsMap = {};
    (reactionsData || []).forEach((r) => {
      if (!newReactionsMap[r.entry_id]) {
        newReactionsMap[r.entry_id] = [];
      }
      const existing = newReactionsMap[r.entry_id].find(x => x.emoji === r.emoji);
      const userName = profileMap[r.user_id]?.display_name || profileMap[r.user_id]?.username || "Anonymous";
      
      if (existing) {
        existing.count++;
        existing.users = existing.users || [];
        existing.users.push({ id: r.user_id, name: userName });
        if (user && r.user_id === user.id) {
          existing.hasReacted = true;
        }
      } else {
        newReactionsMap[r.entry_id].push({
          emoji: r.emoji,
          count: 1,
          hasReacted: user ? r.user_id === user.id : false,
          users: [{ id: r.user_id, name: userName }]
        });
      }
    });

    const entriesWithAuthors: RiverEntry[] = data.map((e: any) => ({
      id: e.id,
      content: e.content,
      link: e.link,
      entry_date: e.entry_date,
      privacy_level: e.privacy_level,
      user_id: e.user_id,
      author: {
        display_name: e.author_display_name,
        avatar_url: e.author_avatar_url,
        username: e.author_username,
      },
    }));

    if (loadMore) {
      setEntries((prev) => [...prev, ...entriesWithAuthors]);
      setReactions((prev) => ({ ...prev, ...newReactionsMap }));
      setPage(currentPage);
    } else {
      setEntries(entriesWithAuthors);
      setReactions(newReactionsMap);
    }

    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
  };

  const filteredEntries = entries;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Waves className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">The River</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)}>
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
              <div
                key={entry.id}
                ref={(el) => {
                  if (el) postRefs.current.set(entry.id, el);
                }}
                className={highlightedPostId === entry.id ? "ring-2 ring-primary rounded-lg" : ""}
              >
                <RiverEntryCard 
                  entry={entry} 
                  initialReactions={reactions[entry.id] || []}
                  onReactionsChange={(newReactions) => {
                    setReactions(prev => ({ ...prev, [entry.id]: newReactions }));
                  }}
                />
              </div>
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
