import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Home, Users, Briefcase, Coffee, Loader2, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ReferenceType = "host" | "guest" | "friendly" | "business";

interface Reference {
  id: string;
  from_user_id: string;
  reference_type: ReferenceType;
  rating: number | null;
  content: string;
  created_at: string;
  from_user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  flagged?: boolean;
}

interface UserReferencesProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const UserReferences = ({ userId, isOwnProfile = false }: UserReferencesProps) => {
  const navigate = useNavigate();
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadReferences();
    loadCurrentUser();
  }, [userId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadReferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_references")
        .select("*")
        .eq("to_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setReferences([]);
        setLoading(false);
        return;
      }

      // Check for existing flags on own profile
      const { data: { user } } = await supabase.auth.getUser();
      let flaggedIds: string[] = [];
      
      if (user && user.id === userId) {
        const { data: flags } = await supabase
          .from("flagged_references")
          .select("reference_id")
          .eq("flagged_by", user.id);
        flaggedIds = (flags || []).map(f => f.reference_id);
      }

      // Batch fetch profiles using .in() instead of N+1 queries
      const fromUserIds = [...new Set(data.map(ref => ref.from_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", fromUserIds);

      const profilesMap = new Map(
        (profiles || []).map(p => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );

      const referencesWithUsers = data.map(ref => ({
        ...ref,
        from_user: profilesMap.get(ref.from_user_id) || { display_name: null, avatar_url: null },
        flagged: flaggedIds.includes(ref.id),
      }));

      setReferences(referencesWithUsers);
    } catch (error) {
      console.error("Error loading references:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagClick = (refId: string) => {
    setSelectedRefId(refId);
    setFlagReason("");
    setFlagDialogOpen(true);
  };

  const submitFlag = async () => {
    if (!selectedRefId || !flagReason.trim() || !currentUserId) return;
    
    setSubmittingFlag(true);
    try {
      const { error } = await supabase
        .from("flagged_references")
        .insert({
          reference_id: selectedRefId,
          flagged_by: currentUserId,
          reason: flagReason.trim(),
        });

      if (error) throw error;

      toast.success("Reference flagged for admin review");
      setFlagDialogOpen(false);
      setReferences(prev => 
        prev.map(r => r.id === selectedRefId ? { ...r, flagged: true } : r)
      );
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("You've already flagged this reference");
      } else {
        toast.error("Failed to flag reference");
      }
    } finally {
      setSubmittingFlag(false);
    }
  };

  const getTypeIcon = (type: ReferenceType) => {
    switch (type) {
      case "host":
        return <Home className="w-4 h-4" />;
      case "guest":
        return <Users className="w-4 h-4" />;
      case "friendly":
        return <Coffee className="w-4 h-4" />;
      case "business":
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: ReferenceType) => {
    switch (type) {
      case "host":
        return "Host";
      case "guest":
        return "Guest";
      case "friendly":
        return "Friendly";
      case "business":
        return "Business";
    }
  };

  const filterByType = (type: ReferenceType | "all") => {
    if (type === "all") return references;
    return references.filter((ref) => ref.reference_type === type);
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderReference = (ref: Reference) => (
    <div key={ref.id} className="p-4 bg-secondary/30 rounded-lg space-y-2">
      <div className="flex items-start justify-between">
        <button
          onClick={() => navigate(`/u/${ref.from_user_id}`)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={ref.from_user?.avatar_url || undefined} />
            <AvatarFallback>
              {(ref.from_user?.display_name || "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-medium">
              {ref.from_user?.display_name || "Anonymous"}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(ref.created_at).toLocaleDateString()}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {isOwnProfile && currentUserId === userId && (
            ref.flagged ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Flag className="w-3 h-3" /> Flagged
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlagClick(ref.id);
                }}
              >
                <Flag className="w-3 h-3 mr-1" />
                Flag
              </Button>
            )
          )}
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
            {getTypeIcon(ref.reference_type)}
            {getTypeLabel(ref.reference_type)}
          </span>
          {renderStars(ref.rating)}
        </div>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{ref.content}</p>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (references.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            References
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No references yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const counts = {
    all: references.length,
    host: filterByType("host").length,
    guest: filterByType("guest").length,
    friendly: filterByType("friendly").length,
    business: filterByType("business").length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          References ({references.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="all" className="text-xs">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="host" className="text-xs" disabled={counts.host === 0}>
              Host ({counts.host})
            </TabsTrigger>
            <TabsTrigger value="guest" className="text-xs" disabled={counts.guest === 0}>
              Guest ({counts.guest})
            </TabsTrigger>
            <TabsTrigger value="friendly" className="text-xs" disabled={counts.friendly === 0}>
              Friendly ({counts.friendly})
            </TabsTrigger>
            <TabsTrigger value="business" className="text-xs" disabled={counts.business === 0}>
              Business ({counts.business})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-3">
            {filterByType("all").map(renderReference)}
          </TabsContent>
          <TabsContent value="host" className="space-y-3">
            {filterByType("host").map(renderReference)}
          </TabsContent>
          <TabsContent value="guest" className="space-y-3">
            {filterByType("guest").map(renderReference)}
          </TabsContent>
          <TabsContent value="friendly" className="space-y-3">
            {filterByType("friendly").map(renderReference)}
          </TabsContent>
          <TabsContent value="business" className="space-y-3">
            {filterByType("business").map(renderReference)}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Reference for Review</DialogTitle>
            <DialogDescription>
              Explain why you believe this reference should be reviewed by an admin.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Please describe the issue with this reference..."
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitFlag} 
              disabled={!flagReason.trim() || submittingFlag}
            >
              {submittingFlag ? "Submitting..." : "Submit Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
