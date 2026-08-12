import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Scroll, ExternalLink, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkPreview } from "@/components/LinkPreview";
import { MentionText } from "@/components/MentionText";

interface SharedEntry {
  id: string;
  content: string;
  link: string | null;
  entry_date: string;
  privacy_level: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

const SharedPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const [entry, setEntry] = useState<SharedEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!postId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      // Fetch the entry — RLS decides what this viewer can see (public for
      // anyone; friends-level entries only for entitled, signed-in viewers).
      const { data: entryData, error: entryError } = await supabase
        .from("xcrol_entries")
        .select("id, content, link, entry_date, privacy_level, user_id")
        .eq("id", postId)
        .maybeSingle();

      if (entryError || !entryData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Then fetch the author profile separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, username")
        .eq("id", entryData.user_id)
        .maybeSingle();

      if (!profileData) {
        setNotFound(true);
      } else {
        setEntry({ ...entryData, profiles: profileData } as SharedEntry);
      }
      setLoading(false);
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-6">
        <Scroll className="h-16 w-16 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold text-foreground">Post not found</h1>
        <p className="text-muted-foreground text-center max-w-md">
          This post may have been removed, doesn't exist, or is only visible to
          the author's friends. If someone shared it with you, try signing in.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Go to XCROL</Link>
          </Button>
        </div>
      </div>
    );
  }

  const author = entry.profiles;
  const displayName = author.display_name || author.username || "Anonymous";
  const profilePath = author.username ? `/${author.username}` : `/u/${entry.user_id}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 pt-20">
      <Helmet>
        <title>{`${displayName} on XCROL`}</title>
        <meta name="description" content={entry.content.slice(0, 155)} />
        <link rel="canonical" href={`https://xcrol.com/post/${entry.id}`} />
        <meta property="og:title" content={`${displayName} on XCROL`} />
        <meta property="og:description" content={entry.content.slice(0, 155)} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://xcrol.com/post/${entry.id}`} />
        {author.avatar_url && <meta property="og:image" content={author.avatar_url} />}
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SocialMediaPosting",
          "headline": entry.content.slice(0, 110),
          "articleBody": entry.content,
          "datePublished": entry.entry_date,
          "url": `https://xcrol.com/post/${entry.id}`,
          "author": {
            "@type": "Person",
            "name": displayName,
            ...(author.username ? { "url": `https://xcrol.com/${author.username}` } : {}),
          },
        })}</script>
      </Helmet>

      <div className="max-w-xl mx-auto space-y-6">
        {/* The Post */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Link to={profilePath}>
                <Avatar className="h-12 w-12 hover:ring-2 hover:ring-primary transition-all">
                  <AvatarImage src={author.avatar_url || undefined} />
                  <AvatarFallback>{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={profilePath} className="font-semibold text-foreground hover:underline">
                    {displayName}
                  </Link>
                  {author.username && (
                    <span className="text-muted-foreground text-sm">@{author.username}</span>
                  )}
                  <span className="text-muted-foreground text-sm">·</span>
                  <span className="text-muted-foreground text-sm">
                    {format(new Date(entry.entry_date), "MMM d, yyyy")}
                  </span>
                </div>

                <p className="mt-3 text-foreground whitespace-pre-wrap break-words text-lg leading-relaxed">
                  <MentionText content={entry.content} />
                </p>

                {entry.link && (
                  <div className="mt-3">
                    <LinkPreview url={entry.link} />
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {(() => { try { return new URL(entry.link).hostname; } catch { return entry.link; } })()}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center space-y-4">
            <Scroll className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-xl font-bold text-foreground">Join XCROL</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              XCROL is a free social network built around real friendships — no ads, no tracking, no algorithms. Write your story, one day at a time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Sign Up — Free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/getting-started">What makes XCROL different?</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedPost;
