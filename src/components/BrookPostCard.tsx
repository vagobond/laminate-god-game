import { useState } from "react";
import { format } from "date-fns";
import { ExternalLink, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrookReactions } from "./BrookReactions";
import { BrookComments } from "./BrookComments";
import { MentionText } from "@/components/MentionText";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BrookPostCardProps {
  post: {
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
  };
  currentUserId: string;
  onDelete?: (postId: string) => void;
}

export const BrookPostCard = ({ post, currentUserId, onDelete }: BrookPostCardProps) => {
  const isOwn = post.user_id === currentUserId;

  return (
    <Card className="hover:bg-accent/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatar_url || undefined} />
            <AvatarFallback>
              {post.author.display_name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {post.author.display_name || "Anonymous"}
                </span>
                {post.author.username && (
                  <span className="text-muted-foreground text-sm">
                    @{post.author.username}
                  </span>
                )}
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-muted-foreground text-sm">
                  {format(new Date(post.created_at), "MMM d, h:mm a")}
                </span>
              </div>
              
              {isOwn && onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDelete(post.id)} 
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <p className="mt-2 text-foreground whitespace-pre-wrap break-words">
              <MentionText content={post.content} />
            </p>

            {post.link && (
              <a
                href={post.link.startsWith("http") ? post.link : `https://${post.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-primary hover:underline text-sm"
              >
                <ExternalLink className="h-3 w-3" />
                {(() => {
                  try {
                    return new URL(post.link.startsWith("http") ? post.link : `https://${post.link}`).hostname;
                  } catch {
                    return post.link;
                  }
                })()}
              </a>
            )}

            <div className="mt-3 space-y-2">
              <BrookReactions postId={post.id} currentUserId={currentUserId} />
              <BrookComments postId={post.id} currentUserId={currentUserId} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};