import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Trash2, ExternalLink, Pencil, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MentionText } from "@/components/MentionText";
import { LinkPreview } from "@/components/LinkPreview";
import { GroupPostReactions } from "@/components/group/GroupPostReactions";
import { GroupPostComments } from "@/components/group/GroupPostComments";
import type { GroupPost, Group } from "@/hooks/use-groups";

interface GroupPostsTabProps {
  posts: GroupPost[] | undefined;
  group: Group;
  userId?: string;
  onCreatePost: (content: string, link?: string) => Promise<void>;
  onDeletePost: (postId: string) => void;
  onUpdatePost?: (postId: string, content: string, link?: string | null) => Promise<void>;
  createPending: boolean;
  lastVisitedAt?: string | null;
  focusPostId?: string | null;
  focusCommentId?: string | null;
}

const GroupPostsTab = ({ posts, group, userId, onCreatePost, onDeletePost, onUpdatePost, createPending, lastVisitedAt, focusPostId, focusCommentId }: GroupPostsTabProps) => {
  const navigate = useNavigate();
  const [postContent, setPostContent] = useState("");
  const [postLink, setPostLink] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLink, setEditLink] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const focusedRef = useRef<HTMLDivElement | null>(null);
  const [highlightOn, setHighlightOn] = useState(false);

  useEffect(() => {
    if (!focusPostId || !posts?.some((p) => p.id === focusPostId)) return;
    const t = setTimeout(() => {
      focusedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightOn(true);
      setTimeout(() => setHighlightOn(false), 3000);
    }, 150);
    return () => clearTimeout(t);
  }, [focusPostId, posts]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    await onCreatePost(postContent.trim(), postLink.trim() || undefined);
    setPostContent("");
    setPostLink("");
  };

  const handleAuthorClick = (post: GroupPost) => {
    if (post.profile?.username) navigate(`/${post.profile.username}`);
    else navigate(`/u/${post.user_id}`);
  };

  const canPost = !!userId && !!group.is_member;
  return (
    <div className="space-y-4">
      {canPost && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handlePost} className="space-y-3">
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share something with the group..."
                rows={3}
              />
              <Input
                value={postLink}
                onChange={(e) => setPostLink(e.target.value)}
                placeholder="Add a link (optional — PixelFed & PeerTube embeds supported)"
              />
              <Button type="submit" disabled={!postContent.trim() || createPending} size="sm">
                {createPending ? "Posting..." : "Post"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {posts?.map((post) => {
        const isFocused = post.id === focusPostId;
        return (
        <Card
          key={post.id}
          ref={isFocused ? focusedRef : undefined}
          className={`hover:bg-accent/50 transition-all ${isFocused && highlightOn ? "ring-2 ring-primary" : ""}`}
        >
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Avatar
                className="h-10 w-10 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => handleAuthorClick(post)}
              >
                <AvatarImage src={post.profile?.avatar_url ?? undefined} />
                <AvatarFallback>{post.profile?.display_name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-medium cursor-pointer hover:underline"
                      onClick={() => handleAuthorClick(post)}
                    >
                      {post.profile?.display_name ?? "Unknown"}
                    </span>
                    {post.profile?.username && (
                      <span className="text-muted-foreground text-xs">@{post.profile.username}</span>
                    )}
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    {lastVisitedAt && new Date(post.created_at) > new Date(lastVisitedAt) && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 leading-none">
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {post.user_id === userId && onUpdatePost && editingId !== post.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditingId(post.id);
                          setEditContent(post.content);
                          setEditLink(post.link ?? "");
                        }}
                        aria-label="Edit post"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                    {(post.user_id === userId || group.is_admin) && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeletePost(post.id)} aria-label="Delete post">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {editingId === post.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <Input
                      value={editLink}
                      onChange={(e) => setEditLink(e.target.value)}
                      placeholder="Add a link (optional)"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!editContent.trim() || savingEdit}
                        onClick={async () => {
                          if (!onUpdatePost) return;
                          setSavingEdit(true);
                          try {
                            await onUpdatePost(post.id, editContent.trim(), editLink.trim() || null);
                            setEditingId(null);
                          } finally {
                            setSavingEdit(false);
                          }
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {savingEdit ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={savingEdit}>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-sm whitespace-pre-wrap break-words">
                      <MentionText content={post.content} />
                      {post.updated_at && post.created_at && new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 2000 && (
                        <span className="ml-2 text-[10px] text-muted-foreground italic">(edited)</span>
                      )}
                    </p>

                    {post.link && (
                      <>
                        <LinkPreview url={post.link} />
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-primary hover:underline text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {(() => {
                            try { const u = new URL(post.link); return u.hostname + (u.pathname === "/" ? "" : u.pathname); } catch { return post.link; }
                          })()}
                        </a>
                      </>
                    )}
                  </>
                )}

                {/* Reactions */}
                <div className="mt-3">
                  <GroupPostReactions targetId={post.id} targetType="post" />
                </div>

                {/* Threaded Comments */}
                <GroupPostComments
                  postId={post.id}
                  currentUserId={userId ?? null}
                  lastVisitedAt={lastVisitedAt}
                  focusCommentId={isFocused ? focusCommentId ?? null : null}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}

      {(!posts || posts.length === 0) && (
        <p className="text-center text-muted-foreground py-8">No posts yet. Be the first to share!</p>
      )}
    </div>
  );
};

export default GroupPostsTab;
