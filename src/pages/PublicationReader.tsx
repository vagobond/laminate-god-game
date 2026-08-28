import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, ArrowLeft, Eye, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  getPublicationBySlug,
  incrementView,
  listAuthorPublications,
  publicationUrl,
  type PublicationWithContent,
  type Publication,
  type PublicationItem,
} from "@/lib/scroll-publish";
import { PublicationReactions } from "@/components/scrolls/PublicationReactions";
import { CastleGateDialog, CastleGatePanel } from "@/components/scrolls/CastleGate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface AuthorInfo {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const PublicationReader = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const [pub, setPub] = useState<PublicationWithContent | null>(null);
  const [author, setAuthor] = useState<AuthorInfo | null>(null);
  const [more, setMore] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Transport/auth failures are not "scroll not found" — they get a retry.
  const [loadError, setLoadError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      setLoadError(false);
      // Reset content per target: without this, a failed load of scroll B
      // silently kept rendering scroll A under B's URL.
      setPub(null);
      setAuthor(null);
      setMore([]);
      try {
        const p = await getPublicationBySlug(slug);
        if (cancelled) return;
        if (!p) { setNotFound(true); return; }
        setPub(p);
        incrementView(p.id).catch(() => {});
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name, username, avatar_url")
          .eq("id", p.user_id)
          .maybeSingle();
        if (cancelled) return;
        setAuthor((prof as AuthorInfo) ?? null);
        const others = await listAuthorPublications(p.user_id);
        if (cancelled) return;
        setMore(others.filter((o) => o.id !== p.id).slice(0, 6));
      } catch (e) {
        if (cancelled) return;
        toast({ title: "Couldn't load", description: e instanceof Error ? e.message : "", variant: "destructive" });
        setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, reloadTick]);

  const copyLink = async () => {
    if (!pub) return;
    await navigator.clipboard.writeText(publicationUrl(pub.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Surface the signup pitch once per visit for logged-out readers.
  useEffect(() => {
    if (!authLoading && !user) setGateOpen(true);
  }, [authLoading, user]);

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (loadError && !pub) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-2xl font-serif">Couldn't load this scroll</h1>
        <p className="text-muted-foreground">Something went wrong — probably a connection blip. Try again.</p>
        <Button onClick={() => setReloadTick((t) => t + 1)}>Try Again</Button>
      </div>
    );
  }
  if (notFound || !pub) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-2xl font-serif">Scroll not found</h1>
        <p className="text-muted-foreground">It may have been unpublished or the link is wrong.</p>
        <Button asChild variant="outline"><Link to="/the-castle/library">Browse the Library</Link></Button>
      </div>
    );
  }

  const items = Array.isArray(pub.content_json) ? pub.content_json : [];
  // Free preview for logged-out readers: the front matter (everything before
  // the first chapter-labeled item — for a book, the introduction). When the
  // front matter is short (entry-style scrolls like The First Scroll), extend
  // the preview through the leading items until it totals roughly an
  // introduction's worth of text.
  const FREE_PREVIEW_CHARS = 4500;
  const firstLabeled = items.findIndex((it: PublicationItem) => !!it.chapter_label);
  let freeCount = firstLabeled > 0 ? firstLabeled : Math.min(1, items.length);
  let previewChars = items
    .slice(0, freeCount)
    .reduce((n: number, it: PublicationItem) => n + (it.content?.length ?? 0), 0);
  while (freeCount < items.length && previewChars < FREE_PREVIEW_CHARS) {
    previewChars += items[freeCount].content?.length ?? 0;
    freeCount++;
  }
  const gated = !user && items.length > freeCount;
  const visibleItems = user ? items : items.slice(0, freeCount);
  let lastChapter: string | null = null;
  const authorHref = author?.username ? `/@${author.username}` : `/u/${pub.user_id}`;
  const authorName = author?.display_name ?? author?.username ?? "Anonymous";
  const canonical = `https://xcrol.com/library/${pub.slug}`;
  const desc = pub.blurb ?? pub.subtitle ?? `${authorName} on XCROL`;

  return (
    <div className="min-h-screen bg-background pt-20 pb-16 px-4">
      <Helmet>
        <title>{pub.title} — by {authorName} | XCROL</title>
        <meta name="description" content={desc.slice(0, 155)} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${pub.title} — by ${authorName}`} />
        <meta property="og:description" content={desc.slice(0, 200)} />
        <meta property="og:url" content={canonical} />
        {pub.cover_image_url && <meta property="og:image" content={pub.cover_image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${pub.title} — by ${authorName}`} />
        <meta name="twitter:description" content={desc.slice(0, 200)} />
        {pub.cover_image_url && <meta name="twitter:image" content={pub.cover_image_url} />}
      </Helmet>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/the-castle/library"><ArrowLeft className="h-4 w-4 mr-2" /> Library</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none font-serif">
          <header className="text-center mb-12 not-prose">
            {pub.cover_image_url && (
              <img
                src={pub.cover_image_url}
                alt={pub.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                className="mx-auto mb-8 max-h-96 rounded shadow-lg"
              />
            )}
            <h1 className="text-4xl font-bold mb-2 font-serif tracking-tight">{pub.title}</h1>
            {pub.subtitle && <p className="text-lg italic text-muted-foreground">{pub.subtitle}</p>}
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Link to={authorHref} className="hover:text-foreground inline-flex items-center gap-2">
                {author?.avatar_url && <img src={author.avatar_url} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />}
                <span>{authorName}</span>
              </Link>
              <span>·</span>
              <span>{format(new Date(pub.published_at), "MMMM d, yyyy")}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{pub.view_count}</span>
            </div>
            {pub.blurb && <p className="mt-6 text-muted-foreground max-w-xl mx-auto italic">{pub.blurb}</p>}
          </header>

          {visibleItems.map((it: PublicationItem) => {
            const showChapter = it.chapter_label && it.chapter_label !== lastChapter;
            if (showChapter) lastChapter = it.chapter_label;
            return (
              <section key={it.item_id} className="mb-8">
                {showChapter && (
                  <h2 className="mt-16 mb-8 text-center text-2xl font-normal uppercase tracking-[0.2em] text-muted-foreground">
                    {it.chapter_label}
                  </h2>
                )}
                {it.custom_title && <h3 className="text-xl font-semibold font-serif">{it.custom_title}</h3>}
                {it.item_date && (
                  <p className="text-xs italic text-muted-foreground mb-2">
                    {format(new Date(it.item_date), "MMMM d, yyyy")}
                    {it.group_name ? ` — in ${it.group_name}` : ""}
                  </p>
                )}
                <p className="whitespace-pre-wrap leading-relaxed font-serif text-[1.05rem] first-letter:text-3xl first-letter:font-semibold first-letter:mr-1 first-letter:float-left first-letter:leading-none first-letter:mt-1">{it.content}</p>
                {it.link && (
                  <p className="text-sm">
                    <a href={it.link.startsWith("http") ? it.link : `https://${it.link}`} target="_blank" rel="noreferrer">{it.link}</a>
                  </p>
                )}
              </section>
            );
          })}
          {gated && <CastleGatePanel bookTitle={pub.title} />}
        </article>

        {gated && (
          <CastleGateDialog open={gateOpen} onOpenChange={setGateOpen} bookTitle={pub.title} />
        )}

        {user && (
          <div className="mt-12 border-t border-border pt-6">
            <PublicationReactions publicationId={pub.id} />
          </div>
        )}

        {more.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              More from {authorName}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {more.map((m) => (
                <Link key={m.id} to={`/library/${m.slug}`} className="block group rounded border border-border overflow-hidden hover:border-primary/40">
                  <div className="aspect-[4/5] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                    {m.cover_image_url ? (
                      <img src={m.cover_image_url} alt="" referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3 font-serif text-center text-sm italic text-primary/60 line-clamp-4">{m.title}</div>
                    )}
                  </div>
                  <div className="p-2 text-sm font-serif line-clamp-2">{m.title}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicationReader;
