// Tutorial context provider for re-opening from settings
// Completely siloed from main application logic

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TUTORIAL_STEPS } from "./tutorialSteps";
import { ScrollTutorialUI } from "./ScrollTutorialUI";

const TUTORIAL_CACHE_KEY = "xcrol-tutorial-completed";

function getCachedCompletion(userId: string): boolean {
  try {
    const raw = localStorage.getItem(TUTORIAL_CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.userId === userId && parsed.completed === true;
  } catch {
    return false;
  }
}

function setCachedCompletion(userId: string, completed: boolean) {
  localStorage.setItem(TUTORIAL_CACHE_KEY, JSON.stringify({ userId, completed }));
}

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
  const navigate = useNavigate();

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

    // Check localStorage cache first
    if (getCachedCompletion(userId)) {
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
      if (data) {
        setCachedCompletion(userId, true);
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
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
    setIsVisible(false);
    if (!userId) return;

    setCachedCompletion(userId, true);
    await supabase
      .from("tutorial_completion")
      .insert({ user_id: userId, skipped });
  }, [userId]);

  const reopen = useCallback(async () => {
    // Allow guests to take the tour without persistence
    if (userId) {
      setCachedCompletion(userId, false);
      await supabase
        .from("tutorial_completion")
        .delete()
        .eq("user_id", userId);
    }

    setIsVisible(true);
    setCurrentStepIndex(0);
    setIsPaused(false);
  }, [userId]);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const totalSteps = TUTORIAL_STEPS.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Guests can't visit protected routes — fall back to the painted map and
  // anchor the card to the corresponding location illustration.
  const effectiveRoute = !userId
    ? currentStep?.guestRoute ?? currentStep?.route
    : currentStep?.route;
  const effectiveAnchor =
    !userId && currentStep?.guestAnchor ? currentStep.guestAnchor : currentStep?.anchor;

  const displayStep = useMemo(
    () => (currentStep ? { ...currentStep, anchor: effectiveAnchor } : currentStep),
    [currentStep, effectiveAnchor]
  );

  // Walk the real pages: navigate to each step's page as the tour advances.
  // Reads window.location directly so this only fires on step changes, not on
  // unrelated navigation while the tour is open.
  useEffect(() => {
    if (isLoading || !isVisible || !effectiveRoute) return;
    const here = window.location.pathname + window.location.search;
    if (here !== effectiveRoute) {
      navigate(effectiveRoute);
    }
  }, [isLoading, isVisible, currentStepIndex, effectiveRoute, navigate]);

  return (
    <TutorialContext.Provider
      value={{
        reopenTutorial: reopen,
        isVisible,
      }}
    >
      {children}
      {!isLoading && isVisible && displayStep && (
        <ScrollTutorialUI
          currentStep={displayStep}
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
