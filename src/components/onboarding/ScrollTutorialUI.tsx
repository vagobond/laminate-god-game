// Tutorial UI component - "The Awakening of the Scroll"
// Completely siloed from main application logic

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, Pause, Play } from "lucide-react";
import { TutorialHighlight } from "./TutorialHighlight";
import { TutorialStep } from "./tutorialSteps";
import paterFamiliasImg from "@/assets/pader-familias.jpg";

interface ScrollTutorialUIProps {
  currentStep: TutorialStep;
  currentStepIndex: number;
  totalSteps: number;
  progress: number;
  isPaused: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: (skipped: boolean) => void;
}

export function ScrollTutorialUI({
  currentStep,
  currentStepIndex,
  totalSteps,
  progress,
  isPaused,
  onNext,
  onPrevious,
  onPause,
  onResume,
  onComplete,
}: ScrollTutorialUIProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Calculate card position based on anchor
  useEffect(() => {
    const calculatePosition = () => {
      if (currentStep.anchor === "center") {
        setPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        return;
      }

      const element = document.querySelector(currentStep.anchor);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Position card below and slightly to the right of the element
        setPosition({
          x: Math.min(rect.left + rect.width / 2, window.innerWidth - 200),
          y: Math.min(rect.bottom + 20, window.innerHeight - 300),
        });
      } else {
        // Fallback to center
        setPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      }
    };

    calculatePosition();
    window.addEventListener("resize", calculatePosition);
    return () => window.removeEventListener("resize", calculatePosition);
  }, [currentStep]);

  const isCentered = currentStep.anchor === "center";

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[9997] pointer-events-none" />

      {/* Highlight for anchored element */}
      {!isCentered && <TutorialHighlight selector={currentStep.anchor} />}

      {/* Tutorial card */}
      <div
        className="fixed z-[9999] transition-all duration-500 ease-out"
        style={{
          left: isCentered ? "50%" : position.x,
          top: isCentered ? "50%" : position.y,
          transform: isCentered
            ? "translate(-50%, -50%)"
            : "translate(-50%, 0)",
        }}
      >
        <Card className="w-[340px] md:w-[400px] bg-card/95 backdrop-blur-md border-primary/20 shadow-2xl">
          {/* Parchment texture overlay */}
          <div
            className="absolute inset-0 rounded-lg opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          <CardContent className="p-5 relative">
            {/* Header with narrator */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={paterFamiliasImg}
                alt="Pater Familias"
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-primary">
                  Pater Familias
                </h3>
                <p className="text-xs text-muted-foreground">
                  {currentStep.anchorLabel}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={isPaused ? onResume : onPause}
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onComplete(true)}
                  title="Skip tutorial"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <Progress value={progress} className="h-1 mb-4" />

            {/* Main text */}
            <div className="space-y-3 mb-5">
              <p className="text-foreground whitespace-pre-line leading-relaxed">
                {currentStep.text}
              </p>
              {currentStep.subtext && (
                <p className="text-sm text-muted-foreground italic">
                  {currentStep.subtext}
                </p>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {currentStepIndex + 1} of {totalSteps}
              </div>

              <div className="flex items-center gap-2">
                {!currentStep.isFirst && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrevious}
                    className="h-8"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}

                {currentStep.isFirst && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onComplete(true)}
                    className="h-8 text-muted-foreground"
                  >
                    Skip forever
                  </Button>
                )}

                {currentStep.isFinal ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onComplete(false)}
                    className="h-8"
                  >
                    Close the Scroll
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onNext}
                    className="h-8"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
