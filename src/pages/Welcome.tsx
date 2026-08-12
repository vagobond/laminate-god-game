import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, Sparkles, HelpCircle, Waves } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTutorial } from "@/components/onboarding";
import scrollOpenGif from "@/assets/scroll-paper-open-up.gif";
import xcrolLogo from "@/assets/xcrol-logo.webp";
import { LiveStatsStrip } from "@/components/LiveStatsStrip";


const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { reopenTutorial } = useTutorial();
  const [animationPhase, setAnimationPhase] = useState<"gif" | "dissolve" | "complete">("gif");
  const [isGifLoading, setIsGifLoading] = useState(true);

  // Check if user is already logged in - redirect to powers
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/powers", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Transition to content after GIF plays (~3s) OR max-wait timeout (2s) — whichever comes first
  useEffect(() => {
    if (authLoading) return;
    
    const startDissolve = () => {
      setAnimationPhase("dissolve");
      setTimeout(() => {
        setAnimationPhase("complete");
      }, 800);
    };

    // If GIF is already loaded, wait the full 3s animation time
    // If not, cap the wait at 2s so slow connections aren't punished
    const delay = isGifLoading ? 2000 : 3000;
    const timer = setTimeout(startDissolve, delay);

    return () => clearTimeout(timer);
  }, [authLoading, isGifLoading]);

  // Show nothing while checking auth to prevent flash
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 overflow-hidden relative">
      <Helmet>
        <link rel="canonical" href="https://xcrol.com/" />
      </Helmet>
      
      <div className="text-center space-y-12 relative w-full h-full">
        {/* GIF Animation - Full Page */}
        <div 
          className={`fixed inset-0 flex items-center justify-center transition-opacity duration-700 ease-out z-10 ${
            animationPhase === "gif" 
              ? "opacity-100" 
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Glow backdrop */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent" />
          
          {/* Loading spinner */}
          {isGifLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          
          <img 
            src={scrollOpenGif}
            alt="Scroll opening"
            width={600}
            height={600}
            onLoad={() => setIsGifLoading(false)}
            className={`w-[80vmin] h-[80vmin] max-w-[600px] max-h-[600px] object-contain drop-shadow-[0_0_60px_rgba(139,92,246,0.6)] transition-opacity duration-300 ${
              isGifLoading ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>

        {/* Main Content */}
        <div 
          className={`transition-all duration-700 ease-out ${
            animationPhase === "gif" 
              ? "opacity-0 scale-95 translate-y-4" 
              : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          <div className="space-y-6 animate-fade-in">
            {/* Logo Image */}
            <img 
              src={xcrolLogo}
              alt="XCROL"
              width={600}
              height={200}
              {...{ fetchpriority: "high" }}
              className="w-[400px] md:w-[500px] lg:w-[600px] mx-auto drop-shadow-[0_0_40px_rgba(139,92,246,0.4)] animate-pulse-slow motion-reduce:animate-none"
            />
            <div className="space-y-3 max-w-2xl mx-auto">
              <p className="text-xl md:text-2xl text-foreground/90 font-bold italic">
                Pronounced Scroll.
              </p>
              <p className="text-2xl md:text-3xl text-primary font-semibold">
                Your Map of Connection
              </p>
            </div>
          </div>
          
          <div className={`mt-10 transition-all duration-500 ${
            animationPhase !== "gif" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}>
            <Button
              variant="divine"
              size="xl"
              onClick={() => navigate("/auth")}
              className="animate-float motion-reduce:animate-none"
            >
              USE YOUR POWERS
            </Button>
            <p className="mt-3 text-sm text-foreground/60">
              Free to join. No ads, no tracking, no invite needed.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/the-river")}>
                <Waves className="h-4 w-4 mr-2" />
                Peek at The River
              </Button>
              <Button variant="outline" size="sm" onClick={reopenTutorial}>
                <Sparkles className="h-4 w-4 mr-2" />
                Tour Xcrol
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/getting-started")}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Getting Started & FAQ
              </Button>
            </div>
            <div className="mt-8">
              <LiveStatsStrip />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;