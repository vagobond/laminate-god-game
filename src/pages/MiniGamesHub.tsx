import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Globe, Heart, Play } from "lucide-react";
import CureToLonelinessGame from "@/components/CureToLonelinessGame";
import { EveryCountryGame } from "@/components/EveryCountryGame";
import { GameModal } from "@/components/GameModal";
import { useIsMobile } from "@/hooks/use-mobile";

type GameType = "country" | "loneliness" | null;

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
    }
  ];

  const getGameContent = (gameType: GameType) => {
    switch (gameType) {
      case "country":
        return <EveryCountryGame />;
      case "loneliness":
        return <CureToLonelinessGame />;
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
