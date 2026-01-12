import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Globe, Waves } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Powers = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleProfileClick = () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/auth");
    }
  };

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
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center flex-wrap">
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
                  onClick={handleProfileClick}
                  className="w-full sm:w-auto min-w-[250px]"
                >
                  YOU
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set up your profile, friend-trust levels, hosting, and meetup status</p>
              </TooltipContent>
            </Tooltip>
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
