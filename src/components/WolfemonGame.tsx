import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Coins, CircleDot, Scissors, Zap, Shield } from "lucide-react";

interface GameState {
  sheep_count: number;
  wool_count: number;
  gold: number;
  total_sheep_collected: number;
  has_wolfemon: boolean;
}

export const WolfemonGame = () => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    sheep_count: 0,
    wool_count: 0,
    gold: 100,
    total_sheep_collected: 0,
    has_wolfemon: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthAndLoadGame();
  }, []);

  const checkAuthAndLoadGame = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    
    if (session) {
      await loadGameState();
    }
  };

  const loadGameState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('wolfemon_game_state')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading game:', error);
      return;
    }

    if (data) {
      setGameState({
        sheep_count: data.sheep_count,
        wool_count: data.wool_count,
        gold: data.gold,
        total_sheep_collected: data.total_sheep_collected,
        has_wolfemon: data.has_wolfemon,
      });
    } else {
      // Create initial game state
      await saveGameState({
        sheep_count: 0,
        wool_count: 0,
        gold: 100,
        total_sheep_collected: 0,
        has_wolfemon: false,
      });
    }
  };

  const saveGameState = async (state: GameState) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('wolfemon_game_state')
      .upsert({
        user_id: session.user.id,
        ...state,
        last_action_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving game:', error);
      toast({
        title: "Error",
        description: "Failed to save game state.",
        variant: "destructive",
      });
    }
  };

  const collectSheep = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    
    // RNG for Wolfemon attack (10% chance) - Wolfemon owners are protected
    const wolfemonAttack = !gameState.has_wolfemon && Math.random() < 0.1;
    
    if (wolfemonAttack) {
      toast({
        title: "🐺 Wolfemon Attack!",
        description: "A wild Wolfemon scared away the lamster you were trying to collect!",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    let newTotalCollected = gameState.total_sheep_collected + 1;
    let newHasWolfemon = gameState.has_wolfemon;
    let transmogrified = false;

    // Check if we've hit 100 collected - transmogrify into a Wolfemon!
    if (newTotalCollected >= 100 && !gameState.has_wolfemon) {
      newTotalCollected = newTotalCollected % 100; // Reset to remainder (e.g., 105 -> 5)
      newHasWolfemon = true;
      transmogrified = true;
    }

    const newState = {
      ...gameState,
      sheep_count: gameState.sheep_count + 1,
      total_sheep_collected: newTotalCollected,
      has_wolfemon: newHasWolfemon,
    };
    
    setGameState(newState);
    await saveGameState(newState);
    
    if (transmogrified) {
      toast({
        title: "🐺 TRANSMOGRIFICATION!",
        description: "Your 100 lamsters have transmogrified into a Wolfemon! It now protects your field and helps with harvesting!",
      });
    } else {
      toast({
        title: "Lamster Collected!",
        description: `You now have ${newState.sheep_count} lamsters in your field.`,
      });
    }
    
    setIsLoading(false);
  };

  const sellSheep = async () => {
    if (!isAuthenticated || gameState.sheep_count === 0) return;
    
    setIsLoading(true);
    
    // RNG for sheep price (50-150 gold per sheep)
    const pricePerSheep = Math.floor(Math.random() * 100) + 50;
    const earnings = gameState.sheep_count * pricePerSheep;
    
    const newState = {
      ...gameState,
      sheep_count: 0,
      gold: gameState.gold + earnings,
    };
    
    setGameState(newState);
    await saveGameState(newState);
    
    toast({
      title: "Lamsters Sold!",
      description: `Sold ${gameState.sheep_count} lamsters for ${earnings} gold (${pricePerSheep}g each).`,
    });
    
    setIsLoading(false);
  };

  const hireFleshearer = async () => {
    if (!isAuthenticated || gameState.sheep_count === 0) return;
    
    setIsLoading(true);
    
    // RNG for Fleshearer cost (20-50 gold per sheep)
    const costPerSheep = Math.floor(Math.random() * 30) + 20;
    const totalCost = gameState.sheep_count * costPerSheep;
    
    if (gameState.gold < totalCost) {
      toast({
        title: "Not Enough Gold",
        description: `You need ${totalCost} gold to hire a Fleshearer for ${gameState.sheep_count} lamsters.`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // RNG for wool price (80-200 gold per wool)
    const woolPrice = Math.floor(Math.random() * 120) + 80;
    const woolHarvested = gameState.sheep_count;
    const woolEarnings = woolHarvested * woolPrice;
    const netProfit = woolEarnings - totalCost;
    
    const newState = {
      ...gameState,
      wool_count: gameState.wool_count + woolHarvested,
      gold: gameState.gold + netProfit,
      sheep_count: 0,
    };
    
    setGameState(newState);
    await saveGameState(newState);
    
    toast({
      title: "Wool Harvested!",
      description: `Paid ${totalCost}g to Fleshearer. Sold ${woolHarvested} wool for ${woolEarnings}g. Net: +${netProfit}g`,
    });
    
    setIsLoading(false);
  };

  const feedSheep = async () => {
    if (!isAuthenticated || gameState.sheep_count === 0) return;
    
    setIsLoading(true);
    
    const feedCost = gameState.sheep_count * 5; // 5 gold per sheep
    
    if (gameState.gold < feedCost) {
      toast({
        title: "Not Enough Gold",
        description: `You need ${feedCost} gold to feed ${gameState.sheep_count} lamsters.`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    const newState = {
      ...gameState,
      gold: gameState.gold - feedCost,
    };
    
    setGameState(newState);
    await saveGameState(newState);
    
    toast({
      title: "Lamsters Fed",
      description: `Spent ${feedCost} gold to keep your lamsters happy.`,
    });
    
    setIsLoading(false);
  };

  const deployWolfemon = async () => {
    if (!isAuthenticated || gameState.has_wolfemon || gameState.total_sheep_collected < 100) return;
    
    setIsLoading(true);
    
    const newState = {
      ...gameState,
      has_wolfemon: true,
    };
    
    setGameState(newState);
    await saveGameState(newState);
    
    toast({
      title: "🐺 Wolfemon Deployed!",
      description: "Your own Wolfemon now protects your field and helps with harvesting!",
    });
    
    setIsLoading(false);
  };

  const autoHarvest = async () => {
    if (!isAuthenticated || !gameState.has_wolfemon || gameState.sheep_count === 0) return;
    
    setIsLoading(true);
    
    // Wolfemon harvests for free but takes 20% cut
    const woolPrice = Math.floor(Math.random() * 120) + 80;
    const woolHarvested = gameState.sheep_count;
    const woolEarnings = woolHarvested * woolPrice;
    const wolfemonCut = Math.floor(woolEarnings * 0.2);
    const playerEarnings = woolEarnings - wolfemonCut;
    
    const newState = {
      ...gameState,
      wool_count: gameState.wool_count + woolHarvested,
      gold: gameState.gold + playerEarnings,
      sheep_count: 0,
    };
    
    setGameState(newState);
    await saveGameState(newState);
    
    toast({
      title: "🐺 Wolfemon Harvested!",
      description: `Your Wolfemon harvested ${woolHarvested} wool for ${playerEarnings}g (took ${wolfemonCut}g cut).`,
    });
    
    setIsLoading(false);
  };

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🐑 Wolfemon</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isAuthenticated === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🐑 Wolfemon</CardTitle>
          <CardDescription>
            Please sign in to play Wolfemon and collect pixelated lamsters!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.href = '/auth'}
            className="w-full"
            size="lg"
          >
            Sign In to Play
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🐑 Wolfemon
          {gameState.has_wolfemon && <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />Protected</Badge>}
        </CardTitle>
        <CardDescription>
          Collect pixelated lamb+hamster hybrids, harvest wool, and beware of wild Wolfemon!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-base px-3 py-1">
            <Coins className="w-4 h-4 mr-1" />
            {gameState.gold}g
          </Badge>
          <Badge variant="secondary" className="text-base px-3 py-1">
            <CircleDot className="w-4 h-4 mr-1" />
            {gameState.sheep_count} lamsters
          </Badge>
          <Badge variant="secondary" className="text-base px-3 py-1">
            <Scissors className="w-4 h-4 mr-1" />
            {gameState.wool_count} wool
          </Badge>
          <Badge variant="outline" className="text-base px-3 py-1">
            <Zap className="w-4 h-4 mr-1" />
            {String(gameState.total_sheep_collected).padStart(3, '0')}/100 collected
          </Badge>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={collectSheep} 
            disabled={isLoading}
            className="w-full"
          >
            Collect Lamster
          </Button>
          
          <Button 
            onClick={sellSheep} 
            disabled={isLoading || gameState.sheep_count === 0}
            variant="outline"
            className="w-full"
          >
            Sell Lamsters
          </Button>
          
          <Button 
            onClick={hireFleshearer} 
            disabled={isLoading || gameState.sheep_count === 0}
            variant="outline"
            className="w-full"
          >
            Hire Fleshearer
          </Button>
          
          <Button 
            onClick={feedSheep} 
            disabled={isLoading || gameState.sheep_count === 0}
            variant="outline"
            className="w-full"
          >
            Feed ({gameState.sheep_count * 5}g)
          </Button>
        </div>


        {gameState.has_wolfemon && (
          <div className="pt-2 border-t">
            <Button 
              onClick={autoHarvest} 
              disabled={isLoading || gameState.sheep_count === 0}
              className="w-full"
            >
              🐺 Wolfemon Auto-Harvest (20% cut)
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {gameState.has_wolfemon 
            ? "Your Wolfemon protects against attacks and harvests wool automatically!" 
            : "Watch out for wild Wolfemon! They might steal your lamsters..."}
        </p>
      </CardContent>
    </Card>
  );
};
