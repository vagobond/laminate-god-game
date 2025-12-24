import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Home, Users, Briefcase, Coffee, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
}

interface UserReferencesProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const UserReferences = ({ userId, isOwnProfile = false }: UserReferencesProps) => {
  const navigate = useNavigate();
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferences();
  }, [userId]);

  const loadReferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_references")
        .select("*")
        .eq("to_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user info for each reference
      const referencesWithUsers = await Promise.all(
        (data || []).map(async (ref) => {
          const { data: userData } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", ref.from_user_id)
            .maybeSingle();

          return {
            ...ref,
            from_user: userData || { display_name: null, avatar_url: null },
          };
        })
      );

      setReferences(referencesWithUsers);
    } catch (error) {
      console.error("Error loading references:", error);
    } finally {
      setLoading(false);
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
    </Card>
  );
};
