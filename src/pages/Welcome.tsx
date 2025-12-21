import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import scrollImage from "@/assets/scroll-unfurl.png";

const Sparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <div
    className="absolute w-2 h-2 bg-primary rounded-full animate-sparkle"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      animationDelay: `${delay}ms`,
    }}
  />
);

const Welcome = () => {
  const navigate = useNavigate();
  const [animationPhase, setAnimationPhase] = useState<"scroll" | "reveal" | "complete">("scroll");
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Generate random sparkles
    const newSparkles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 10 + Math.random() * 80,
      delay: Math.random() * 2000,
    }));
    setSparkles(newSparkles);

    // Scroll unfurl animation (3 seconds)
    const revealTimer = setTimeout(() => {
      setAnimationPhase("reveal");
    }, 3000);

    const completeTimer = setTimeout(() => {
      setAnimationPhase("complete");
    }, 3800);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 overflow-hidden">
      <div className="text-center space-y-12 relative w-full h-full">
        {/* Scroll Animation - Full Page */}
        <div 
          className={`fixed inset-0 flex items-center justify-center transition-all duration-700 ease-out z-10 ${
            animationPhase === "scroll" 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-110 pointer-events-none"
          }`}
        >
          {/* Sparkles */}
          {sparkles.map((sparkle) => (
            <Sparkle key={sparkle.id} delay={sparkle.delay} x={sparkle.x} y={sparkle.y} />
          ))}
          
          {/* Glow backdrop */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent" />
          
          <img 
            src={scrollImage} 
            alt="Magical scroll" 
            className={`w-[80vmin] h-[80vmin] max-w-[600px] max-h-[600px] object-contain drop-shadow-[0_0_60px_rgba(139,92,246,0.6)] ${
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