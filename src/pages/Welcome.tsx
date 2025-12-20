import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import scrollImage from "@/assets/scroll-unfurl.png";

const Welcome = () => {
  const navigate = useNavigate();
  const [animationPhase, setAnimationPhase] = useState<"scroll" | "reveal" | "complete">("scroll");

  useEffect(() => {
    // Scroll unfurl animation (fast)
    const revealTimer = setTimeout(() => {
      setAnimationPhase("reveal");
    }, 800);

    const completeTimer = setTimeout(() => {
      setAnimationPhase("complete");
    }, 1600);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 overflow-hidden">
      <div className="text-center space-y-12 relative">
        {/* Scroll Animation */}
        <div 
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out ${
            animationPhase === "scroll" 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-110"
          }`}
        >
          <img 
            src={scrollImage} 
            alt="Magical scroll" 
            className={`w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_30px_rgba(139,92,246,0.5)] ${
              animationPhase === "scroll" ? "animate-scroll-unfurl" : ""
            }`}
          />
        </div>

        {/* Main Content */}
        <div 
          className={`transition-all duration-700 ease-out ${
            animationPhase === "scroll" 
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