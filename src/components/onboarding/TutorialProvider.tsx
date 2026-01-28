// Tutorial context provider for re-opening from settings
// Completely siloed from main application logic

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TUTORIAL_STEPS } from "./tutorialSteps";
import { ScrollTutorialUI } from "./ScrollTutorialUI";

interface TutorialContextType {
  reopenTutorial: () => void;
  isVisible: boolean;
}

const TutorialContext = createContext<TutorialContextType>({
  reopenTutorial: () => {},
  isVisible: false,
});

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Check if user has completed the tutorial
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setIsVisible(false);
      return;
    }

    const checkCompletion = async () => {
      const { data } = await supabase
        .from("tutorial_completion")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      setIsLoading(false);
      setIsVisible(!data); // Show if not completed
    };

    checkCompletion();
  }, [userId]);

  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => {
      if (prev >= TUTORIAL_STEPS.length - 1) return prev;
      return prev + 1;
    });
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStepIndex(prev => {
      if (prev <= 0) return prev;
      return prev - 1;
    });
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  const complete = useCallback(async (skipped: boolean = false) => {
    if (!userId) return;

    await supabase
      .from("tutorial_completion")
      .insert({ user_id: userId, skipped });

    setIsVisible(false);
  }, [userId]);

  const reopen = useCallback(async () => {
    if (!userId) return;

    // Delete the completion record to allow re-showing
    await supabase
      .from("tutorial_completion")
      .delete()
      .eq("user_id", userId);

    setIsVisible(true);
    setCurrentStepIndex(0);
    setIsPaused(false);
  }, [userId]);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const totalSteps = TUTORIAL_STEPS.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <TutorialContext.Provider
      value={{
        reopenTutorial: reopen,
        isVisible,
      }}
    >
      {children}
      {!isLoading && isVisible && currentStep && (
        <ScrollTutorialUI
          currentStep={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          progress={progress}
          isPaused={isPaused}
          onNext={nextStep}
          onPrevious={previousStep}
          onPause={pause}
          onResume={resume}
          onComplete={complete}
        />
      )}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
