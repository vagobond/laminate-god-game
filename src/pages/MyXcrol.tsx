import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Scroll, Lock, Users, UserCheck, Heart, ExternalLink, Trash2 } from "lucide-react";
import { XcrolEntryForm } from "@/components/XcrolEntryForm";
import { format } from "date-fns";
import { toast } from "sonner";
import { useHometownDate } from "@/hooks/use-hometown-date";
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

interface XcrolEntry {
  id: string;
  content: string;
  link: string | null;
  privacy_level: string;
  entry_date: string;
  created_at: string;
}

const PRIVACY_ICONS: Record<string, React.ReactNode> = {
  private: <Lock className="w-4 h-4" />,
  close_friend: <Heart className="w-4 h-4" />,
  buddy: <UserCheck className="w-4 h-4" />,
  friendly_acquaintance: <Users className="w-4 h-4" />,
};

const PRIVACY_LABELS: Record<string, string> = {
  private: "Private",
  close_friend: "Oath Bound",
  family: "Blood Bound",
  buddy: "Companions & above",
  friendly_acquaintance: "Wayfarers & above",
};

const MyXcrol = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Support both "link" and "optional_link" query params for external integrations
  const prefillLink = searchParams.get("link") || searchParams.get("optional_link") || "";
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [entries, setEntries] = useState<XcrolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const { todayDate, loading: dateLoading, timezone } = useHometownDate(user?.id ?? null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authChecked && !user) {
      const returnUrl = window.location.pathname + window.location.search;
      navigate(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
    }
  }, [authChecked, user, navigate]);

  useEffect(() => {
    if (user?.id && !dateLoading) {
      loadEntries();
      loadUsername();
    }
  }, [user?.id, dateLoading, todayDate]);

  const loadUsername = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    setUsername(data?.username ?? null);
  };

  const loadEntries = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("xcrol_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

      if (error) throw error;

      setEntries(data || []);
    } catch (error) {
      console.error("Error loading entries:", error);
      toast.error("Failed to load your Xcrol entries");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from("xcrol_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      toast.success("Entry deleted");
      loadEntries();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4 pt-20">
        <div className="text-muted-foreground">Checking sign-in…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4 pt-20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Please sign in to access your Xcrol diary.
            </p>
            <Button
              onClick={() => {
                const returnUrl = window.location.pathname + window.location.search;
                navigate(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`);
              }}
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 pt-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/profile")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Scroll className="w-8 h-8 text-primary" />
            My Xcrol
          </h1>
          <p className="text-muted-foreground">
            Your personal daily diary. One update per day, 240 characters.
          </p>
        </div>

        {/* Daily Entry Form */}
        <XcrolEntryForm userId={user.id} onEntrySaved={loadEntries} prefillLink={prefillLink} />

        {/* Past Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your Xcrol History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scroll className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No entries yet. Start your daily Xcrol journey above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <time>{format(new Date(entry.entry_date), "EEEE, MMMM d, yyyy")}</time>
                        <span className="flex items-center gap-1" title={PRIVACY_LABELS[entry.privacy_level]}>
                          {PRIVACY_ICONS[entry.privacy_level]}
                        </span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your Xcrol entry from {format(new Date(entry.entry_date), "MMMM d, yyyy")}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{entry.content}</p>
                    {entry.link && (
                      <a
                        href={entry.link.startsWith("http") ? entry.link : `https://${entry.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {entry.link.length > 50 ? entry.link.slice(0, 50) + "..." : entry.link}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyXcrol;
