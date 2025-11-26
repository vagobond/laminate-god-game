import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Welcome = () => {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-12 animate-fade-in">
        <div className="space-y-6">
          <h1 className="text-7xl md:text-9xl font-bold text-glow tracking-wider animate-pulse-slow">
            THE LAMINATE
          </h1>
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-2xl md:text-3xl text-foreground/90 font-light leading-relaxed">
              You've been made a god that can build worlds.
            </p>
            <p className="text-3xl md:text-4xl text-primary font-semibold">
              Congratulations.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              <Button 
                variant="divine" 
                size="xl"
                onClick={() => navigate("/powers")}
                className="animate-float"
              >
                USE YOUR POWERS
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="divine" 
                size="xl"
                onClick={() => navigate("/auth")}
                className="animate-float"
              >
                SIGN IN TO BEGIN
              </Button>
              <Button 
                variant="mystical" 
                size="lg"
                onClick={() => navigate("/powers")}
              >
                EXPLORE
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
