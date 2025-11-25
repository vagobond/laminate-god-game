import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import paderImage from "@/assets/pader-familias.jpg";

const ExploreLayers = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-5xl w-full animate-fade-in space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold text-center text-glow mb-8">
          Explore The Laminate
        </h1>

        <div className="text-center text-foreground/90 text-xl mb-8">
          <p className="text-secondary font-semibold">
            Discover existing layers. Choose one to explore or branch from...
          </p>
        </div>

        <div className="grid gap-6">
          {/* The Verse Layer - Featured Example */}
          <Card className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow hover:scale-[1.02] transition-transform">
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={paderImage} 
                  alt="The Verse Layer created by Pader Familias"
                  className="w-full h-auto"
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold text-primary mb-2">The Verse Layer</h2>
                  <p className="text-sm text-muted-foreground">Created by Pader Familias</p>
                </div>
                
                <p className="text-foreground/80 text-lg leading-relaxed">
                  A primordial world of four continents shaped by Genesis Elders. 
                  Explore Aethermoor's crystal plains, Pyrothane's volcanic canyons, 
                  Verdania's singing forests, and Mistmere's floating islands. 
                  Meet the Seventeen Technomancer Sigil-Bearers and study dream-consciousness 
                  at Don Poise's Mango Grove.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button 
                    variant="divine" 
                    size="lg"
                    onClick={() => navigate("/pader-familias")}
                  >
                    Learn More
                  </Button>
                  <Button 
                    variant="mystical" 
                    size="lg"
                    onClick={() => navigate("/branch-from-verse")}
                  >
                    Branch From This Layer
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Placeholder for future layers */}
          <Card className="p-8 bg-card/40 backdrop-blur-sm border-muted/30 opacity-60">
            <div className="text-center space-y-4">
              <div className="text-5xl">🔮</div>
              <h3 className="text-2xl font-bold text-muted-foreground">More Layers Coming Soon</h3>
              <p className="text-muted-foreground">
                As creators build new worlds, they will appear here for you to explore and branch from.
              </p>
            </div>
          </Card>
        </div>

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
