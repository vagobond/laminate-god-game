import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();
  const [animationPhase, setAnimationPhase] = useState<"loading" | "video" | "dissolve" | "complete">("loading");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setAnimationPhase("video");
    };

    const handleEnded = () => {
      setAnimationPhase("dissolve");
      setTimeout(() => {
        setAnimationPhase("complete");
      }, 800);
    };

    video.addEventListener("canplaythrough", handleCanPlay);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("canplaythrough", handleCanPlay);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 overflow-hidden">
      <div className="text-center space-y-12 relative w-full h-full">
        {/* Loading State */}
        <div 
          className={`fixed inset-0 flex items-center justify-center z-20 transition-opacity duration-500 ${
            animationPhase === "loading" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-foreground/70 text-lg animate-pulse">Loading...</p>
          </div>
        </div>

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
          
          <video 
            ref={videoRef}
            src="/video/xcrol.mp4"
            autoPlay
            playsInline
            className="w-[80vmin] h-[80vmin] max-w-[600px] max-h-[600px] object-contain drop-shadow-[0_0_60px_rgba(139,92,246,0.6)]"
          />
        </div>

        {/* Main Content */}
        <div 
          className={`transition-all duration-700 ease-out ${
            animationPhase === "loading" || animationPhase === "video" 
              ? "opacity-0 scale-95 translate-y-4" 
              : "opacity-100 scale-100 translate-y-0"
          }`}
        >
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
                You've been made a god that can build worlds.
              </p>
              <p className="text-3xl md:text-4xl text-primary font-semibold">
                Congratulations.
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