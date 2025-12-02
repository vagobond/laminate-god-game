import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameState {
  bloot_collected: number;
  revolution_acts: number;
}

interface Encounter {
  scenario: string;
  location: string;
  choices: {
    text: string;
    outcome: string;
  }[];
}

const encounters: Encounter[] = [
  {
    scenario: "You discover your supervisor has been skimming Bloot shipments to line Jovian pockets. The evidence is clear in the manifests.",
    location: "Myanus Bloot Mines",
    choices: [
      {
        text: "Report it to the authorities (they're corrupt too)",
        outcome: "The authorities laugh and report YOU to the monarchs. Your claim is dismissed. You've learned whom you can't trust."
      },
      {
        text: "Keep silent and gather more evidence",
        outcome: "You document everything in secret. Knowledge is your Bloot now. +1 Bloot, +1 Revolution Act"
      },
      {
        text: "Sabotage the next shipment to Oberon",
        outcome: "The shipment 'mysteriously' disappears. The Jovian overlords rage but can't prove anything. +2 Revolution Acts"
      }
    ]
  },
  {
    scenario: "A new orphan arrives at Rektum University with the witch eyes of Titania. The other children are afraid.",
    location: "St. Crotum Orphanage",
    choices: [
      {
        text: "Befriend them and share Si Deresk's teachings",
        outcome: "You gain an ally. Together you study the old ways of Uranus before the Jovian takeover. +1 Revolution Act"
      },
      {
        text: "Ignore them - you have your own problems",
        outcome: "The child is adopted by monarchist sympathizers. Another potential revolutionary lost to the system."
      },
      {
        text: "Teach them your mother's explosive chemistry",
        outcome: "They excel at demolition theory. Si Deresk notices and begins training both of you. +1 Bloot, +2 Revolution Acts"
      }
    ]
  },
  {
    scenario: "You're working deep inside Uranus when you discover an ancient Holy Order sanctuary. The walls shimmer with pre-monarchy inscriptions.",
    location: "Deep Caverns of Uranus",
    choices: [
      {
        text: "Study the inscriptions alone",
        outcome: "You learn meditation techniques and ancient Bloot communion rituals. The old ways whisper to you. +1 Bloot"
      },
      {
        text: "Bring Si Deresk and other students here",
        outcome: "Si Deresk weeps with joy. This becomes your secret meeting place. The revolution gains a sacred home. +3 Revolution Acts"
      },
      {
        text: "Report it for a finder's fee",
        outcome: "The monarchy seals it off and pays you in worthless scrip. You've betrayed your heritage for nothing."
      }
    ]
  },
  {
    scenario: "The annual Golden Shower of Uranus is tomorrow. Tourists from across the solar system will gather. It's the perfect stage.",
    location: "Blorp Forest Amphitheater",
    choices: [
      {
        text: "Blend in with the crowd and do nothing",
        outcome: "You watch the yellow flowers fall. Beautiful but hollow. Nothing changes."
      },
      {
        text: "Hijack the broadcast to spread revolutionary messages",
        outcome: "For 3 minutes, truth reaches millions. You're now 'Uranus Most Wanted' but the seeds are planted. +5 Revolution Acts"
      },
      {
        text: "Use the chaos to steal Bloot shipments",
        outcome: "While everyone watches the sky, you and your crew liberate crates of Bloot for the resistance. +4 Bloot"
      }
    ]
  },
  {
    scenario: "An Ionian dragoon patrol stops you on the street. They're looking for 'suspicious individuals with witch eyes.'",
    location: "Degen-City Streets",
    choices: [
      {
        text: "Run and hide in the underground tunnels",
        outcome: "You escape but they increase patrols. The resistance must be more careful now."
      },
      {
        text: "Stand your ground and quote Uranian law",
        outcome: "They beat you anyway, but you don't break. Others see your courage. +2 Revolution Acts"
      },
      {
        text: "Use your mother's compass to navigate to a safe house",
        outcome: "The compass leads you to an underground resistance cell you didn't know existed. +1 Bloot, +2 Revolution Acts"
      }
    ]
  }
];

