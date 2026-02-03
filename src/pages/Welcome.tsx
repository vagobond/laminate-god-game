import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import scrollOpenGif from "@/assets/scroll-paper-open-up.gif";
import xcrolLogo from "@/assets/xcrol-logo.png";
import AudioMuteButton from "@/components/AudioMuteButton";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [animationPhase, setAnimationPhase] = useState<"gif" | "dissolve" | "complete">("gif");
  const [isGifLoading, setIsGifLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if user is already logged in - redirect to powers
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/powers", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Initialize and play background music
  useEffect(() => {
    const audio = new Audio("/audio/Skyforge_Citadel.mp3");
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    // Check initial mute state
    const isMuted = localStorage.getItem("audio-muted") === "true";
    audio.muted = isMuted;

    // Try to play (may be blocked by browser autoplay policy)
    const playAudio = () => {
      audio.play().catch(() => {
        // Autoplay blocked - will play on first user interaction
        const handleInteraction = () => {
          audio.play().catch(console.error);
          document.removeEventListener("click", handleInteraction);
          document.removeEventListener("keydown", handleInteraction);
        };
        document.addEventListener("click", handleInteraction);
        document.addEventListener("keydown", handleInteraction);
      });
    };

    playAudio();

    // Listen for mute state changes
    const handleMuteChange = (e: CustomEvent<boolean>) => {
      if (audioRef.current) {
        audioRef.current.muted = e.detail;
      }
    };

    window.addEventListener("audio-mute-changed", handleMuteChange as EventListener);

    return () => {
      audio.pause();
      audio.src = "";
      window.removeEventListener("audio-mute-changed", handleMuteChange as EventListener);
    };
  }, []);

  // Transition to content after GIF plays (approximately 3 seconds)
  useEffect(() => {
    if (authLoading || isGifLoading) return;
    
    const timer = setTimeout(() => {
      setAnimationPhase("dissolve");
      setTimeout(() => {
        setAnimationPhase("complete");
      }, 800);
    }, 3000);

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
    <div className="flex min-h-screen items-center justify-center p-4 overflow-hidden">
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
              className="w-[400px] md:w-[500px] lg:w-[600px] mx-auto drop-shadow-[0_0_40px_rgba(139,92,246,0.4)] animate-pulse-slow"
            />
            <div className="space-y-3 max-w-2xl mx-auto">
              <p className="text-xl md:text-2xl text-foreground/90 font-bold italic">
                Pronounced Scroll.
              </p>
              <p className="text-2xl md:text-3xl text-primary font-semibold">
                Keep up with the people who matter to you.
              </p>
            </div>
          </div>
          
          <div className={`mt-12 transition-all duration-500 delay-300 ${
            animationPhase === "complete" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}>
            <Button 
              variant="divine" 
              size="xl"
              onClick={() => navigate("/powers")}
              className="animate-float"
            >
              USE YOUR POWERS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;