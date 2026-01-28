// Tutorial highlight overlay for anchored elements
// Completely siloed from main application logic

import { useEffect, useState } from "react";

interface TutorialHighlightProps {
  selector: string;
}

export function TutorialHighlight({ selector }: TutorialHighlightProps) {
  const [position, setPosition] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (selector === "center") {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(selector);
      if (element) {
        setPosition(element.getBoundingClientRect());
      } else {
        setPosition(null);
      }
    };

    updatePosition();

    // Update on scroll/resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [selector]);

  if (!position) return null;

  const padding = 8;

  return (
    <div
      className="fixed pointer-events-none z-[9998] transition-all duration-500 ease-out"
      style={{
        top: position.top - padding,
        left: position.left - padding,
        width: position.width + padding * 2,
        height: position.height + padding * 2,
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-lg animate-pulse"
        style={{
          boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.4), 0 0 40px 8px hsl(var(--primary) / 0.2)",
        }}
      />
      {/* Border ring */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-primary/60 ring-offset-2 ring-offset-background" />
    </div>
  );
}
