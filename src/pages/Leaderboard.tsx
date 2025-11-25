import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";

const Leaderboard = () => {
  const navigate = useNavigate();

  const { data: creators, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('layers')
        .select('creator_name, branches_count, total_points')
        .order('total_points', { ascending: false });
      
      if (error) throw error;
      
      // Aggregate by creator
      const creatorMap = new Map<string, { branches: number; points: number }>();
      data.forEach(layer => {
        const existing = creatorMap.get(layer.creator_name) || { branches: 0, points: 0 };
        creatorMap.set(layer.creator_name, {
          branches: existing.branches + layer.branches_count,
          points: existing.points + layer.total_points
        });
      });
      
      return Array.from(creatorMap.entries())
        .map(([name, stats]) => ({
          creator_name: name,
          total_branches: stats.branches,
          total_points: stats.points
        }))
        .sort((a, b) => b.total_points - a.total_points);
    }
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-glow">
            Creator Leaderboard
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            The creators who seed the most influential branches earn the highest points
          </p>
        </div>

        <Card className="p-6 bg-card/40 backdrop-blur-sm border-primary/30">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Top Creators</h2>
              <Badge variant="secondary" className="text-sm">
                Points = Direct Branches × 100 + All Descendant Branches × 100
              </Badge>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading leaderboard...
              </div>
            ) : creators && creators.length > 0 ? (
              <div className="space-y-3">
                {creators.map((creator, index) => {
                  const rank = index + 1;
                  return (
                    <Card
                      key={creator.creator_name}
                      className={`p-6 transition-all ${
                        rank <= 3
                          ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/50 mystical-glow'
                          : 'bg-card/60 border-primary/20'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex-shrink-0 w-16 flex items-center justify-center">
                          {getRankIcon(rank)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-primary truncate">
                            {creator.creator_name}
                          </h3>
                          <div className="flex gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Branches:</span>
                              <span className="font-semibold text-secondary">
                                {creator.total_branches}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-bold text-accent">
                            {creator.total_points}
                          </div>
                          <div className="text-sm text-muted-foreground">points</div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No creators yet. Be the first to create a layer!
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-card/60 backdrop-blur-sm border-secondary/30 mystical-glow-teal">
          <h3 className="text-xl font-bold text-secondary mb-4">How Points Are Calculated</h3>
          <div className="space-y-4 text-foreground/80">
            <div className="space-y-2">
              <p className="font-semibold text-primary">The Compound Effect</p>
              <p className="text-sm">
                When someone branches from your layer, you earn <strong>100 points</strong>.
                When someone branches from THAT branch, you earn another <strong>100 points</strong>.
                This continues infinitely down the tree.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-primary">Example:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>You create "The Crystal Realm" (0 points initially)</li>
                <li>3 people branch from it → You earn 300 points</li>
                <li>Each of those 3 branches gets 2 branches → You earn 600 more points</li>
                <li>Total: 900 points from just 9 total descendants!</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-secondary/20">
              <p className="text-sm italic text-muted-foreground">
                The deeper your branches grow, the more influential you become in The Laminate.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/explore-layers")}
          >
            Back to Exploration
          </Button>
          <Button 
            variant="divine" 
            size="lg"
            onClick={() => navigate("/create-layer")}
          >
            Create Your Layer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
