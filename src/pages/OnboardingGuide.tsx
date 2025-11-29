import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ExternalLink, GitBranch, Github, Layers } from "lucide-react";

const OnboardingGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-glow">
            Welcome to the Lamsterverse
          </h1>
          <p className="text-xl text-muted-foreground">
            Learn how to build your own branch using Lovable and connect it to the game
          </p>
        </div>

        <Card className="p-8 bg-card/60 backdrop-blur-sm border-primary/30 mystical-glow-teal space-y-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                1
              </div>
              <div className="space-y-2 flex-1">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-6 h-6" />
                  Remix the Template in Lovable
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  Start by remixing our official Lamsterverse branch template in Lovable. This gives you a pre-configured project with all the essential structure for building your branch.
                </p>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open Template in Lovable
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                2
              </div>
              <div className="space-y-2 flex-1">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Github className="w-6 h-6" />
                  Connect Your Project to GitHub
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  Once you've customized your branch in Lovable, connect it to GitHub. This creates a permanent link to your code and allows others to explore your creation.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-foreground/70 pl-4">
                  <li>Click the GitHub button in the top right of Lovable</li>
                  <li>Authorize Lovable to access your GitHub account</li>
                  <li>Create a new repository for your branch</li>
                  <li>Copy the repository URL (e.g., https://github.com/username/my-branch)</li>
                </ol>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                3
              </div>
              <div className="space-y-2 flex-1">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <GitBranch className="w-6 h-6" />
                  Link Your Branch to the Game
                </h2>
                <p className="text-foreground/80 leading-relaxed">
                  Return to the Lamsterverse and create your branch entry. Paste your GitHub repository URL to complete the connection. Your branch will now be part of the Layer Tree!
                </p>
                <div className="pt-2">
                  <Button 
                    variant="mystical" 
                    size="sm"
                    onClick={() => navigate("/create-layer")}
                    className="gap-2"
                  >
                    <Layers className="w-4 h-4" />
                    Create Your Branch
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-primary/20 pt-6 mt-6">
            <h3 className="text-xl font-bold text-secondary mb-3">Why Use GitHub?</h3>
            <ul className="space-y-2 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-secondary mt-1">•</span>
                <span><strong>Permanence:</strong> Your work is preserved and accessible forever</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary mt-1">•</span>
                <span><strong>Collaboration:</strong> Others can view, fork, and build upon your ideas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary mt-1">•</span>
                <span><strong>Verification:</strong> Prove ownership and track the evolution of your branch</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary mt-1">•</span>
                <span><strong>Integration:</strong> Seamlessly connect your Lovable project to the Laminate</span>
              </li>
            </ul>
          </div>

          <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-secondary mb-2">💡 Pro Tip</h3>
            <p className="text-foreground/80">
              Make your GitHub repository public so other players can explore your code and learn from your implementations. This strengthens the collaborative spirit of the Lamsterverse!
            </p>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/powers")}
          >
            Back to Hub
          </Button>
          <Button 
            variant="divine" 
            size="lg"
            onClick={() => navigate("/create-layer")}
          >
            Start Building
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;
