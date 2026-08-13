import { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Filter, Waves, PenLine, Rss, ArrowUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRequireAuth } from "@/components/auth/GuestAuthGate";
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
import { RssFeedManager } from "@/components/RssFeedManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { Reaction } from "@/components/XcrolReactions";
import type { RiverReply } from "@/components/RiverReplies";

interface RiverEntry {
  id: string;
  content: string;
  link: string | null;
  entry_date: string;
  privacy_level: string;
  user_id: string;
  latitude?: number | null;
  longitude?: number | null;
  location_label?: string | null;
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

export interface RepliesMap {
  [entryId: string]: RiverReply[];
}

const FILTER_OPTIONS = [
  { value: "all", label: "All Posts" },
  { value: "rss", label: "News Feeds" },
  { value: "close_friend", label: "Oath Bound (Close Friends)" },
  { value: "family", label: "Blood Bound (Family)" },
  { value: "buddy", label: "Companions & Above" },
  { value: "friendly_acquaintance", label: "Wayfarers & Above" },
  { value: "public", label: "Public & Above" },
];

export default function TheRiver() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedPostId = searchParams.get("post");
  const { user, loading: authLoading } = useAuth();
  const requireAuth = useRequireAuth();
  const isGuest = !user && !authLoading;
  const [entries, setEntries] = useState<RiverEntry[]>([]);
  const [reactions, setReactions] = useState<ReactionsMap>({});
  const [repliesMap, setRepliesMap] = useState<RepliesMap>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState(isGuest ? "public" : "all");
  const [hasMore, setHasMore] = useState(true);
  // Keyset pagination cursor: sort_at + id of the last entry loaded.
  const cursorRef = useRef<{ ts: string; id: string } | null>(null);
  const [hasScrolledToPost, setHasScrolledToPost] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hasLoadedRef = useRef(false);
  const prevFilterRef = useRef(filter);
  const loadRequestRef = useRef(0);
  const entriesRef = useRef<RiverEntry[]>([]);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);
  // Guests only see the 5 most recent public posts. Authenticated users see 20 per page.
  const PAGE_SIZE = isGuest ? 5 : 20;


  useEffect(() => {
    if (authLoading) return;
    const filterChanged = prevFilterRef.current !== filter;
    if (hasLoadedRef.current && !filterChanged) return;
    prevFilterRef.current = filter;
    hasLoadedRef.current = false;
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

  // Realtime: listen for new River entries and prepend them
  useEffect(() => {
    if (authLoading || filter === "rss") return;

    const channel = supabase
      .channel("river-live-entries")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "xcrol_entries" },
        async (payload) => {
          const newRow: any = payload.new;
          if (!newRow) return;

          // Skip if already in feed (e.g. own post via local navigation)
          if (entriesRef.current.some((e) => e.id === newRow.id)) return;

          // Visibility check via SECURITY DEFINER function
          const { data: canView } = await supabase.rpc("can_view_xcrol_entry", {
            p_entry_user_id: newRow.user_id,
            p_privacy_level: newRow.privacy_level,
            p_viewer_id: user?.id ?? null,
          });
          if (!canView) return;

          // Fetch author profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url, username")
            .eq("id", newRow.user_id)
            .maybeSingle();

          const newEntry: RiverEntry = {
            id: newRow.id,
            content: newRow.content,
            link: newRow.link,
            entry_date: newRow.entry_date,
            privacy_level: newRow.privacy_level,
            user_id: newRow.user_id,
            latitude: newRow.latitude ?? null,
            longitude: newRow.longitude ?? null,
            location_label: newRow.location_label ?? null,
            author: {
              display_name: profile?.display_name ?? null,
              avatar_url: profile?.avatar_url ?? null,
              username: profile?.username ?? null,
            },
          };

          const isScrolledDown = window.scrollY > 200;
          if (isScrolledDown && newRow.user_id !== user?.id) {
            setNewPostsCount((c) => c + 1);
          } else {
            setEntries((prev) => [newEntry, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, filter]);

  const handleShowNewPosts = () => {
    setNewPostsCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Reload to pull in fresh entries with full reaction/reply data
    loadEntries();
  };



  const withTimeout = async <T,>(promise: PromiseLike<T>, message: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), 15000);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timeoutId!);
    }
  };

  const loadEntries = async (loadMore = false) => {
    const requestId = ++loadRequestRef.current;

    if (!loadMore) {
      setLoading(true);
      setLoadError(null);
      cursorRef.current = null;
    }

    try {
      const cursor = loadMore ? cursorRef.current : null;

      const { data, error } = await withTimeout(
        supabase.rpc("get_river_entries", {
          p_viewer_id: user?.id ?? null,
          p_limit: PAGE_SIZE,
          p_filter: filter,
          p_before_ts: cursor?.ts ?? null,
          p_before_id: cursor?.id ?? null,
        }),
        "The River is taking too long to respond."
      );

      if (requestId !== loadRequestRef.current) return;

      if (error) throw error;

      if (!data || data.length === 0) {
        if (!loadMore) setEntries([]);
        setHasMore(false);
        hasLoadedRef.current = true;
        return;
      }

      const entryIds = data.map((e: any) => e.id);

      // Build author map from RPC data first
      const authorMap: Record<string, { display_name: string | null; username: string | null }> = {};
      data.forEach((e: any) => {
        authorMap[e.user_id] = { display_name: e.author_display_name, username: e.author_username };
      });

      // Fetch reactions and replies in parallel
      const [{ data: reactionsData, error: reactionsError }, { data: repliesData, error: repliesError }] = await withTimeout(
        Promise.all([
          supabase
            .from("xcrol_reactions")
            .select("entry_id, emoji, user_id")
            .in("entry_id", entryIds),
          supabase.rpc("get_river_replies", {
            p_entry_ids: entryIds,
            p_viewer_id: user?.id ?? null,
          }),
        ]),
        "The River comments are taking too long to respond."
      );

      if (requestId !== loadRequestRef.current) return;
      if (reactionsError) throw reactionsError;
      if (repliesError) throw repliesError;

      // Collect reactor user IDs that we don't already have profiles for
      const knownUserIds = new Set(Object.keys(authorMap));
      const missingReactorIds = new Set<string>();
      (reactionsData || []).forEach(r => {
        if (!knownUserIds.has(r.user_id)) missingReactorIds.add(r.user_id);
      });

      // Fetch missing reactor profiles (only if needed — no serial 3rd query if all are known)
      let reactorProfileMap: Record<string, { display_name: string | null; username: string | null }> = {};
      if (missingReactorIds.size > 0) {
        const { data: reactorProfiles, error: profilesError } = await withTimeout(
          supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", [...missingReactorIds]),
          "River profile names are taking too long to respond."
        );
        if (requestId !== loadRequestRef.current) return;
        if (profilesError) throw profilesError;
        reactorProfiles?.forEach(p => {
          reactorProfileMap[p.id] = p;
        });
      }

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

      // Group replies by entry_id
      const newRepliesMap: RepliesMap = {};
      (repliesData || []).forEach((r: any) => {
        if (!newRepliesMap[r.entry_id]) {
          newRepliesMap[r.entry_id] = [];
        }
        newRepliesMap[r.entry_id].push({
          ...r,
          author_display_name: r.display_name,
          author_avatar_url: r.avatar_url,
          author_username: r.username,
          parent_reply_id: r.parent_reply_id || null,
        });
      });

      const entriesWithAuthors: RiverEntry[] = data.map((e: any) => ({
        id: e.id,
        content: e.content,
        link: e.link,
        entry_date: e.entry_date,
        privacy_level: e.privacy_level,
        user_id: e.user_id,
        latitude: e.latitude ?? null,
        longitude: e.longitude ?? null,
        location_label: e.location_label ?? null,
        author: {
          display_name: e.author_display_name,
          avatar_url: e.author_avatar_url,
          username: e.author_username,
        },
      }));

      const last = data[data.length - 1] as any;
      cursorRef.current = { ts: last.sort_at, id: last.id };

      if (loadMore) {
        setEntries((prev) => [...prev, ...entriesWithAuthors]);
        setReactions((prev) => ({ ...prev, ...newReactionsMap }));
        setRepliesMap((prev) => ({ ...prev, ...newRepliesMap }));
      } else {
        setEntries(entriesWithAuthors);
        setReactions(newReactionsMap);
        setRepliesMap(newRepliesMap);
      }

      setHasMore(data.length === PAGE_SIZE);
      hasLoadedRef.current = true;
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      console.error("Error loading entries:", error);
      setLoadError(error instanceof Error ? error.message : "The River could not load.");
      if (!loadMore) {
        setEntries([]);
        setReactions({});
        setRepliesMap({});
      }
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false);
      }
    }
  };

  const refreshReplies = useCallback(async () => {
    const entryIds = entries.map(e => e.id);
    if (entryIds.length === 0) return;
    const { data } = await supabase.rpc("get_river_replies", {
      p_entry_ids: entryIds,
      p_viewer_id: user?.id ?? null,
    });
    const newRepliesMap: RepliesMap = {};
    (data || []).forEach((r: any) => {
      if (!newRepliesMap[r.entry_id]) newRepliesMap[r.entry_id] = [];
      newRepliesMap[r.entry_id].push({
        ...r,
        author_display_name: r.display_name,
        author_avatar_url: r.avatar_url,
        author_username: r.username,
        parent_reply_id: r.parent_reply_id || null,
      });
    });
    setRepliesMap(newRepliesMap);
  }, [entries, user?.id]);

  const filteredEntries = entries;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>The River — public posts on XCROL</title>
        <meta
          name="description"
          content="Browse the most recent public posts on The River — XCROL's daily-journal feed of real friendships and small stories."
        />
        <link rel="canonical" href="https://xcrol.com/the-river" />
        <meta property="og:title" content="The River — XCROL" />
        <meta property="og:description" content="Recent public posts from the XCROL community." />
        <meta property="og:url" content="https://xcrol.com/the-river" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Floating new-posts banner */}
      {newPostsCount > 0 && (
        <button
          onClick={handleShowNewPosts}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 animate-fade-in"
        >
          <ArrowUp className="h-4 w-4" />
          {newPostsCount} new {newPostsCount === 1 ? "post" : "posts"}
        </button>
      )}
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

        {/* Guest banner */}
        {isGuest && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">You're viewing the public River</p>
                <p className="text-sm text-muted-foreground">
                  Showing the 5 most recent public posts. Sign up to see more and to reply.
                </p>
              </div>
              <Button onClick={() => requireAuth("see more posts")}>Sign up</Button>
            </CardContent>
          </Card>
        )}

        {/* Filter (hidden for guests — locked to Public) */}
        {!isGuest && (
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

            {user && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <Rss className="h-4 w-4 mr-1" />
                    Feeds
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Manage RSS Feeds</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-y-auto flex-1 -mx-6 px-6">
                    <RssFeedManager />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Load error state */}
        {!loading && loadError && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">The River could not load</h3>
              <p className="text-muted-foreground mb-4">{loadError}</p>
              <Button onClick={() => loadEntries()}>Try again</Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !loadError && filteredEntries.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Waves className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">The River is quiet</h3>
              <p className="text-muted-foreground mb-4">
                {user 
                  ? "No posts match your filter, or your friends haven't shared anything yet."
                  : "No public posts yet. Check back soon."}
              </p>
              {!user && (
                <Button onClick={() => navigate("/auth")}>Sign Up / Sign In</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feed */}
        {!loading && !loadError && filteredEntries.length > 0 && (
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
                  replies={repliesMap[entry.id] || []}
                  currentUserId={user?.id ?? null}
                  onRepliesChange={refreshReplies}
                />
              </div>
            ))}

            {/* Load more — auth users only */}
            {!isGuest && hasMore && (
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

        {/* Sign up CTA for guests at the bottom of the 5-item list */}
        {isGuest && !loading && !loadError && filteredEntries.length > 0 && (
          <Card className="mt-6 border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center space-y-3">
              <Waves className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Want to see more?</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Sign up for XCROL to read the full River, reply to posts, and join the conversation.
                Email verification required before posting.
              </p>
              <Button size="lg" onClick={() => requireAuth("see the full feed")}>
                Sign up to continue
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