export function SlyDoubtGame() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [gameState, setGameState] = useState<GameState>({ bloot_collected: 0, revolution_acts: 0 });
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const authenticated = !!session;
    setIsAuthenticated(authenticated);
    if (authenticated) {
      loadGameState();
    }
  };

  const loadGameState = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('art_i_fucked_state')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newState } = await supabase
        .from('art_i_fucked_state')
        .insert({ 
          user_id: user.id, 
          sharts_collected: 0, 
          encounters_completed: 0 
        })
        .select()
        .single();
      
      if (newState) {
        setGameState({ 
          bloot_collected: newState.sharts_collected, 
          revolution_acts: newState.encounters_completed 
        });
      }
    } else if (data) {
      setGameState({ 
        bloot_collected: data.sharts_collected, 
        revolution_acts: data.encounters_completed 
      });
    }
  };

  const startEncounter = () => {
    const randomEncounter = encounters[Math.floor(Math.random() * encounters.length)];
    setCurrentEncounter(randomEncounter);
    setOutcome(null);
    
    if (!audioRef.current) {
      audioRef.current = new Audio('/audio/The_Hollow_Road.m4a');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }
    if (!isMuted) {
      audioRef.current.play().catch(console.error);
    }
  };

  const makeChoice = async (choiceIndex: number) => {
    if (!currentEncounter) return;
    
    const choice = currentEncounter.choices[choiceIndex];
    setOutcome(choice.outcome);
    
    const blootGain = (choice.outcome.match(/\+(\d+) Bloot/)?.[1] || 0) as number;
    const actGain = (choice.outcome.match(/\+(\d+) Revolution Act/)?.[1] || 0) as number;
    
    const newBloot = gameState.bloot_collected + Number(blootGain);
    const newActs = gameState.revolution_acts + Number(actGain);
    
    setGameState({ bloot_collected: newBloot, revolution_acts: newActs });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('art_i_fucked_state')
        .upsert({ 
          user_id: user.id, 
          sharts_collected: newBloot, 
          encounters_completed: newActs 
        });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  };

  const resetEncounter = () => {
    setCurrentEncounter(null);
    setOutcome(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  if (isAuthenticated === null) {
    return <div className="text-foreground">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border mystical-glow">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Sly Doubt of Uranus</CardTitle>
          <CardDescription className="text-muted-foreground">
            Join the revolution against the Jovian monarchy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">You must be authenticated to join the resistance.</p>
          <Button onClick={() => navigate('/auth')} variant="default">
            Sign In to Resist
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border mystical-glow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">Sly Doubt of Uranus</CardTitle>
            <CardDescription className="text-muted-foreground">
              A revolutionary tale of resistance and Bloot
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-sm">
              Bloot: {gameState.bloot_collected}
            </Badge>
            <Badge variant="default" className="text-sm">
              Revolution Acts: {gameState.revolution_acts}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentEncounter && !outcome && (
          <div className="space-y-4 text-center">
            <p className="text-foreground">
              The Jovian monarchy has enslaved Uranus for centuries. The valuable Bloot that powers the galaxy 
              enriches only the oppressors while the Uranian people suffer. You carry your father's journal of 
              corruption and your mother's explosive knowledge. Will you continue their fight?
            </p>
            <Button onClick={startEncounter} size="lg" variant="default" className="w-full">
              Begin Revolutionary Act
            </Button>
          </div>
        )}

        {currentEncounter && !outcome && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-xs">
                {currentEncounter.location}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-muted-foreground hover:text-foreground"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            
            <p className="text-foreground bg-muted/30 p-4 rounded-lg border border-border">
              {currentEncounter.scenario}
            </p>

            <div className="space-y-2">
              {currentEncounter.choices.map((choice, index) => (
                <Button
                  key={index}
                  onClick={() => makeChoice(index)}
                  variant="outline"
                  className="w-full text-left justify-start h-auto py-3 px-4 hover:bg-primary/10 hover:border-primary"
                >
                  {choice.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {outcome && (
          <div className="space-y-4">
            <div className="bg-accent/10 border border-accent p-4 rounded-lg">
              <p className="text-foreground">{outcome}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={resetEncounter} variant="outline" className="flex-1">
                Return to Surface
              </Button>
              <Button onClick={startEncounter} variant="default" className="flex-1">
                Continue Revolution
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
