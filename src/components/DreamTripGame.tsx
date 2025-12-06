import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plane, MapPin, Plus, X, Sparkles, ExternalLink } from "lucide-react";

interface GameStep {
  step: number;
  description: string;
  choices: string[];
}

export const DreamTripGame = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<GameStep | null>(null);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const addDestination = () => {
    if (!currentInput.trim()) return;
    if (destinations.length >= 10) {
      toast({
        title: "Maximum Reached",
        description: "You can only add up to 10 destinations.",
        variant: "destructive",
      });
      return;
    }
    setDestinations([...destinations, currentInput.trim()]);
    setCurrentInput("");
  };

  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  const startTrip = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (destinations.length === 0) {
      toast({
        title: "Add Destinations",
        description: "Please add at least one destination to start your dream trip.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setStepHistory([]);
    setGameComplete(false);

    try {
      const { data, error } = await supabase.functions.invoke('dream-trip', {
        body: { 
          action: 'start',
          destinations 
        }
      });

      if (error) throw error;

      setCurrentStep(data.step);
      setGameStarted(true);

      toast({
        title: "Your Dream Trip Begins!",
        description: "Make your choices and live the adventure.",
      });
    } catch (error: any) {
      console.error('Error starting trip:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const makeChoice = async (choiceIndex: number) => {
    if (!currentStep) return;

    setIsLoading(true);
    const choiceMade = currentStep.choices[choiceIndex];
    setStepHistory([...stepHistory, `Step ${currentStep.step}: ${choiceMade}`]);

    try {
      const { data, error } = await supabase.functions.invoke('dream-trip', {
        body: { 
          action: 'continue',
          destinations,
          currentStep: currentStep.step,
          choiceMade,
          previousDescription: currentStep.description,
          history: stepHistory
        }
      });

      if (error) throw error;

      if (data.complete) {
        setGameComplete(true);
        setCurrentStep(null);
      } else {
        setCurrentStep(data.step);
      }
    } catch (error: any) {
      console.error('Error continuing trip:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to continue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setCurrentStep(null);
    setStepHistory([]);
    setGameComplete(false);
    setDestinations([]);
  };

  // Destination input phase
  if (!gameStarted) {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-primary" />
            Dream Trip
          </CardTitle>
          <CardDescription>
            Add up to 10 destinations for your fantasy trip, then live the adventure through an AI-generated story!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated === false && (
            <p className="text-sm text-muted-foreground">
              Please sign in to play Dream Trip.
            </p>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Enter a destination (e.g., Tokyo, Japan)"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDestination()}
              disabled={destinations.length >= 10}
            />
            <Button 
              onClick={addDestination} 
              size="icon"
              disabled={destinations.length >= 10 || !currentInput.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {destinations.map((dest, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="flex items-center gap-1 px-3 py-1.5"
              >
                <MapPin className="w-3 h-3" />
                {dest}
                <button 
                  onClick={() => removeDestination(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {destinations.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {destinations.length}/10 destinations added
            </p>
          )}

          <Button 
            onClick={startTrip}
            disabled={isLoading || destinations.length === 0}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating Your Trip...
              </>
            ) : isAuthenticated === false ? (
              "Sign In to Play"
            ) : (
              <>
                <Plane className="w-4 h-4 mr-2" />
                Start Dream Trip ({destinations.length} destination{destinations.length !== 1 ? 's' : ''})
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Game complete screen
  if (gameComplete) {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-6 h-6" />
            Your Dream Trip is Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg leading-relaxed">
            What an incredible journey through {destinations.join(', ')}! 
            Your adventure took you to amazing places and created memories that will last a lifetime.
          </p>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="font-semibold">Ready to make this dream a reality?</p>
            <p className="text-muted-foreground text-sm">
              Research your destinations and start planning your actual trip. Every great journey begins with a single step!
            </p>
          </div>

          <a 
            href="https://www.vagobond.com/?s=world+travel"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full" size="lg" variant="mystical">
              <ExternalLink className="w-4 h-4 mr-2" />
              Start Your Journey Here
            </Button>
          </a>

          <Button 
            onClick={resetGame}
            variant="outline"
            className="w-full"
          >
            Plan Another Dream Trip
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active game screen
  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-primary" />
            Dream Trip
          </CardTitle>
          <Badge variant="secondary">
            Step {currentStep?.step || 1} / 20
          </Badge>
        </div>
        <CardDescription>
          Visiting: {destinations.join(' → ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentStep && (
          <>
            <p className="text-lg leading-relaxed whitespace-pre-line">
              {currentStep.description}
            </p>

            <div className="space-y-3">
              <p className="font-semibold text-muted-foreground">What do you do?</p>
              {currentStep.choices.map((choice, index) => (
                <Button
                  key={index}
                  onClick={() => makeChoice(index)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-4 px-6 hover:bg-primary/10"
                >
                  <span className="font-semibold mr-3">{index + 1}.</span>
                  <span>{choice}</span>
                </Button>
              ))}
            </div>
          </>
        )}

        {isLoading && (
          <div className="text-center text-muted-foreground animate-pulse flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            Continuing your adventure...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
