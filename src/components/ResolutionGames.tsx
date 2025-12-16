import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Flame, CheckCircle, XCircle, AlertTriangle, Trophy, Skull } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const makerResponses = {
  valid: [
    "Your ancestors would be mildly impressed. RESOLUTION APPROVED.",
    "The universe has deemed this worthy of your suffering. PROCEED.",
    "Congratulations, you've chosen a path of noble self-torture. VALIDATED.",
    "The cosmos nods approvingly at your ambition. BEGIN YOUR JOURNEY.",
    "Your future self thanks your present self for this gift of struggle. APPROVED.",
    "This resolution has been blessed by the Committee of Unrealistic Expectations. GO FORTH.",
    "The stars have aligned in favor of your temporary motivation. VALIDATED.",
    "Your optimism is adorable and valid. RESOLUTION ACCEPTED.",
    "The Ancient Order of Self-Improvement approves. MAY THE ODDS BE EVER IN YOUR FAVOR.",
    "Your determination has been noted by the Bureau of Fleeting Commitments. CERTIFIED.",
  ],
  invalid: [
    "Your reason lacks the desperation required. Try adding more existential dread.",
    "Too reasonable. Real resolutions require delusion. REJECTED.",
    "The Council of Broken Dreams has seen this excuse before. TRY HARDER.",
    "Your motivation seems suspiciously healthy. Are you sure you're human?",
    "This reason would only work if you were a robot. Are you a robot? DENIED.",
    "The Algorithm of Self-Sabotage finds your reasoning insufficient. RECALIBRATE.",
    "Your excuse lacks the necessary guilt and shame. Add more childhood trauma.",
    "Too logical. Resolutions require emotional chaos, not reason. REJECTED.",
    "The Department of Unrealistic Goals requires more magical thinking.",
    "Your reasoning has been flagged for being too achievable. SUSPICIOUS.",
  ],
  chaotic: [
    "Your resolution has been forwarded to a parallel universe where it might work. MAYBE.",
    "The Oracle is confused but intrigued. TENTATIVELY APPROVED... FOR NOW.",
    "Your fate has been decided by a coin flip. The coin is still spinning. WAIT.",
    "The prophecy is unclear. Try again when Mercury is in retrograde.",
    "Your resolution has achieved quantum superposition: both approved and denied.",
    "The spirits are arguing about this one. Check back in 3-5 business days.",
  ],
};

const breakerResponses = {
  valid: [
    "Your excuse has been CERTIFIED by the International Board of Giving Up. You're FREE.",
    "The universe agrees: this resolution was stupid anyway. LIBERATION GRANTED.",
    "Your reasoning is flawless. Go eat that cake. BREAK APPROVED.",
    "The Committee for Personal Comfort applauds your wisdom. RESOLUTION TERMINATED.",
    "Life is short. Your excuse is valid. ENJOY YOUR FREEDOM.",
    "The ancestors approve of your strategic retreat. HONORABLE DISCHARGE GRANTED.",
    "Your justification has been filed under 'Self-Care'. BREAK VALIDATED.",
    "The Algorithm of Reasonable Expectations agrees. RESOLUTION DISSOLVED.",
    "Your future self forgives your present self. PERMISSION TO QUIT GRANTED.",
    "The Bureau of Realistic Expectations stamps this: APPROVED FOR IMMEDIATE ABANDONMENT.",
  ],
  invalid: [
    "Nice try, but your excuse is weak sauce. The resolution STANDS.",
    "The Council of Accountability sees through your lies. KEEP GOING.",
    "Your excuse has been denied by the Department of Tough Love. PERSIST.",
    "The spirits of your disappointed gym teachers reject this reasoning. CONTINUE.",
    "Your justification lacks sufficient suffering. RESOLUTION MAINTAINED.",
    "The Oracle of Discipline finds your excuse... pathetic. NO BREAK FOR YOU.",
    "Your excuse has been filed in the trash. The resolution REMAINS.",
    "The ancestors are not impressed. They walked uphill both ways. YOU CAN DO THIS.",
    "Your reasoning has been rejected for being too convenient. NICE TRY.",
    "The Algorithm of No-Excuses has flagged this as COPE. DENIED.",
  ],
  chaotic: [
    "Your excuse exists in a state of quantum validity. Schrödinger says: MAYBE.",
    "The spirits are divided. Half say quit, half say persist. FLIP A COIN.",
    "Your reasoning has created a paradox. The universe is rebooting. STAND BY.",
    "The Oracle's crystal ball just cracked. This is either very good or very bad.",
    "Your excuse has been forwarded to the Department of Ambiguous Decisions. PENDING.",
    "The prophecy suggests you should... actually, it's illegible. DO WHATEVER.",
  ],
};

