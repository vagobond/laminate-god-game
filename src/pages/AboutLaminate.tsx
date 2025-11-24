import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

const AboutLaminate = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full animate-fade-in space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold text-center text-glow mb-8">
          What is The Laminate?
        </h1>

        <Card className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow-teal">
          <div className="space-y-6 text-foreground/90 text-lg leading-relaxed">
            <p>
              The Laminate is a multiverse of layered realities, each one created by divine beings 
              who shape worlds according to their vision and philosophy.
            </p>
            
            <p>
              At its foundation lies <span className="text-primary font-semibold">The Verse Layer</span>, 
              created by the First Order deity known as <span className="text-primary font-semibold">Pader Familias</span>. 
              This primordial realm was shaped by three Genesis Elders, each establishing domains of unique power and purpose.
            </p>

            <div className="space-y-4 pl-4 border-l-2 border-primary/50">
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">The Three Genesis Elders</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Pader the Younger</strong> - The Gilded Grove, philosophy of Balance (Baoism)</li>
                  <li><strong>Pax (Olin Hopkins)</strong> - The Lichenwool Network, master of controlled chaos and reality manipulation</li>
                  <li><strong>Don Poise</strong> - The Haunted Seas, teacher of natural consciousness expansion</li>
                </ul>
              </div>
            </div>

            <p>
              Now, as a newly ascended deity, you have the power to either explore the existing Verse Layer—
              entering the Lamsterverse to discover its wonders—or to create an entirely new layer of reality, 
              adding your own vision to the infinite tapestry of The Laminate.
            </p>

            <p className="text-primary/80 italic">
              The choice, divine one, is yours. Will you be an explorer or a creator?
            </p>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Button 
            variant="mystical" 
            size="lg"
            onClick={() => navigate("/powers")}
          >
            Back to Powers
          </Button>
          <Button 
            variant="divine" 
            size="lg"
            onClick={() => navigate("/pader-familias")}
          >
            Begin Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AboutLaminate;
