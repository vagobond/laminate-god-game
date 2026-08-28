import { format } from "date-fns";
import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Users, UserCheck, Heart, Lock, ExternalLink, Share2, Rss, MapPin, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { XcrolReactions } from "@/components/XcrolReactions";
import { MentionText } from "@/components/MentionText";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LinkPreview } from "@/components/LinkPreview";
import { RiverReplies } from "@/components/RiverReplies";
import type { RiverReply } from "@/components/RiverReplies";
import type { ReactionData } from "@/pages/TheRiver";
import { SharePostDialog } from "@/components/SharePostDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { pickStoredPreview, type PreviewRowFields } from "@/lib/link-preview-store";

// Lazy so mapbox-gl only loads when someone clicks a pin chip.
const EntryPinMap = lazy(() => import("@/components/EntryPinMap"));

interface RiverEntryCardProps {
  entry: PreviewRowFields & {
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
  };
  initialReactions?: ReactionData[];
  onReactionsChange?: (reactions: ReactionData[]) => void;
  replies?: RiverReply[];
  currentUserId?: string | null;
  onRepliesChange?: () => void;
}

const PRIVACY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  public: { icon: Globe, label: "Public", color: "text-secondary" },
  friendly_acquaintance: { icon: Users, label: "Wayfarers", color: "text-secondary" },
  buddy: { icon: UserCheck, label: "Companions", color: "text-primary" },
  close_friend: { icon: Heart, label: "Oath Bound", color: "text-accent" },
  family: { icon: Heart, label: "Blood Bound", color: "text-accent" },
  private: { icon: Lock, label: "Private", color: "text-muted-foreground" },
  rss: { icon: Rss, label: "News", color: "text-accent" },
};

export const RiverEntryCard = ({ entry, initialReactions, onReactionsChange, replies = [], currentUserId, onRepliesChange }: RiverEntryCardProps) => {
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const config = PRIVACY_CONFIG[entry.privacy_level] || PRIVACY_CONFIG.private;
  const PrivacyIcon = config.icon;
  const isRss = entry.privacy_level === "rss";
  const hasPin = entry.latitude != null && entry.longitude != null;
  const pinLabel = hasPin
    ? entry.location_label || `${entry.latitude!.toFixed(2)}, ${entry.longitude!.toFixed(2)}`
    : null;

  const handleAuthorClick = () => {
    if (isRss) return; // RSS items don't have author profiles
    if (entry.author.username) {
      navigate(`/${entry.author.username}`);
    } else {
      navigate(`/u/${entry.user_id}`);
    }
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar 
            className={`h-10 w-10 ${isRss ? "" : "cursor-pointer hover:ring-2 hover:ring-primary"} transition-all`}
            onClick={handleAuthorClick}
          >
            {isRss ? (
              <AvatarFallback className="bg-orange-100 dark:bg-orange-900">
                <Rss className="h-5 w-5 text-orange-500" />
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={entry.author.avatar_url || undefined} />
                <AvatarFallback>
                  {entry.author.display_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className={`font-medium ${isRss ? "" : "cursor-pointer hover:underline"}`}
                onClick={handleAuthorClick}
              >
                {entry.author.display_name || "Anonymous"}
              </span>
              {entry.author.username && (
                <span className="text-muted-foreground text-sm">
                  @{entry.author.username}
                </span>
              )}
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">
                {format(new Date(entry.entry_date), "MMM d, yyyy")}
              </span>
            </div>

            {isRss ? (
              <>
                {(() => {
                  const [title, ...descParts] = entry.content.split("\n\n");
                  const description = descParts.join("\n\n");
                  return (
                    <>
                      <p className="mt-2">
                        {entry.link ? (
                          <a
                            href={entry.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-foreground hover:text-primary hover:underline"
                          >
                            {title}
                          </a>
                        ) : (
                          <span className="font-semibold text-foreground">{title}</span>
                        )}
                      </p>
                      {description && (
                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words line-clamp-3">
                          {description}
                        </p>
                      )}
                    </>
                  );
                })()}
                {entry.link && (
                  <a
                    href={entry.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-primary hover:underline text-xs max-w-full truncate"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {(() => { try { const u = new URL(entry.link); return u.hostname + (u.pathname === "/" ? "" : u.pathname); } catch { return entry.link; } })()}
                  </a>
                )}
              </>
            ) : (
              <>
                <p className="mt-2 text-foreground whitespace-pre-wrap break-words">
                  <MentionText content={entry.content} />
                </p>

                {entry.link && (
                  <>
                    <LinkPreview url={entry.link} stored={pickStoredPreview(entry)} />
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-primary hover:underline text-sm max-w-full truncate"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {(() => { try { const u = new URL(entry.link); return u.hostname + (u.pathname === "/" ? "" : u.pathname); } catch { return entry.link; } })()}
                    </a>
                  </>
                )}
              </>
            )}

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs gap-1">
                <PrivacyIcon className={`h-3 w-3 ${config.color}`} />
                {config.label}
              </Badge>
              {hasPin && (
                <Badge
                  variant="outline"
                  className="text-xs gap-1 cursor-pointer hover:bg-accent max-w-[180px]"
                  onClick={() => setPinOpen(true)}
                  title={pinLabel!}
                >
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{pinLabel}</span>
                </Badge>
              )}
              {!isRss && (
                <>
                  <XcrolReactions 
                    entryId={entry.id} 
                    authorId={entry.user_id}
                    authorName={entry.author.display_name || entry.author.username || "User"}
                    initialReactions={initialReactions}
                    onReactionsChange={onReactionsChange}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-primary"
                    onClick={() => setShareOpen(true)}
                  >
                    <Share2 className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Share</span>
                  </Button>
                  <SharePostDialog
                    open={shareOpen}
                    onOpenChange={setShareOpen}
                    postId={entry.id}
                    // Only seed share text with content the sharer may broadcast:
                    // public posts, or the author's own words. The link itself is
                    // always shareable — recipients only see what RLS allows.
                    snippet={
                      entry.privacy_level === "public" || currentUserId === entry.user_id
                        ? entry.content
                        : undefined
                    }
                    authorLabel={
                      entry.author.display_name || entry.author.username
                        ? `${entry.author.display_name || entry.author.username} on XCROL`
                        : undefined
                    }
                  />
                </>
              )}
            </div>

            {/* Threaded Replies - not for RSS */}
            {!isRss && (
              <RiverReplies
                entryId={entry.id}
                currentUserId={currentUserId ?? null}
                replies={replies}
                onRepliesChange={onRepliesChange}
              />
            )}
          </div>
        </div>

        {/* Geo-pin map dialog — map (and mapbox-gl) loads only when opened */}
        {hasPin && (
          <Dialog open={pinOpen} onOpenChange={setPinOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {pinLabel}
                </DialogTitle>
              </DialogHeader>
              {pinOpen && (
                <Suspense
                  fallback={
                    <div className="h-64 flex items-center justify-center border rounded-md">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  }
                >
                  <EntryPinMap latitude={entry.latitude!} longitude={entry.longitude!} />
                </Suspense>
              )}
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};