interface GameState {
  resolutions_made: number;
  resolutions_broken: number;
}

export default function ResolutionGames() {
  const [makerResolution, setMakerResolution] = useState("");
  const [makerReason, setMakerReason] = useState("");
  const [makerResult, setMakerResult] = useState<{ type: string; message: string } | null>(null);
  const [makerLoading, setMakerLoading] = useState(false);

  const [breakerResolution, setBreakerResolution] = useState("");
  const [breakerExcuse, setBreakerExcuse] = useState("");
  const [breakerResult, setBreakerResult] = useState<{ type: string; message: string } | null>(null);
  const [breakerLoading, setBreakerLoading] = useState(false);

  const [gameState, setGameState] = useState<GameState>({ resolutions_made: 0, resolutions_broken: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadState();
  }, []);

  const checkAuthAndLoadState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session) {
      loadGameState(session.user.id);
    }
  };

  const loadGameState = async (userId: string) => {
    const { data } = await supabase
      .from('resolution_game_state')
      .select('resolutions_made, resolutions_broken')
      .eq('user_id', userId)
      .single();

    if (data) {
      setGameState(data);
    }
  };

  const updateGameState = async (field: 'resolutions_made' | 'resolutions_broken') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const newValue = gameState[field] + 1;
    const updates = { [field]: newValue };

    const { data: existing } = await supabase
      .from('resolution_game_state')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (existing) {
      await supabase
        .from('resolution_game_state')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id);
    } else {
      await supabase
        .from('resolution_game_state')
        .insert({ user_id: session.user.id, ...updates });
    }

    setGameState(prev => ({ ...prev, [field]: newValue }));
  };

  const validateMaker = () => {
    if (!makerResolution.trim() || !makerReason.trim()) return;
    
    setMakerLoading(true);
    setMakerResult(null);

    setTimeout(async () => {
      const roll = Math.random();
      let type: string;
      let responses: string[];

      if (roll < 0.4) {
        type = "valid";
        responses = makerResponses.valid;
        if (isAuthenticated) await updateGameState('resolutions_made');
      } else if (roll < 0.8) {
        type = "invalid";
        responses = makerResponses.invalid;
      } else {
        type = "chaotic";
        responses = makerResponses.chaotic;
      }

      const message = responses[Math.floor(Math.random() * responses.length)];
      setMakerResult({ type, message });
      setMakerLoading(false);
    }, 1500);
  };

  const validateBreaker = () => {
    if (!breakerResolution.trim() || !breakerExcuse.trim()) return;
    
    setBreakerLoading(true);
    setBreakerResult(null);

    setTimeout(async () => {
      const roll = Math.random();
      let type: string;
      let responses: string[];

      if (roll < 0.45) {
        type = "valid";
        responses = breakerResponses.valid;
        if (isAuthenticated) await updateGameState('resolutions_broken');
      } else if (roll < 0.85) {
        type = "invalid";
        responses = breakerResponses.invalid;
      } else {
        type = "chaotic";
        responses = breakerResponses.chaotic;
      }

      const message = responses[Math.floor(Math.random() * responses.length)];
      setBreakerResult({ type, message });
      setBreakerLoading(false);
    }, 1500);
  };

  const resetMaker = () => {
    setMakerResolution("");
    setMakerReason("");
    setMakerResult(null);
  };

  const resetBreaker = () => {
    setBreakerResolution("");
    setBreakerExcuse("");
    setBreakerResult(null);
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-6 h-6 text-primary" />
          Resolution Validation Bureau
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Official certification for making AND breaking resolutions
        </p>
        {isAuthenticated && (
          <div className="flex gap-3 mt-2">
            <Badge variant="secondary" className="gap-1">
              <Trophy className="w-3 h-3" />
              Made: {gameState.resolutions_made}
            </Badge>
            <Badge variant="destructive" className="gap-1">
              <Skull className="w-3 h-3" />
              Broken: {gameState.resolutions_broken}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="maker" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="maker" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Resolution Maker
            </TabsTrigger>
            <TabsTrigger value="breaker" className="flex items-center gap-2">
              <Skull className="w-4 h-4" />
              Resolution Breaker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="maker" className="space-y-4">
            {!makerResult ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Resolution</label>
                  <Input
                    placeholder="e.g., Exercise every day, Learn a new language..."
                    value={makerResolution}
                    onChange={(e) => setMakerResolution(e.target.value)}
                    disabled={makerLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Why are you making this resolution?</label>
                  <Textarea
                    placeholder="Justify your optimism to the Council..."
                    value={makerReason}
                    onChange={(e) => setMakerReason(e.target.value)}
                    disabled={makerLoading}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={validateMaker} 
                  disabled={makerLoading || !makerResolution.trim() || !makerReason.trim()}
                  className="w-full"
                  variant="mystical"
                >
                  {makerLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Consulting the Oracle...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Submit for Validation
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={makerResult.type === "valid" ? "default" : makerResult.type === "invalid" ? "destructive" : "secondary"}>
                      {makerResult.type === "valid" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {makerResult.type === "invalid" && <XCircle className="w-3 h-3 mr-1" />}
                      {makerResult.type === "chaotic" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {makerResult.type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Resolution: "{makerResolution}"</p>
                  <p className="font-semibold text-foreground">{makerResult.message}</p>
                </div>
                <Button onClick={resetMaker} variant="outline" className="w-full">
                  Submit Another Resolution
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="breaker" className="space-y-4">
            {!breakerResult ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">The Resolution You Want to Break</label>
                  <Input
                    placeholder="e.g., That stupid diet, Going to the gym..."
                    value={breakerResolution}
                    onChange={(e) => setBreakerResolution(e.target.value)}
                    disabled={breakerLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Excuse for Breaking It</label>
                  <Textarea
                    placeholder="Plead your case to the Council of Accountability..."
                    value={breakerExcuse}
                    onChange={(e) => setBreakerExcuse(e.target.value)}
                    disabled={breakerLoading}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={validateBreaker} 
                  disabled={breakerLoading || !breakerResolution.trim() || !breakerExcuse.trim()}
                  className="w-full"
                  variant="destructive"
                >
                  {breakerLoading ? (
                    <>
                      <Flame className="w-4 h-4 animate-pulse" />
                      Evaluating Your Weakness...
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      Request Permission to Quit
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={breakerResult.type === "valid" ? "default" : breakerResult.type === "invalid" ? "destructive" : "secondary"}>
                      {breakerResult.type === "valid" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {breakerResult.type === "invalid" && <XCircle className="w-3 h-3 mr-1" />}
                      {breakerResult.type === "chaotic" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {breakerResult.type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Resolution: "{breakerResolution}"</p>
                  <p className="font-semibold text-foreground">{breakerResult.message}</p>
                </div>
                <Button onClick={resetBreaker} variant="outline" className="w-full">
                  Try Another Excuse
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
