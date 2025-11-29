import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skull, Trophy, Zap } from "lucide-react";

interface Scenario {
  description: string;
  choices: string[];
}

interface Death {
  cause: string;
  description: string;
  historicalBasis: string;
}

interface GameStats {
  survival_streak: number;
  total_scenarios: number;
}

const VerseAdventure = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [death, setDeath] = useState<Death | null>(null);
  const [stats, setStats] = useState<GameStats>({ survival_streak: 0, total_scenarios: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const startGame = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    setIsLoading(true);
    setDeath(null);
    try {
      const { data, error } = await supabase.functions.invoke('adventure-game', {
        body: { action: 'start' }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      setScenario(data.scenario);
      setStats(data.stats);
      setGameStarted(true);

      toast({
        title: "Adventure Begins!",
        description: "Choose wisely... death lurks around every corner.",
      });
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const makeChoice = async (choiceIndex: number) => {
    if (!sessionId || !scenario) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('adventure-game', {
        body: { 
          action: 'continue',
          sessionId,
          choiceIndex,
          previousScenario: scenario.description
        }
      });

      if (error) throw error;

      setStats(data.stats);

      if (data.isDeath) {
        setDeath(data.death);
        setScenario(null);
        setGameStarted(false);
      } else {
        setScenario(data.scenario);
        toast({
          title: "You Survived!",
          description: `Streak: ${data.stats.survival_streak}`,
        });
      }
    } catch (error) {
      console.error('Error making choice:', error);
      toast({
        title: "Error",
        description: "Failed to process choice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Verse Adventure
          </h1>
          <p className="text-muted-foreground text-lg">
            Navigate the infinite layers... where death is never the same twice
          </p>
        </div>

        {/* Stats Display */}
        <div className="flex justify-center gap-4 mb-8">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Trophy className="w-4 h-4 mr-2" />
            Streak: {stats.survival_streak}
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Total: {stats.total_scenarios}
          </Badge>
        </div>

        {/* Death Screen */}
        {death && (
          <Card className="mb-8 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Skull className="w-6 h-6" />
                You Died!
              </CardTitle>
              <CardDescription className="text-lg font-semibold">
                {death.cause}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed">{death.description}</p>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Historical Basis:</p>
                <p className="text-sm text-muted-foreground">{death.historicalBasis}</p>
              </div>

              <div className="text-center pt-4">
                <p className="text-muted-foreground mb-4">
                  Final Stats: {stats.survival_streak} scenarios survived
                </p>
                <Button onClick={startGame} disabled={isLoading} size="lg">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Scenario */}
        {!gameStarted && !death && (
          <Card>
            <CardHeader>
              <CardTitle>Ready to Enter the Verse?</CardTitle>
              <CardDescription>
                Choose your path through infinite creative layers. But beware - obscure deaths await around every corner. 
                Each death is unique and based on real historical events. Will you survive?
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAuthenticated === false && (
                <p className="text-sm text-muted-foreground mb-4">
                  Please sign in to play the adventure.
                </p>
              )}
              <Button 
                onClick={startGame} 
                disabled={isLoading}
                size="lg"
                className="w-full"
              >
                {isLoading ? "Generating Adventure..." : isAuthenticated === false ? "Sign In to Play" : "Begin Adventure"}
              </Button>
            </CardContent>
          </Card>
        )}

        {scenario && gameStarted && (
          <Card>
            <CardHeader>
              <CardTitle>Your Journey Continues...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg leading-relaxed whitespace-pre-line">
                {scenario.description}
              </p>

              <div className="space-y-3">
                <p className="font-semibold text-muted-foreground">What do you do?</p>
                {scenario.choices.map((choice, index) => (
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

              {isLoading && (
                <div className="text-center text-muted-foreground animate-pulse">
                  Determining your fate...
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VerseAdventure;
