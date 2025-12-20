import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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

  const handleCreateClick = () => {
    if (user) {
      navigate("/creation-hub");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-16 animate-fade-in max-w-4xl">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-glow">
            Your Divine Powers Await
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            As a newly appointed deity, you hold the power to shape reality itself. 
            What will you do with this cosmic gift?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center flex-wrap">
          <Button 
            variant="mystical" 
            size="xl"
            onClick={() => navigate("/irl-layer")}
            className="w-full sm:w-auto min-w-[250px]"
          >
            THE IRL LAYER
          </Button>

          <Button 
            variant="divine" 
            size="xl"
            onClick={() => navigate("/verse-adventure")}
            className="w-full sm:w-auto min-w-[250px]"
          >
            ADVENTURE
          </Button>
          
          <Button 
            variant="mystical" 
            size="xl"
            onClick={handleCreateClick}
            className="w-full sm:w-auto min-w-[250px]"
          >
            CREATE
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Powers;
