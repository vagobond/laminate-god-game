import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Library, Search } from "lucide-react";
import { listLibrary, type LibraryEntry } from "@/lib/scroll-publish";
import { LibraryCard } from "@/components/scrolls/LibraryCard";
import { CastleGateDialog } from "@/components/scrolls/CastleGate";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link as RouterLink, useLocation } from "react-router-dom";

type Sort = "newest" | "most_read" | "most_reacted";

const CastleLibrary = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [gateOpen, setGateOpen] = useState(false);
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>("newest");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Logged-out visitors can browse the shelf (the shop window) but get the
  // signup pitch on arrival; reading past a book's front matter is gated in
  // the reader itself.
  useEffect(() => {
    if (!authLoading && !user) setGateOpen(true);
  }, [authLoading, user]);

  const load = async (s: Sort, q: string) => {
    setLoading(true);
    try {
      setEntries(await listLibrary({ sort: s, search: q, limit: 40 }));
    } catch (e) {
      toast({ title: "Couldn't load library", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(sort, search); }, [sort, search]);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <Helmet>
        <title>The Castle Library — Published Scrolls | XCROL</title>
        <meta name="description" content="Discover Scrolls published by the XCROL community — long-form chronicles, memoirs, and curated writing." />
        <link rel="canonical" href="https://xcrol.com/the-castle/library" />
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/the-castle"><ArrowLeft className="h-4 w-4 mr-2" /> The Castle</Link>
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex justify-center"><Library className="h-10 w-10 text-primary" /></div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">The Castle Library</h1>
          <p className="text-muted-foreground italic">Published Scrolls from across the realm.</p>
        </div>

        {!authLoading && !user && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-center">
            To read past a book's opening pages, sign up or log in to Xcrol — it's free.{" "}
            <RouterLink
              to={`/auth?returnUrl=${encodeURIComponent(location.pathname + location.search)}`}
              className="font-semibold text-primary hover:underline"
            >
              Sign up
            </RouterLink>
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-1">
            {(["newest","most_read","most_reacted"] as Sort[]).map((s) => (
              <Button key={s} variant={sort === s ? "default" : "outline"} size="sm" onClick={() => setSort(s)}>
                {s === "newest" ? "Newest" : s === "most_read" ? "Most read" : "Most reacted"}
              </Button>
            ))}
          </div>
          <form
            className="flex gap-2 items-center"
            onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}
          >
            <Input
              placeholder="Search titles…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-48"
            />
            <Button type="submit" size="icon" variant="outline"><Search className="h-4 w-4" /></Button>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground italic">
            No Scrolls yet. Be the first to publish.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {entries.map((e) => <LibraryCard key={e.id} entry={e} />)}
          </div>
        )}

        {!user && <CastleGateDialog open={gateOpen} onOpenChange={setGateOpen} />}
      </div>
    </div>
  );
};

export default CastleLibrary;
