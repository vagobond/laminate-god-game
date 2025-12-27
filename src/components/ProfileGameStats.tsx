import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skull, Sparkles, Globe, Plane, MapPin } from "lucide-react";

interface ProfileGameStatsProps {
  userId: string;
}

interface GameStats {
  // Verse Adventure
  deathCount: number;
  // Wolfemon
  gold: number;
  sheepCount: number;
  woolCount: number;
  wolfemonCount: number;
  // Sly Doubt of Uranus
  blootCollected: number;
  revolutionActs: number;
  // Dream Trip
  destinations: string[];
}

export function ProfileGameStats({ userId }: ProfileGameStatsProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<GameStats>({
    deathCount: 0,
    gold: 0,
    sheepCount: 0,
    woolCount: 0,
    wolfemonCount: 0,
    blootCollected: 0,
    revolutionActs: 0,
    destinations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      // Fetch all game stats in parallel
      const [deathsResult, wolfemonResult, slyDoubtResult, tripsResult] = await Promise.all([
        // Verse Adventure deaths
        supabase
          .from('game_deaths')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
        // Wolfemon state
        supabase
          .from('wolfemon_game_state')
          .select('gold, sheep_count, wool_count, has_wolfemon, total_sheep_collected')
          .eq('user_id', userId)
          .maybeSingle(),
        // Sly Doubt of Uranus state
        supabase
          .from('sly_doubt_game_state')
          .select('bloot_collected, revolution_acts')
          .eq('user_id', userId)
          .maybeSingle(),
        // Dream Trip destinations
        supabase
          .from('dream_trips')
          .select('destinations')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      // Calculate Wolfemon count (1 if has_wolfemon, plus potential extras from total collected / 100)
      const wolfemonData = wolfemonResult.data;
      let wolfemonCount = 0;
      if (wolfemonData?.has_wolfemon) {
        wolfemonCount = 1 + Math.floor((wolfemonData.total_sheep_collected || 0) / 100);
      }

      // Get unique destinations from all trips
      const allDestinations: string[] = [];
      if (tripsResult.data) {
        tripsResult.data.forEach((trip: { destinations: string[] }) => {
          if (trip.destinations) {
            trip.destinations.forEach((dest: string) => {
              if (!allDestinations.includes(dest)) {
                allDestinations.push(dest);
              }
            });
          }
        });
      }

      setStats({
        deathCount: deathsResult.count || 0,
        gold: wolfemonData?.gold || 0,
        sheepCount: wolfemonData?.sheep_count || 0,
        woolCount: wolfemonData?.wool_count || 0,
        wolfemonCount,
        blootCollected: slyDoubtResult.data?.bloot_collected || 0,
        revolutionActs: slyDoubtResult.data?.revolution_acts || 0,
        destinations: allDestinations,
      });
    } catch (error) {
      console.error('Error loading game stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mini-Game Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyStats = 
    stats.deathCount > 0 || 
    stats.gold > 0 || 
    stats.blootCollected > 0 ||
    stats.destinations.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Mini-Game Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyStats && (
          <div className="text-sm text-muted-foreground italic">
            No mini-game stats yet. Play some games to see your progress!
          </div>
        )}

        {/* Verse Adventure */}
        <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-destructive" />
            <span className="font-medium">Verse Adventure</span>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => navigate('/death-history')}
          >
            {stats.deathCount} Deaths
          </Button>
        </div>

        {/* Wolfemon */}
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🐺</span>
            <span className="font-medium">Wolfemon</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">💰 {stats.gold} Gold</Badge>
            <Badge variant="secondary">🐑 {stats.sheepCount} Lamsters</Badge>
            <Badge variant="secondary">🧶 {stats.woolCount} Wool</Badge>
            <Badge variant="default">🐺 {stats.wolfemonCount} Wolfemon</Badge>
          </div>
        </div>

        {/* Sly Doubt of Uranus */}
        <div className="p-3 bg-secondary/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-primary" />
            <span className="font-medium">Sly Doubt of Uranus</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">💎 {stats.blootCollected} Bloot</Badge>
            <Badge variant="secondary">✊ {stats.revolutionActs} Revolution Acts</Badge>
          </div>
        </div>

        {/* Dream Trip */}
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Plane className="w-5 h-5 text-primary" />
            <span className="font-medium">Dream Trip</span>
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            Trips Taken: {stats.destinations.length} destination{stats.destinations.length !== 1 ? 's' : ''}
          </div>
          {stats.destinations.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {stats.destinations.map((dest, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {dest}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">No trips yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}