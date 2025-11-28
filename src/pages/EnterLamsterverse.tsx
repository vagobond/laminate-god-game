import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

const EnterLamsterverse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full animate-fade-in space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold text-center text-glow mb-8">
          Welcome to The Verse Layer
        </h1>

        <Card className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow space-y-6">
          <div className="text-foreground/90 text-lg leading-relaxed space-y-4">
            <p className="text-2xl text-primary font-semibold">
              You stand at the threshold of the Lamsterverse...
            </p>
            
            <p>
              Before you lies the Verse Layer, a realm of four continents shaped by the Genesis Elders. 
              Each land holds its own mysteries, peoples, and paths to power.
            </p>

            <div className="space-y-4 bg-muted/20 p-6 rounded-lg border border-primary/20">
              <h3 className="text-2xl font-bold text-secondary">The Four Continents</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-xl font-semibold text-primary">⛰️ Aethermoor (North)</h4>
                  <p className="text-foreground/80">Mountains, silver forests, and Crystal Plains where consciousness experiments with crystalline processors that think while computing.</p>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-accent">🌋 Pyrothane (West)</h4>
                  <p className="text-foreground/80">Volcanoes, glass rivers, and obsidian canyons. Home to molten glass highways and reality-code storage in volcanic rock.</p>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-secondary">🌲 Verdania (East)</h4>
                  <p className="text-foreground/80">Vast forests, singing groves, and hollow tree-cities. The symbiotic tree-network pulses with ancient consciousness.</p>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-primary">🌫️ Mistmere (South)</h4>
                  <p className="text-foreground/80">Moors, marshlands, and floating islands in perpetual mist. Home to the Gilded Grove and the philosophy of Baoism.</p>
                </div>
              </div>
            </div>

            <div className="bg-card/40 p-6 rounded-lg border border-secondary/30 space-y-3">
              <h3 className="text-xl font-bold text-glow-gold">Your Journey Begins</h3>
              <p>
                As a divine explorer, you may travel between these lands, meet the Genesis Elders, 
                discover the Seventeen Technomancer Sigil-Bearers of the Lichenwool Network, or seek 
                wisdom from the Lamateurs studying dream-consciousness at Don Poise's Mango Grove.
              </p>
              <p className="text-secondary font-semibold italic">
                Where will you venture first, divine one?
              </p>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="mystical" 
            size="lg"
            onClick={() => navigate("/pader-familias")}
          >
            Back
          </Button>
          <Button 
            variant="divine" 
            size="lg"
            onClick={() => navigate("/lamsterverse-adventure")}
          >
            Begin Exploration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnterLamsterverse;
