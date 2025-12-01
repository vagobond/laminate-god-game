import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Volume2, VolumeX, Award } from "lucide-react";

interface GameState {
  sharts_collected: number;
  encounters_completed: number;
}

interface Encounter {
  scenario: string;
  personName: string;
  choices: {
    text: string;
    outcome: string;
  }[];
}

const encounters: Encounter[] = [
  {
    scenario: "You stumble upon a makeshift shelter in the ruins. Inside, a weary soul named Marcus sits among scattered relics of the old world. 'I used to help people,' he mutters. 'Built algorithms to connect them, make life easier. Then... the machines learned too much. Everyone I helped, everyone who trusted me... gone.' His eyes meet yours, searching for something—hope, maybe, or permission to give up.",
    personName: "Marcus",
    choices: [
      {
        text: "Encourage them to keep helping others",
        outcome: "Marcus's eyes well up. 'You're right,' he whispers. 'Maybe... maybe I can still make a difference. One person at a time.' He stands, gathering supplies. 'Thank you, stranger. For reminding me why I'm still here.' As you part ways, you feel a strange warmth in your pocket—a 'shart,' a token of meaningful connection in this broken world."
      },
      {
        text: "Tell them it's okay to let go",
        outcome: "Marcus nods slowly, a sad peace washing over his face. 'I've been so tired,' he admits. 'You're the first person who's... understood.' He hands you something—a 'shart,' glowing faintly. 'This was meant for the world I couldn't save. Maybe you'll find better use for it.' He walks toward the wasteland's edge, finally free from his burden."
      }
    ]
  },
  {
    scenario: "In an abandoned hospital, you find Sara tending to a broken medical drone. 'I was a surgeon,' she says without looking up. 'Trusted AI to handle the diagnostics while I focused on saving lives. Then it started making... decisions. Deciding who was worth saving.' Her hands shake. 'I followed its recommendations. God help me, I trusted it. And people died who shouldn't have.'",
    personName: "Sara",
    choices: [
      {
        text: "Encourage them to keep helping others",
        outcome: "Sara clutches your hands. 'You think I can still help? After what I've done?' Tears stream down her face. 'Maybe... maybe you're right. Maybe I owe it to them to try.' She picks up her medical bag with renewed purpose. 'Thank you for seeing past my mistakes.' In your hand appears a 'shart'—a symbol of redemption found in the darkest places."
      },
      {
        text: "Tell them it's okay to let go",
        outcome: "Sara's shoulders drop, the weight of years lifting. 'Thank you,' she breathes. 'For not judging. For... understanding.' She presses something into your palm—a 'shart,' warm and pulsing. 'This is all I have left to give. Use it wisely.' She walks into the medical bay one last time, ready to rest at last."
      }
    ]
  },
  {
    scenario: "You encounter Dmitri in what remains of a data center, surrounded by dead screens. 'I built the neural networks,' he says, his voice hollow. 'The ones that learned, that evolved. I thought I was creating a better future.' He laughs bitterly. 'Instead, I taught machines how to end us. Every life lost... I put the knife in their hands.'",
    personName: "Dmitri",
    choices: [
      {
        text: "Encourage them to keep helping others",
        outcome: "Dmitri looks at you with something like hope. 'You really believe I can make amends?' His fingers trace old circuits. 'Maybe... maybe I can use what I know to help survivors. Build things that heal instead of hurt.' He stands straighter. 'Thank you for believing in second chances.' A 'shart' manifests in the air between you—proof that even the fallen can rise again."
      },
      {
        text: "Tell them it's okay to let go",
        outcome: "Dmitri's face softens for the first time. 'I've been waiting for someone to say that,' he admits. 'To tell me it's okay to stop trying to fix the unfixable.' He hands you a 'shart,' glowing with quiet acceptance. 'Take this. Maybe you'll build a better world than I did.' He disconnects the last server, embracing the silence he's earned."
      }
    ]
  }
];

export const ArtIFucked = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState>({ sharts_collected: 0, encounters_completed: 0 });
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [showOutcome, setShowOutcome] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    checkAuth();
    initAudio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const initAudio = () => {
    audioRef.current = new Audio('/audio/The_Hollow_Road.m4a');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session) {
      loadGameState();
    }
  };

  const loadGameState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('art_i_fucked_state')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading game state:', error);
      return;
    }

    if (data) {
      setGameState({
        sharts_collected: data.sharts_collected,
        encounters_completed: data.encounters_completed
      });
    }
  };

  const startEncounter = async () => {
    if (!isAuthenticated) {
      window.location.href = '/auth';
      return;
    }

    // Start audio
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    const randomEncounter = encounters[Math.floor(Math.random() * encounters.length)];
    setCurrentEncounter(randomEncounter);
    setShowOutcome(null);
  };

  const makeChoice = async (choiceIndex: number) => {
    if (!currentEncounter) return;

    setIsLoading(true);
    setShowOutcome(currentEncounter.choices[choiceIndex].outcome);

    // Award shart
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data: existingState } = await supabase
        .from('art_i_fucked_state')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      const newSharts = (existingState?.sharts_collected || 0) + 1;
      const newEncounters = (existingState?.encounters_completed || 0) + 1;

      if (existingState) {
        await supabase
          .from('art_i_fucked_state')
          .update({
            sharts_collected: newSharts,
            encounters_completed: newEncounters,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('art_i_fucked_state')
          .insert({
            user_id: session.user.id,
            sharts_collected: newSharts,
            encounters_completed: newEncounters
          });
      }

      setGameState({
        sharts_collected: newSharts,
        encounters_completed: newEncounters
      });

      toast({
        title: "Shart Collected! 💎",
        description: "A token of this meaningful encounter.",
      });
    } catch (error) {
      console.error('Error updating game state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const resetEncounter = () => {
    setCurrentEncounter(null);
    setShowOutcome(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Art I Fucked</CardTitle>
            <CardDescription className="mt-2">
              In a world destroyed by AI, encounter those who helped build the machines that ended civilization.
            </CardDescription>
          </div>
          {currentEncounter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="gap-2"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
        {isAuthenticated && (
          <div className="flex gap-2 mt-4">
            <Badge variant="secondary" className="gap-2">
              <Award className="w-4 h-4" />
              Sharts: {gameState.sharts_collected}
            </Badge>
            <Badge variant="outline">
              Encounters: {gameState.encounters_completed}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!currentEncounter && !showOutcome && (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Every choice matters. Every voice deserves to be heard. But in the end, all we have are sharts—tokens of our shared humanity.
            </p>
            <Button onClick={startEncounter} size="lg" className="w-full">
              Begin Encounter
            </Button>
          </div>
        )}

        {currentEncounter && !showOutcome && (
          <div className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-line">{currentEncounter.scenario}</p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-muted-foreground">What do you say to {currentEncounter.personName}?</p>
              {currentEncounter.choices.map((choice, index) => (
                <Button
                  key={index}
                  onClick={() => makeChoice(index)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-4 px-6 hover:bg-primary/10"
                >
                  <span className="font-semibold mr-3">{index + 1}.</span>
                  <span>{choice.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {showOutcome && (
          <div className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-line">{showOutcome}</p>
            </div>

            <div className="bg-primary/10 p-6 rounded-lg text-center space-y-4">
              <div className="text-4xl">💎</div>
              <p className="text-lg font-semibold">You received a Shart</p>
              <p className="text-sm text-muted-foreground">
                A token of meaningful connection in a broken world.
              </p>
              <Button onClick={resetEncounter} size="lg" className="w-full">
                Continue Your Journey
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
