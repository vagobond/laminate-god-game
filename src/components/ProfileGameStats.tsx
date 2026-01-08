import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface ProfileGameStatsProps {
  userId: string;
}

export function ProfileGameStats({ userId }: ProfileGameStatsProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle 
          className="text-lg flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
          onClick={() => navigate('/mini-games-hub')}
        >
          <Sparkles className="w-5 h-5 text-primary" />
          Mini-Games
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <button 
            onClick={() => navigate('/mini-games-hub')}
            className="text-primary hover:underline"
          >
            Play mini-games
          </button>{' '}
          to explore Every Country in the World and The Cure to Loneliness!
        </div>
      </CardContent>
    </Card>
  );
}