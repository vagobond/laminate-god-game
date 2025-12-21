import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Welcome = () => {
  const navigate = useNavigate();
  const [animationPhase, setAnimationPhase] = useState<"video" | "dissolve" | "complete">("video");
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem("audio-muted") !== "false");
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if user is already logged in - redirect to powers
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate("/powers", { replace: true });
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (checkingAuth) return;
    
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const timeRemaining = video.duration - video.currentTime;
      // Fade out audio over the last 0.8 seconds
      if (timeRemaining <= 0.8 && timeRemaining > 0) {
        video.volume = Math.max(0, timeRemaining / 0.8);
      }
    };

    const handleEnded = () => {
      setAnimationPhase("dissolve");
      setTimeout(() => {
        setAnimationPhase("complete");
      }, 800);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [checkingAuth]);

  useEffect(() => {
    const handleMuteChange = (e: CustomEvent<boolean>) => {
      setIsMuted(e.detail);
    };

    window.addEventListener("audio-mute-changed", handleMuteChange as EventListener);
    return () => window.removeEventListener("audio-mute-changed", handleMuteChange as EventListener);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Show nothing while checking auth to prevent flash
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 overflow-hidden">
      <div className="text-center space-y-12 relative w-full h-full">
        {/* Video Animation - Full Page */}
        <div 
          className={`fixed inset-0 flex items-center justify-center transition-opacity duration-700 ease-out z-10 ${
            animationPhase === "video" 
              ? "opacity-100" 
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Glow backdrop */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent" />
          
          {/* Loading spinner */}
          {isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          
          <video 
            ref={videoRef}
            src="/video/xcrol.mp4"
            autoPlay
            muted={isMuted}
            playsInline
            onCanPlay={() => setIsVideoLoading(false)}
            className={`w-[80vmin] h-[80vmin] max-w-[600px] max-h-[600px] object-contain drop-shadow-[0_0_60px_rgba(139,92,246,0.6)] transition-opacity duration-300 ${
              isVideoLoading ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>

        {/* Main Content */}
        <div 
          className={`transition-all duration-700 ease-out ${
            animationPhase === "video" 
              ? "opacity-0 scale-95 translate-y-4" 
              : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-7xl md:text-9xl font-bold text-glow tracking-wider animate-pulse-slow">
              XCROL
            </h1>
            <div className="space-y-4 max-w-2xl mx-auto">
              <p className="text-2xl md:text-3xl text-foreground/90 font-light leading-relaxed">
                Take control of your own networks.
              </p>
              <p className="text-3xl md:text-4xl text-primary font-semibold">
                Build your world.
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