import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

const CreationHub = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full animate-fade-in space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold text-center text-glow mb-8">
          The Creation Hub
        </h1>

        <div className="text-center text-foreground/90 text-xl mb-12">
          <p className="text-primary font-semibold italic">
            Choose your path through The Laminate...
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow hover:scale-105 transition-transform space-y-4 cursor-pointer"
                onClick={() => navigate("/create-layer")}>
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-3xl font-bold text-primary">Create a New Layer</h2>
            <p className="text-foreground/80 text-lg">
              Start from nothing. Build your own unique node in The Laminate. 
              Define your domain, your philosophy, your vision. Every new creation 
              becomes a seed for infinite branches.
            </p>
            <div className="pt-4">
              <Button variant="divine" size="lg" className="w-full">
                Begin Creation
              </Button>
            </div>
          </Card>

          <Card className="p-8 bg-card/60 backdrop-blur-sm border-secondary/30 mystical-glow-teal hover:scale-105 transition-transform space-y-4 cursor-pointer"
                onClick={() => navigate("/explore-layers")}>
            <div className="text-4xl mb-4">🌌</div>
            <h2 className="text-3xl font-bold text-secondary">Explore Existing Layers</h2>
            <p className="text-foreground/80 text-lg">
              Discover worlds created by others. Branch from existing nodes. 
              Build upon the foundations laid by fellow creators. Every layer 
              you explore can become the seed for your own creation.
            </p>
            <div className="pt-4">
              <Button variant="mystical" size="lg" className="w-full">
                Explore Worlds
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex justify-center pt-8">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/powers")}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreationHub;
