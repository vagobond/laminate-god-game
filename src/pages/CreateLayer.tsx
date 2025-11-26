import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CreateLayer = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [godName, setGodName] = useState("");
  const [domain, setDomain] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [vision, setVision] = useState("");

  const handleSubmit = async () => {
    if (godName && domain && philosophy && vision) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error("You must be signed in to create a layer");
          navigate("/auth");
          return;
        }

        const { error } = await supabase
          .from('layers')
          .insert({
            name: godName,
            creator_name: godName,
            domain: domain,
            philosophy: philosophy,
            vision: vision,
            description: `${domain} - ${philosophy}`,
            user_id: session.user.id
          });

        if (error) throw error;

        toast.success("Your layer has been created and added to The Laminate!");
        navigate("/explore-layers");
      } catch (error) {
        console.error("Error creating layer:", error);
        toast.error("Failed to create layer. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-3xl w-full animate-fade-in space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-glow mb-8">
          Create Your Layer
        </h1>

        <Card className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow-teal space-y-6">
          <div className="text-foreground/90 text-lg leading-relaxed space-y-4">
            <p className="text-xl text-primary font-semibold italic text-center">
              "Every idea becomes a module. Every module becomes a node. 
              Every node becomes a layer. And every layer can spawn infinite new layers..."
            </p>
            
            <div className="space-y-6 pt-4">
              <div className="space-y-3">
                <Label htmlFor="godName" className="text-lg font-semibold text-foreground">
                  What is your divine name?
                </Label>
                <Input
                  id="godName"
                  placeholder="Enter your name as a deity..."
                  value={godName}
                  onChange={(e) => setGodName(e.target.value)}
                  className="bg-muted/20 border-primary/30 text-lg"
                />
              </div>

              {godName && (
                <div className="space-y-3 animate-fade-in">
                  <Label htmlFor="domain" className="text-lg font-semibold text-foreground">
                    What domain do you oversee, {godName}?
                  </Label>
                  <Input
                    id="domain"
                    placeholder="e.g., The Emerald Depths, Skyrealm of Storms, The Crystalline Void..."
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="bg-muted/20 border-primary/30 text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your domain is your realm of influence—a place, concept, or force you command.
                  </p>
                </div>
              )}

              {domain && (
                <div className="space-y-3 animate-fade-in">
                  <Label htmlFor="philosophy" className="text-lg font-semibold text-foreground">
                    What is your divine philosophy?
                  </Label>
                  <Textarea
                    id="philosophy"
                    placeholder="What principles guide your actions? What do you believe in?"
                    value={philosophy}
                    onChange={(e) => setPhilosophy(e.target.value)}
                    className="bg-muted/20 border-primary/30 min-h-[100px] text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Like Baoism's "Stop doing Tox, Start doing Rox" or Pax's controlled chaos—what drives you?
                  </p>
                </div>
              )}

              {philosophy && (
                <div className="space-y-3 animate-fade-in">
                  <Label htmlFor="vision" className="text-lg font-semibold text-foreground">
                    What world do you envision creating?
                  </Label>
                  <Textarea
                    id="vision"
                    placeholder="Describe the world you want to build. What makes it unique? Who inhabits it? What wonders and challenges exist there?"
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    className="bg-muted/20 border-primary/30 min-h-[150px] text-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Paint a picture of your creation. Let your imagination run wild.
                  </p>
                </div>
              )}
            </div>

            {godName && domain && philosophy && vision && (
              <div className="pt-6 animate-fade-in">
                <Card className="p-6 bg-primary/10 border-primary/50">
                  <h3 className="text-2xl font-bold text-primary mb-4">Your Divine Essence</h3>
                  <div className="space-y-2 text-foreground/90">
                    <p><strong className="text-primary">Name:</strong> {godName}</p>
                    <p><strong className="text-primary">Domain:</strong> {domain}</p>
                    <p><strong className="text-primary">Philosophy:</strong> {philosophy}</p>
                    <p><strong className="text-primary">Vision:</strong> {vision}</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="mystical" 
            size="lg"
            onClick={() => navigate("/creation-hub")}
          >
            Back to Hub
          </Button>
          {godName && domain && philosophy && vision && (
            <Button 
              variant="divine" 
              size="lg"
              onClick={handleSubmit}
              className="animate-pulse-slow"
            >
              MANIFEST YOUR LAYER
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateLayer;
