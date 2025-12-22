import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skull, Trophy, Zap, Home, Globe, Heart, Sparkles, Plane, CircleDot, Award, Play, Tent } from "lucide-react";
import { WolfemonGame } from "@/components/WolfemonGame";
import { ArtIFucked } from "@/components/ArtIFucked";
import { SlyDoubtGame } from "@/components/SlyDoubtGame";
import { DreamTripGame } from "@/components/DreamTripGame";
import CureToLonelinessGame from "@/components/CureToLonelinessGame";
import ResolutionGames from "@/components/ResolutionGames";
import { EveryCountryGame } from "@/components/EveryCountryGame";
import { GameModal } from "@/components/GameModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoughLivingGame } from "@/components/RoughLivingGame";

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

type GameType = "country" | "loneliness" | "slyDoubt" | "verse" | "dreamTrip" | "wolfemon" | "artIFucked" | "resolution" | "roughLiving" | null;

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string;
}

const GameCard = ({ title, description, icon, onClick, badge }: GameCardProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group"
      onClick={onClick}
    >
      <CardHeader className={isMobile ? "p-4" : "p-6"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {icon}
            </div>
            <div>
              <CardTitle className={`${isMobile ? "text-base" : "text-lg"}`}>{title}</CardTitle>
              {badge && <Badge variant="secondary" className="mt-1 text-xs">{badge}</Badge>}
            </div>
          </div>
          <Play className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
      <CardContent className={`${isMobile ? "p-4 pt-0" : "p-6 pt-0"}`}>
        <CardDescription className={isMobile ? "text-xs" : "text-sm"}>{description}</CardDescription>
      </CardContent>
    </Card>
  );
};

// Verse Adventure Game Component (inline since it has special state)
const VerseAdventureGame = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [death, setDeath] = useState<Death | null>(null);
  const [stats, setStats] = useState<GameStats>({ survival_streak: 0, total_scenarios: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [deathCount, setDeathCount] = useState(0);

  useEffect(() => {
    checkAuth();
    fetchDeathCount();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const fetchDeathCount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { count } = await supabase
      .from('game_deaths')
      .select('*', { count: 'exact', head: true });
    
    setDeathCount(count || 0);
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
        fetchDeathCount();
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
    <div className="space-y-6">
      <div className="flex justify-start gap-4 flex-wrap">
        <Badge variant="secondary" className="text-base px-4 py-2">
          <Trophy className="w-4 h-4 mr-2" />
          Streak: {stats.survival_streak}
        </Badge>
        <Badge variant="secondary" className="text-base px-4 py-2">
          <Zap className="w-4 h-4 mr-2" />
          Total: {stats.total_scenarios}
        </Badge>
        {isAuthenticated && (
          <Badge 
            variant="destructive" 
            className="text-base px-4 py-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/death-history')}
          >
            <Skull className="w-4 h-4 mr-2" />
            Deaths: {deathCount}
          </Badge>
        )}
      </div>

      {death && (
        <Card className="border-destructive">
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
        
      <a 
        href="https://sigil-shift-core.lovable.app" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center text-primary hover:text-primary/80 underline underline-offset-4"
      >
        Pax's Sigil Challenge →
      </a>
    </div>
  );
};

const MiniGamesHub = () => {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const isMobile = useIsMobile();

  const games = [
    {
      id: "country" as GameType,
      title: "Every Country in the World",
      description: "Help us get a user from every country! Invite friends and track global representation.",
      icon: <Globe className="w-5 h-5" />,
      badge: "Social"
    },
    {
      id: "loneliness" as GameType,
      title: "The Cure to Loneliness and Boredom",
      description: "Wild, offbeat activities to cure boredom or connect with others.",
      icon: <Heart className="w-5 h-5" />,
      badge: "Adventure"
    },
    {
      id: "slyDoubt" as GameType,
      title: "Sly Doubt of Uranus",
      description: "A narrative adventure through the depths of Uranus. Collect Bloot and spark revolution!",
      icon: <Sparkles className="w-5 h-5" />,
      badge: "Story"
    },
    {
      id: "verse" as GameType,
      title: "Verse Adventure",
      description: "Choose your path through infinite creative layers. Beware - obscure deaths await!",
      icon: <Skull className="w-5 h-5" />,
      badge: "Survival"
    },
    {
      id: "dreamTrip" as GameType,
      title: "Dream Trip",
      description: "Plan your fantasy trip and live the adventure through a choose-your-own-adventure story!",
      icon: <Plane className="w-5 h-5" />,
      badge: "Travel"
    },
    {
      id: "wolfemon" as GameType,
      title: "Wolfemon",
      description: "Collect pixelated lamb+hamster hybrids, harvest wool, and beware of wild Wolfemon!",
      icon: <CircleDot className="w-5 h-5" />,
      badge: "Idle"
    },
    {
      id: "artIFucked" as GameType,
      title: "Art I Fucked",
      description: "In a world destroyed by AI, encounter those who helped build the machines that ended civilization.",
      icon: <Award className="w-5 h-5" />,
      badge: "Drama"
    },
    {
      id: "resolution" as GameType,
      title: "Resolution Validation Bureau",
      description: "Official certification for making AND breaking resolutions.",
      icon: <Trophy className="w-5 h-5" />,
      badge: "Comedy"
    },
    {
      id: "roughLiving" as GameType,
      title: "Rough Living",
      description: "Navigate the challenges of being a vagabond. Manage health, hunger, warmth, and morale to survive.",
      icon: <Tent className="w-5 h-5" />,
      badge: "Survival"
    }
  ];

  const getGameContent = (gameType: GameType) => {
    switch (gameType) {
      case "country":
        return <EveryCountryGame />;
      case "loneliness":
        return <CureToLonelinessGame />;
      case "slyDoubt":
        return <SlyDoubtGame />;
      case "verse":
        return <VerseAdventureGame />;
      case "dreamTrip":
        return <DreamTripGame />;
      case "wolfemon":
        return <WolfemonGame />;
      case "artIFucked":
        return <ArtIFucked />;
      case "resolution":
        return <ResolutionGames />;
      case "roughLiving":
        return <RoughLivingGame />;
      default:
        return null;
    }
  };

  const getGameTitle = (gameType: GameType) => {
    return games.find(g => g.id === gameType)?.title || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="container max-w-6xl mx-auto">
        <div className="flex justify-start mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/powers")}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Powers
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Mini-Games Hub
          </h1>
          <p className="text-muted-foreground text-lg">
            Challenge yourself with our collection of unique games
          </p>
        </div>

        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"}`}>
          {games.map((game) => (
            <GameCard
              key={game.id}
              title={game.title}
              description={game.description}
              icon={game.icon}
              badge={game.badge}
              onClick={() => setActiveGame(game.id)}
            />
          ))}
        </div>

        <GameModal
          isOpen={activeGame !== null}
          onClose={() => setActiveGame(null)}
          title={getGameTitle(activeGame)}
        >
          {getGameContent(activeGame)}
        </GameModal>
      </div>
    </div>
  );
};

export default MiniGamesHub;
