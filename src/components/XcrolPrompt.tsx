import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scroll, ChevronRight, Check } from "lucide-react";

interface XcrolPromptProps {
  userId: string;
}

export const XcrolPrompt = ({ userId }: XcrolPromptProps) => {
  const navigate = useNavigate();
  const [hasTodayEntry, setHasTodayEntry] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTodayEntry();
  }, [userId]);

  const checkTodayEntry = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("xcrol_entries")
        .select("id")
        .eq("user_id", userId)
        .eq("entry_date", today)
        .maybeSingle();

      if (error) throw error;
      setHasTodayEntry(!!data);
    } catch (error) {
      console.error("Error checking today's entry:", error);
      setHasTodayEntry(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <Card className={`border-2 ${hasTodayEntry ? "border-primary/30 bg-primary/5" : "border-primary/50 bg-primary/10"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${hasTodayEntry ? "bg-primary/20" : "bg-primary/30"}`}>
              {hasTodayEntry ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <Scroll className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {hasTodayEntry ? "Today's Xcrol is written!" : "Write your daily Xcrol"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {hasTodayEntry 
                  ? "View or edit your daily entry" 
                  : "Share what's on your mind today"}
              </p>
            </div>
          </div>
          <Button
            variant={hasTodayEntry ? "outline" : "default"}
            size="sm"
            onClick={() => navigate("/my-xcrol")}
          >
            {hasTodayEntry ? "View" : "Write"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
