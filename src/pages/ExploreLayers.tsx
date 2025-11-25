import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import paderImage from "@/assets/pader-familias.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ExploreLayers = () => {
  const navigate = useNavigate();

  const { data: layers, isLoading } = useQuery({
    queryKey: ['layers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('layers')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-5xl w-full animate-fade-in space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold text-center text-glow mb-8">
          Explore The Laminate
        </h1>

        <div className="text-center space-y-4 mb-8">
          <p className="text-foreground/90 text-xl text-secondary font-semibold">
            Discover existing layers. Choose one to explore or branch from...
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/layer-tree")}
              className="gap-2"
            >
              <span>🌳</span> Layer Tree
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/leaderboard")}
              className="gap-2"
            >
              <span>🏆</span> Leaderboard
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading layers...
          </div>
        ) : layers && layers.length > 0 ? (
          <div className="grid gap-6">
            {layers.map((layer) => (
              <Card key={layer.id} className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow hover:scale-[1.02] transition-transform">
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  {layer.name === 'The Verse Layer' && (
                    <div className="relative rounded-lg overflow-hidden">
                      <img 
                        src={paderImage} 
                        alt={`${layer.name} created by ${layer.creator_name}`}
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  <div className={layer.name === 'The Verse Layer' ? 'md:col-span-2 space-y-4' : 'md:col-span-3 space-y-4'}>
                    <div>
                      <h2 className="text-3xl font-bold text-primary mb-2">{layer.name}</h2>
                      <p className="text-sm text-muted-foreground">Created by {layer.creator_name}</p>
                    </div>
                    
                    <p className="text-foreground/80 text-lg leading-relaxed">
                      {layer.description}
                    </p>

                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Branches:</span>
                        <span className="font-semibold text-secondary">{layer.branches_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Points:</span>
                        <span className="font-semibold text-accent">{layer.total_points}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      {layer.name === 'The Verse Layer' && (
                        <Button 
                          variant="divine" 
                          size="lg"
                          onClick={() => navigate("/pader-familias")}
                        >
                          Learn More
                        </Button>
                      )}
                      <Button 
                        variant="mystical" 
                        size="lg"
                        onClick={() => navigate(`/branch-from-verse?parent=${layer.id}`)}
                      >
                        Branch From This Layer
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 bg-card/40 backdrop-blur-sm border-muted/30">
            <div className="text-center space-y-4">
              <div className="text-5xl">🔮</div>
              <h3 className="text-2xl font-bold text-muted-foreground">No Layers Yet</h3>
              <p className="text-muted-foreground">
                Be the first to create a layer in The Laminate!
              </p>
            </div>
          </Card>
        )}

        <div className="flex justify-center pt-8">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/creation-hub")}
          >
            Back to Hub
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExploreLayers;
