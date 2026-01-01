import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scroll, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { XcrolReactions } from "@/components/XcrolReactions";

interface XcrolEntry {
  id: string;
  content: string;
  link: string | null;
  entry_date: string;
  created_at: string;
  privacy_level: string;
}

interface PublicXcrolEntriesProps {
  userId: string;
  username: string;
}

export const PublicXcrolEntries = ({ userId, username }: PublicXcrolEntriesProps) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<XcrolEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicEntries();
  }, [userId]);

  const loadPublicEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("xcrol_entries")
        .select("id, content, link, entry_date, created_at, privacy_level")
        .eq("user_id", userId)
        .order("entry_date", { ascending: false })
        .limit(3);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading public xcrol entries:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scroll className="w-5 h-5 text-primary" />
          <button
            onClick={() => navigate(`/xcrol/${username}`)}
            className="hover:text-primary hover:underline transition-colors text-left"
          >
            {username}'s Xcrol
          </button>
          <span className="text-muted-foreground font-normal">- Recent Entries</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="p-3 bg-secondary/30 rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{format(new Date(entry.entry_date), "MMMM d, yyyy")}</span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
            {entry.link && (
              <a
                href={entry.link.startsWith("http") ? entry.link : `https://${entry.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="truncate max-w-[200px]">
                  {entry.link.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </span>
              </a>
            )}
            <XcrolReactions 
              entryId={entry.id} 
              compact 
              authorId={userId}
              authorName={username}
            />
          </div>
        ))}
        {entries.length === 3 && (
          <button
            onClick={() => navigate(`/xcrol/${username}`)}
            className="w-full text-center text-sm text-primary hover:underline mt-2"
          >
            See more entries →
          </button>
        )}
      </CardContent>
    </Card>
  );
};
