import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Globe, Waves, TreePine, Layers } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

const Powers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleProfileClick = () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/auth");
    }
  };

  // Custom two-wave icon (like Waves but with 2 lines instead of 3)
  const TwoWaves = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 10c.6.5 1.2 1 2.5 1C7 11 7 9 9.5 9c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 16c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  );

  // Celtic Tree of Life icon for YOU - circular design with branches and roots
  const TreeOfLife = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Trunk */}
      <path d="M12 20V10" />
      {/* Upper branches spreading into circle */}
      <path d="M12 10c-2-3-5-4-7-3" />
      <path d="M12 10c2-3 5-4 7-3" />
      <path d="M12 10c-1-2-3-5-5-6" />
      <path d="M12 10c1-2 3-5 5-6" />
      {/* Side branches */}
      <path d="M12 12c-3-1-6 0-7 2" />
      <path d="M12 12c3-1 6 0 7 2" />
      {/* Roots curving into knotwork */}
      <path d="M12 20c-2 0-4-1-5-2" />
      <path d="M12 20c2 0 4-1 5-2" />
      <path d="M12 20c-1.5 1-3 2-5 1" />
      <path d="M12 20c1.5 1 3 2 5 1" />
    </svg>
  );

  // Two pine trees icon for The Forest
  const TwoTrees = ({ className }: { className?: string }) => (
    <div className={`inline-flex items-center ${className}`}>
      <TreePine className="h-5 w-5 -mr-1" />
      <TreePine className="h-5 w-5" />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-16 animate-fade-in max-w-4xl">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-glow">
            Your Powers Await
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            You hold the power to shape your networks and build your world. 
            What will you create?
          </p>
        </div>

        <TooltipProvider>
          <div className="flex flex-col items-center gap-6">
            {/* Top row: YOU, The River, The World */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    onClick={handleProfileClick}
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <TreeOfLife className="mr-2 h-5 w-5" />
                    YOU
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Set up your profile, friend-trust levels, hosting, and meetup status</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="divine" 
                    size="xl"
                    onClick={() => navigate("/the-river")}
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Waves className="mr-2 h-5 w-5" />
                    THE RIVER
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>See what your friends are up to</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    onClick={() => navigate("/irl-layer")}
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Globe className="mr-2 h-5 w-5" />
                    THE WORLD
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Claim your hometown. See where other users live in the world. Explore.</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Second row: The Forest (under YOU), The Brook (under River), The Strata (under World) */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    onClick={() => navigate("/the-forest")}
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <TwoTrees className="mr-2" />
                    THE FOREST
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your network of friends and connections</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    onClick={() => navigate("/my-xcrol")}
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <TwoWaves className="mr-2 h-5 w-5" />
                    THE BROOK
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Private two-person streams with someone special</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="mystical" 
                    size="xl"
                    onClick={() => navigate("/settings")}
                    className="w-full sm:w-auto min-w-[250px]"
                  >
                    <Layers className="mr-2 h-5 w-5" />
                    THE STRATA
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your settings and preferences</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>

        <button 
          onClick={() => navigate("/getting-started")}
          className="text-foreground/60 hover:text-foreground transition-colors underline underline-offset-4 text-sm"
        >
          Getting Started / FAQ
        </button>
      </div>
    </div>
  );
};

export default Powers;
