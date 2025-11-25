import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import paderImage from "@/assets/pader-familias.jpg";

const PaderFamilias = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-5xl w-full animate-fade-in space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-glow mb-8">
          Meet Pader Familias
        </h1>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative rounded-xl overflow-hidden mystical-glow border-2 border-primary/40">
            <img 
              src={paderImage} 
              alt="Pader Familias - The First Order deity surrounded by mystical mushrooms"
              className="w-full h-auto"
            />
          </div>

          <div className="space-y-6">
            <div className="text-foreground/90 text-lg leading-relaxed space-y-4">
              <p>
                <span className="text-primary font-semibold text-xl">Pader Familias</span>, 
                the First Order, created the primordial Verse Layer—the foundation of all reality in The Laminate.
              </p>
              
              <p>
                From the cosmic void, he brought forth three Genesis Elders who would shape the world: 
                balance, chaos, and consciousness. Each carved their domain from the raw fabric of existence.
              </p>

              <p className="text-secondary font-medium">
                Watch his message to understand the scope of creation that awaits you...
              </p>
            </div>
          </div>
        </div>

        <div className="relative w-full aspect-video rounded-xl overflow-hidden mystical-glow-teal border-2 border-secondary/40">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/UOLFR5mfCv8"
            title="The Verse Layer Introduction"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
          <Button 
            variant="mystical" 
            size="lg"
            onClick={() => navigate("/explore-layers")}
          >
            Back to Exploration
          </Button>
          
          <Button 
            variant="divine" 
            size="xl"
            onClick={() => navigate("/enter-lamsterverse")}
            className="w-full sm:w-auto min-w-[280px]"
          >
            ENTER THIS LAYER
          </Button>
          
          <Button 
            variant="mystical" 
            size="xl"
            onClick={() => navigate("/branch-from-verse")}
            className="w-full sm:w-auto min-w-[280px]"
          >
            BRANCH FROM THIS LAYER
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaderFamilias;
