import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Validation constants
const MAX_NAME_LENGTH = 100;
const MAX_DOMAIN_LENGTH = 200;
const MAX_PHILOSOPHY_LENGTH = 1000;
const MAX_VISION_LENGTH = 2000;
const MAX_GITHUB_URL_LENGTH = 200;

const CreateLayer = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [godName, setGodName] = useState("");
  const [domain, setDomain] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [vision, setVision] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubUrlError, setGithubUrlError] = useState("");

  const isValidGithubUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty URL
    const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(url);
  };

  const validateGithubUrl = (url: string) => {
    if (url && !isValidGithubUrl(url)) {
      setGithubUrlError("Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo-name)");
      return false;
    }
    setGithubUrlError("");
    return true;
  };

  const validateInputs = (): boolean => {
    if (godName.length > MAX_NAME_LENGTH) {
      toast.error(`Name must be less than ${MAX_NAME_LENGTH} characters`);
      return false;
    }
    if (domain.length > MAX_DOMAIN_LENGTH) {
      toast.error(`Domain must be less than ${MAX_DOMAIN_LENGTH} characters`);
      return false;
    }
    if (philosophy.length > MAX_PHILOSOPHY_LENGTH) {
      toast.error(`Philosophy must be less than ${MAX_PHILOSOPHY_LENGTH} characters`);
      return false;
    }
    if (vision.length > MAX_VISION_LENGTH) {
      toast.error(`Vision must be less than ${MAX_VISION_LENGTH} characters`);
      return false;
    }
    if (githubUrl.length > MAX_GITHUB_URL_LENGTH) {
      toast.error(`GitHub URL must be less than ${MAX_GITHUB_URL_LENGTH} characters`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateGithubUrl(githubUrl)) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }

    if (!validateInputs()) {
      return;
    }

    if (godName && domain && philosophy && vision && githubUrl) {
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
            name: godName.trim().slice(0, MAX_NAME_LENGTH),
            creator_name: godName.trim().slice(0, MAX_NAME_LENGTH),
            domain: domain.trim().slice(0, MAX_DOMAIN_LENGTH),
            philosophy: philosophy.trim().slice(0, MAX_PHILOSOPHY_LENGTH),
            vision: vision.trim().slice(0, MAX_VISION_LENGTH),
            github_repo_url: githubUrl.trim().slice(0, MAX_GITHUB_URL_LENGTH),
            description: `${domain.trim().slice(0, 200)} - ${philosophy.trim().slice(0, 200)}`,
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

              {vision && (
                <div className="space-y-3 animate-fade-in">
                  <Label htmlFor="github" className="text-lg font-semibold text-foreground">
                    GitHub Repository URL
                  </Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/username/repo-name"
                    value={githubUrl}
                    onChange={(e) => {
                      setGithubUrl(e.target.value);
                      if (githubUrlError) validateGithubUrl(e.target.value);
                    }}
                    onBlur={(e) => validateGithubUrl(e.target.value)}
                    className={`bg-muted/20 border-primary/30 text-lg ${githubUrlError ? 'border-destructive' : ''}`}
                  />
                  {githubUrlError && (
                    <p className="text-sm text-destructive">{githubUrlError}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Connect your Lovable project via GitHub. After creating your project in Lovable, 
                    connect it to GitHub and paste the repository URL here to link your build to the Laminate.
                  </p>
                </div>
              )}
            </div>

            {godName && domain && philosophy && vision && githubUrl && (
              <div className="pt-6 animate-fade-in">
                <Card className="p-6 bg-primary/10 border-primary/50">
                  <h3 className="text-2xl font-bold text-primary mb-4">Your Divine Essence</h3>
                  <div className="space-y-2 text-foreground/90">
                    <p><strong className="text-primary">Name:</strong> {godName}</p>
                    <p><strong className="text-primary">Domain:</strong> {domain}</p>
                    <p><strong className="text-primary">Philosophy:</strong> {philosophy}</p>
                    <p><strong className="text-primary">Vision:</strong> {vision}</p>
                    <p><strong className="text-primary">GitHub:</strong> {githubUrl}</p>
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
          {godName && domain && philosophy && vision && githubUrl && (
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
