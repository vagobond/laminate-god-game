import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameState {
  bloot_collected: number;
  revolution_acts: number;
}

interface Choice {
  text: string;
  outcome: string;
  nextScene?: string;
}

interface Scene {
  id: string;
  scenario: string;
  location: string;
  choices: Choice[];
}

const scenes: Record<string, Scene> = {
  // OPENING SCENES
  start: {
    id: "start",
    scenario: "You wake in the dormitories of St. Crotum Orphanage, the sheets damp with the morning dew that seeps through Uranus. Today is your 18th birthday - the day you're thrust out into the world. Si Deresk, the old monk who taught you everything, hands you a package. 'Your mother left this. She wanted you to have it when you came of age.' Inside: a compass that always points deeper into Uranus, and your father's journal of Jovian corruption.",
    location: "St. Crotum Orphanage",
    choices: [
      { text: "Read your father's journal immediately", outcome: "The entries detail systematic exploitation. Names, dates, stolen Bloot. Your blood boils with righteous fury. +1 Revolution Act", nextScene: "journal_path" },
      { text: "Follow the compass - see where it leads", outcome: "The compass tugs toward the Deep Caverns. Something is calling you from within Uranus. +1 Bloot", nextScene: "compass_path" },
      { text: "Ask Si Deresk about your parents first", outcome: "The old monk's eyes glisten. 'They died penetrating the lies of the monarchy. Their sacrifice opened many... passages.' +1 Revolution Act", nextScene: "mentor_path" }
    ]
  },

  // JOURNAL PATH
  journal_path: {
    id: "journal_path",
    scenario: "Your father's journal reveals a network of corruption deeper than anyone imagined. The Bloot extracted from Uranus enriches Jovian overlords while Uranians work themselves raw. One entry catches your eye: 'The backdoor to Oberon's palace - through the Taint.' A map is sketched in the margins.",
    location: "St. Crotum Orphanage - Your Bunk",
    choices: [
      { text: "Seek out 'The Taint' immediately", outcome: "You venture to the border region between Uranus and its moons. The passage is tight but you squeeze through. +2 Revolution Acts", nextScene: "taint_passage" },
      { text: "Share the journal with Si Deresk", outcome: "The monk nearly chokes on his porridge. 'This changes everything. We must penetrate their defenses carefully.' +1 Bloot, +1 Revolution Act", nextScene: "planning_session" },
      { text: "Keep this knowledge to yourself for now", outcome: "Trust is a luxury in Uranus. You hide the journal where the sun doesn't shine - deep in your mattress.", nextScene: "solo_path" }
    ]
  },

  // COMPASS PATH  
  compass_path: {
    id: "compass_path",
    scenario: "The compass leads you through winding tunnels, past the Myanus Bloot Mines, deeper and deeper into the warm, moist caverns of inner Uranus. Finally, you reach a hidden grotto. Ancient symbols cover the walls, and in the center sits a glowing crystal of pure, unrefined Bloot.",
    location: "The G-Spot Grotto",
    choices: [
      { text: "Touch the Bloot crystal", outcome: "Energy surges through you. You see visions of Uranus before the Jovian conquest - free and proud. You understand now what must be done. +3 Bloot", nextScene: "awakening" },
      { text: "Study the ancient symbols first", outcome: "The symbols describe 'The Great Release' - a prophecy of liberation. 'When Uranus aligns with Neptune, the passage shall open.' +2 Revolution Acts", nextScene: "prophecy_path" },
      { text: "Take the crystal and leave quickly", outcome: "Greed overcomes caution. The crystal hums with power in your pack. But you've disturbed something ancient... +2 Bloot", nextScene: "theft_consequences" }
    ]
  },

  // MENTOR PATH
  mentor_path: {
    id: "mentor_path",
    scenario: "Si Deresk leads you to the orphanage's secret basement - 'The Underground.' Here, a dozen orphans train in the old ways: chemistry, sabotage, and the forbidden arts of pleasure-based meditation that the monarchy banned. 'Your mother was our best explosive expert,' Deresk whispers. 'She could make anything blow.'",
    location: "The Underground - St. Crotum",
    choices: [
      { text: "Learn your mother's explosive techniques", outcome: "You have a natural talent for making things go off. By nightfall, you've mastered three different detonation methods. +2 Revolution Acts", nextScene: "demolition_training" },
      { text: "Study pleasure-based meditation instead", outcome: "The ancient Uranian art of extended focus through edging... your concentration. You can now sense Bloot through walls. +2 Bloot", nextScene: "meditation_path" },
      { text: "Ask to meet other resistance members", outcome: "Deresk nods. 'There's a cell in Degen-City. Their leader goes by 'The Prostate' - she knows all the sensitive spots in the monarchy.' +1 Revolution Act", nextScene: "resistance_network" }
    ]
  },

  // TAINT PASSAGE
  taint_passage: {
    id: "taint_passage",
    scenario: "The Taint is everything you feared and more - a narrow, treacherous passage between territories. Jovian patrols are everywhere, but there are... back channels. A smuggler named Rimjob offers to guide you through for a price.",
    location: "The Taint - Border Region",
    choices: [
      { text: "Pay Rimjob's fee (costs 1 Bloot)", outcome: "Rimjob knows every crevice. You emerge on the other side undetected, clothes slightly soiled but spirit intact. -1 Bloot, +2 Revolution Acts", nextScene: "oberon_outskirts" },
      { text: "Try to find your own way through", outcome: "You get lost in the folds of the passage. Hours later, you emerge... exactly where you started. Humiliating but educational.", nextScene: "taint_passage" },
      { text: "Seduce information out of the border guards", outcome: "Your natural Uranian charm works wonders. One guard, flustered, reveals the patrol schedule. You slip through during the gap. +2 Revolution Acts", nextScene: "oberon_outskirts" }
    ]
  },

  // PLANNING SESSION
  planning_session: {
    id: "planning_session",
    scenario: "Si Deresk gathers the senior resistance members in The Underground. There's Madame Perineum, the spymaster. Colonel Gooch, the strategist. And the legendary Sphincter Sisters - twin assassins who can infiltrate anywhere. They study your father's journal with great interest.",
    location: "The Underground - War Room",
    choices: [
      { text: "Propose a direct assault on the Bloot refineries", outcome: "Colonel Gooch strokes his chin. 'Bold. Foolish. I love it.' The plan is set in motion. +3 Revolution Acts", nextScene: "refinery_assault" },
      { text: "Suggest infiltrating the Golden Shower festival", outcome: "Madame Perineum grins. 'I have contacts in the entertainment industry. We could slip in through the back.' +2 Revolution Acts", nextScene: "festival_infiltration" },
      { text: "Ask the Sphincter Sisters to assassinate a key target", outcome: "The twins exchange a glance that speaks volumes. 'We know just the opening.' They disappear into the night. +2 Revolution Acts", nextScene: "assassination_plot" }
    ]
  },

  // SOLO PATH
  solo_path: {
    id: "solo_path",
    scenario: "Trusting no one, you venture into Degen-City alone. The streets pulse with neon and desperation. A brothel called 'The Pleasure Dome of Uranus' catches your eye - rumor has it, the monarchy's secrets spill there nightly.",
    location: "Degen-City - Red Light District",
    choices: [
      { text: "Enter The Pleasure Dome as a customer", outcome: "The workers here know everything. For the price of a drink, you learn about a secret Bloot shipment. +1 Bloot, +1 Revolution Act", nextScene: "pleasure_dome" },
      { text: "Apply for a job at The Pleasure Dome", outcome: "The madam looks you up and down. 'You've got that revolutionary fire in your eyes. We could use someone to... extract information.' +2 Revolution Acts", nextScene: "undercover_worker" },
      { text: "Stake out the establishment from across the street", outcome: "You watch VIPs come and go. One face matches your father's journal - Lord Frottage of Io. Interesting. +1 Revolution Act", nextScene: "surveillance" }
    ]
  },

  // AWAKENING
  awakening: {
    id: "awakening",
    scenario: "The Bloot crystal's energy has opened your third eye - or rather, your brown eye to the truth. You can now sense the interconnected web of Bloot that runs through all of Uranus. You feel every mining operation, every stolen shipment, every act of resistance. You are one with Uranus.",
    location: "The G-Spot Grotto - Transcendence Chamber",
    choices: [
      { text: "Use your new power to locate resistance cells", outcome: "You sense them - dozens of groups, working independently. If united, they could change everything. +3 Revolution Acts", nextScene: "network_vision" },
      { text: "Trace the Bloot shipments to their destination", outcome: "Jupiter. Europa. Io. You see the palaces built on Uranian suffering. The targets become clear. +2 Bloot, +1 Revolution Act", nextScene: "target_acquisition" },
      { text: "Reach out to other sensitives like yourself", outcome: "There are others who've touched the crystals. A psychic network forms. The monarchy can't monitor what they can't comprehend. +2 Revolution Acts", nextScene: "psychic_network" }
    ]
  },

  // PROPHECY PATH
  prophecy_path: {
    id: "prophecy_path",
    scenario: "The prophecy speaks of 'The Great Release' - when Uranus finally throws off its oppressors. But there's a catch: it requires 'the sacred union of five who are one.' The symbols depict five figures in... very close proximity. Ancient Uranian group meditation, apparently.",
    location: "The G-Spot Grotto - Prophecy Chamber",
    choices: [
      { text: "Seek out the other four chosen ones", outcome: "The symbols give hints: an orphan, a miner, a monk, a whore, and a noble. You're the orphan. Four to go. +2 Revolution Acts", nextScene: "gathering_chosen" },
      { text: "Try to fulfill the prophecy alone (ambitious)", outcome: "You attempt the meditative positions solo. You pull something. Some prophecies require... partners. +1 Bloot", nextScene: "injured_retreat" },
      { text: "Dismiss the prophecy as superstition", outcome: "Maybe the ancients were just really into group activities. Still, you copy the symbols for later analysis. +1 Revolution Act", nextScene: "skeptic_path" }
    ]
  },

  // THEFT CONSEQUENCES
  theft_consequences: {
    id: "theft_consequences",
    scenario: "The crystal's removal has awakened the Guardians of the Grotto - ancient automatons powered by concentrated Bloot. They're... anatomically exaggerated, as the ancients apparently had a sense of humor. And they're angry.",
    location: "The G-Spot Grotto - Guardian Chamber",
    choices: [
      { text: "Fight your way out", outcome: "You dodge swinging appendages and rolling... boulders. You escape, battered but victorious. +1 Bloot", nextScene: "narrow_escape" },
      { text: "Return the crystal and apologize", outcome: "The guardians pause. Apparently, no one's ever apologized before. They grant you safe passage and a smaller crystal as a gift. +2 Bloot", nextScene: "guardian_alliance" },
      { text: "Use your explosive knowledge to collapse the exit behind you", outcome: "BOOM. The guardians are sealed in. So is the grotto. Some bridges must burn. +2 Revolution Acts", nextScene: "scorched_earth" }
    ]
  },

  // DEMOLITION TRAINING
  demolition_training: {
    id: "demolition_training",
    scenario: "Your instructor, a scarred woman called 'Big Bang Betty,' teaches you the family recipes. 'Your mama could make a bomb out of anything - Bloot dust, mining chemicals, even fermented Blorp flowers. Called her signature move the Uranian Surprise.'",
    location: "The Underground - Demolition Lab",
    choices: [
      { text: "Master the Uranian Surprise technique", outcome: "You finally get the mixture right. The test dummy is OBLITERATED. Betty wipes away a tear of pride. +3 Revolution Acts", nextScene: "explosives_master" },
      { text: "Focus on subtle sabotage methods instead", outcome: "Sometimes the best explosion is the one that looks like an accident. You learn to make equipment 'malfunction.' +2 Revolution Acts", nextScene: "saboteur_path" },
      { text: "Ask Betty about your mother's final mission", outcome: "Betty's face darkens. 'She died trying to penetrate the Royal Shaft - the main Bloot pipeline to Jupiter. She got close... so close.' +1 Revolution Act", nextScene: "mothers_legacy" }
    ]
  },

  // MEDITATION PATH
  meditation_path: {
    id: "meditation_path",
    scenario: "Master Tantric Tingler guides you through the ancient practices. 'Breathe in through the nose, out through... well, wherever feels right. The Bloot responds to our energy. Focus on your root chakra - yes, THAT root.'",
    location: "The Underground - Meditation Chamber",
    choices: [
      { text: "Achieve deep Bloot communion", outcome: "You finally reach the state of 'Uranian Bliss.' You can now sense Bloot deposits through solid rock. The miners' union would kill for this power. +3 Bloot", nextScene: "bloot_sensor" },
      { text: "Learn the forbidden 'Extended Release' technique", outcome: "Hours of practice. Your concentration is unbreakable. You can now hold any position - physical or political - indefinitely. +2 Revolution Acts", nextScene: "endurance_master" },
      { text: "Use meditation to contact the dead", outcome: "The spirits of fallen revolutionaries speak to you. They share secrets, strategies, and a lot of dirty jokes. +2 Revolution Acts", nextScene: "spirit_contact" }
    ]
  },

  // RESISTANCE NETWORK
  resistance_network: {
    id: "resistance_network",
    scenario: "The Prostate runs her operation from a laundromat in Degen-City's seediest district. 'We've got cells everywhere,' she explains, 'but the monarchy's got us by the short hairs. We need someone to hit them where it really hurts - their supply chain.'",
    location: "Degen-City - The Clean Sheets Laundromat",
    choices: [
      { text: "Volunteer to disrupt the Bloot supply chain", outcome: "The Prostate grins. 'Finally, someone with balls. Or ovaries. Or whatever you've got. Report to the Myanus Mines.' +2 Revolution Acts", nextScene: "supply_disruption" },
      { text: "Offer to be a courier between cells", outcome: "Information is the real power. Soon you know every resistance member, every safe house, every secret handshake (and there are many). +2 Revolution Acts", nextScene: "courier_network" },
      { text: "Suggest a propaganda campaign", outcome: "'Hearts and minds?' The Prostate considers. 'We could spray-paint revolutionary slogans on the Golden Shower floats...' +1 Revolution Act", nextScene: "propaganda_war" }
    ]
  },

  // OBERON OUTSKIRTS
  oberon_outskirts: {
    id: "oberon_outskirts",
    scenario: "You've made it to Oberon, the seat of Jovian power over Uranus. The moon is covered in obscene palaces built on stolen Bloot. Guards patrol everywhere, but the servants' quarters offer... opportunities.",
    location: "Oberon - Servants' District",
    choices: [
      { text: "Infiltrate the palace as a servant", outcome: "You learn the intimate details of palace life. The Duke of Io has a foot fetish. The Countess of Europa... doesn't bear mentioning. +2 Revolution Acts", nextScene: "palace_servant" },
      { text: "Contact the underground resistance here", outcome: "Even on Oberon, Uranians resist. The cell here is small but dedicated. They know all the backdoors. +2 Revolution Acts", nextScene: "oberon_resistance" },
      { text: "Scout the Royal Shaft pipeline directly", outcome: "Your mother died here. The pipeline is heavily guarded, but you spot weaknesses. Her sacrifice wasn't in vain. +1 Bloot, +2 Revolution Acts", nextScene: "pipeline_recon" }
    ]
  },

  // REFINERY ASSAULT
  refinery_assault: {
    id: "refinery_assault",
    scenario: "D-Day. The Myanus Bloot Refinery processes 80% of Uranus's output. Your team approaches under cover of a Blorp storm. Inside, workers toil under brutal conditions. Freeing them could turn the tide, but the guards are alert.",
    location: "Myanus Bloot Refinery - Perimeter",
    choices: [
      { text: "Create a distraction and free the workers", outcome: "You trigger alarms on the far side. In the chaos, you arm the workers with mining tools. Revolution! +4 Revolution Acts", nextScene: "worker_uprising" },
      { text: "Plant explosives and evacuate secretly", outcome: "The refinery goes up in a spectacular Uranian Surprise. Bloot prices skyrocket. The monarchy bleeds. +3 Revolution Acts, +2 Bloot", nextScene: "refinery_explosion" },
      { text: "Capture the refinery intact for the resistance", outcome: "A surgical strike. By dawn, the refinery flies revolutionary colors. You now control the means of production. +5 Revolution Acts", nextScene: "captured_refinery" }
    ]
  },

  // FESTIVAL INFILTRATION
  festival_infiltration: {
    id: "festival_infiltration",
    scenario: "The Golden Shower of Uranus - the annual festival where Blorp flowers release their yellow pollen across the planet. Tourists come from across the solar system. It's beautiful, romantic, and the perfect cover for revolutionary activity.",
    location: "Blorp Forest Amphitheater - Festival Grounds",
    choices: [
      { text: "Hijack the broadcast system", outcome: "For five glorious minutes, the truth about Uranian oppression reaches billions. The monarchy scrambles to respond. +5 Revolution Acts", nextScene: "broadcast_success" },
      { text: "Assassinate a high-value target in the crowd", outcome: "Lord Frottage of Io won't be exploiting anyone else. His death sends shockwaves through the aristocracy. +3 Revolution Acts", nextScene: "festival_assassination" },
      { text: "Use the chaos to liberate a Bloot shipment", outcome: "While everyone watches the golden pollen fall, your team relieves a convoy of its precious cargo. +4 Bloot", nextScene: "heist_success" }
    ]
  },

  // PLEASURE DOME
  pleasure_dome: {
    id: "pleasure_dome",
    scenario: "Inside The Pleasure Dome, you meet Velvet, a worker with revolutionary sympathies. 'The things I hear in these rooms,' she whispers. 'Admiral Cornhole is planning a crackdown. But he's got a weakness - he likes to talk after... you know.'",
    location: "Degen-City - The Pleasure Dome VIP Lounge",
    choices: [
      { text: "Arrange a 'meeting' with Admiral Cornhole", outcome: "You gather intelligence the old-fashioned way. His pillow talk reveals troop movements and security codes. +3 Revolution Acts", nextScene: "pillow_intelligence" },
      { text: "Recruit Velvet and other workers to the cause", outcome: "The Pleasure Workers Union joins the resistance. They see and hear everything. The monarchy's secrets flow freely now. +2 Revolution Acts", nextScene: "worker_recruitment" },
      { text: "Plant listening devices throughout the establishment", outcome: "Every moan of pleasure now carries intelligence value. Your recordings are... comprehensive. +2 Revolution Acts, +1 Bloot", nextScene: "surveillance_network" }
    ]
  },

  // FINAL CONFRONTATION
  final_battle: {
    id: "final_battle",
    scenario: "The revolution has reached its climax. Across Uranus, cells rise in coordinated action. The Royal Shaft - the main pipeline draining Uranus's wealth - stands before you. Your mother died trying to reach this point. Now it's your turn to finish what she started.",
    location: "The Royal Shaft - Control Center",
    choices: [
      { text: "Destroy the pipeline entirely", outcome: "The explosion is visible from Neptune. Uranus's Bloot stays in Uranus now. The monarchy crumbles without their supply. VICTORY! +10 Revolution Acts", nextScene: "victory_destruction" },
      { text: "Seize control and redirect the flow", outcome: "The Bloot now flows to resistance strongholds. You've turned their weapon against them. The people will rebuild. VICTORY! +5 Revolution Acts, +5 Bloot", nextScene: "victory_control" },
      { text: "Negotiate from a position of strength", outcome: "With your finger on the trigger, you force recognition of Uranian autonomy. A new era begins - messy, imperfect, but free. VICTORY! +7 Revolution Acts, +3 Bloot", nextScene: "victory_diplomatic" }
    ]
  },

  // VICTORY ENDINGS
  victory_destruction: {
    id: "victory_destruction",
    scenario: "The Royal Shaft is no more. As the flames die down, Uranians emerge from their hiding places, blinking in the light of freedom. Si Deresk finds you in the rubble. 'Your parents would be proud,' he says. 'Uranus is finally free of penetration by outside forces.' The revolution has come.",
    location: "Uranus - Liberation Day",
    choices: [
      { text: "Begin a new adventure", outcome: "The fight for freedom never truly ends. But today, Uranus celebrates. +5 Revolution Acts", nextScene: "start" }
    ]
  },

  victory_control: {
    id: "victory_control",
    scenario: "The Bloot flows for the people now. You've established the Uranian People's Cooperative, democratically controlling the planet's greatest resource. The monarchy flees to Europa. Madame Perineum becomes the first elected leader. 'We did it,' she says, tears streaming. 'We finally told them to kiss our collective...'",
    location: "Uranus - New Government Hall",
    choices: [
      { text: "Begin a new adventure", outcome: "A new chapter begins for Uranus. What will you do with your freedom? +5 Bloot", nextScene: "start" }
    ]
  },

  victory_diplomatic: {
    id: "victory_diplomatic",
    scenario: "The Treaty of The Taint establishes Uranian sovereignty. Not everyone is happy - some wanted total destruction, others wanted more. But peace, imperfect peace, is achieved. You're offered a position in the new government: Minister of Internal Affairs.",
    location: "The Taint - Treaty Signing",
    choices: [
      { text: "Begin a new adventure", outcome: "Politics is just revolution by other means. The work continues. +3 Revolution Acts, +3 Bloot", nextScene: "start" }
    ]
  }
};

// Random encounter pool for variety
const randomEncounters: Scene[] = [
  {
    id: "random_patrol",
    scenario: "An Ionian dragoon patrol spots you on the street. Their leader, a brutish woman called 'The Clench,' demands your papers.",
    location: "Degen-City Streets",
    choices: [
      { text: "Produce forged documents", outcome: "The forgery holds. The Clench waves you through, though she gives you a look that says she'll remember your face. +1 Revolution Act", nextScene: "continue" },
      { text: "Run through the back alleys", outcome: "You know these passages intimately. The patrol loses you in the twisting corridors. +1 Bloot", nextScene: "continue" },
      { text: "Fight your way through", outcome: "Bold and stupid. You take down two guards but catch a stun bolt. You wake in a cell. -1 Bloot", nextScene: "prison_break" }
    ]
  },
  {
    id: "random_informant",
    scenario: "A street urchin tugs at your sleeve. 'I know things,' she whispers. 'Things about the Sphincter Gate shipments. Things worth Bloot.'",
    location: "Degen-City - Market Square",
    choices: [
      { text: "Pay for the information", outcome: "The child reveals a hidden route used by smugglers. This could be useful. +2 Revolution Acts", nextScene: "continue" },
      { text: "Recruit her to the resistance", outcome: "She's young but resourceful. 'Call me Trickle,' she says. 'I can get anywhere.' +1 Revolution Act", nextScene: "continue" },
      { text: "Ignore her - it could be a trap", outcome: "Caution serves you well. You spot monarchy agents watching from across the square. You slip away uncompromised.", nextScene: "continue" }
    ]
  },
  {
    id: "random_accident",
    scenario: "A Bloot transport crashes near you, spilling raw crystal everywhere. Workers scramble to clean it up while guards struggle to maintain order. Chaos reigns.",
    location: "Myanus Mining District",
    choices: [
      { text: "Grab as much Bloot as you can carry", outcome: "In the confusion, you stuff your pockets. A small fortune in raw Bloot is now yours. +3 Bloot", nextScene: "continue" },
      { text: "Help the injured workers", outcome: "Your kindness doesn't go unnoticed. One worker slips you a card: 'Join us. The Fissure Collective.' +2 Revolution Acts", nextScene: "continue" },
      { text: "Use the distraction to sabotage other transports", outcome: "While everyone focuses on the crash, you disable three more vehicles. The supply chain hiccups. +2 Revolution Acts", nextScene: "continue" }
    ]
  },
  {
    id: "random_romance",
    scenario: "At a resistance safe house, you meet another revolutionary. There's... tension. The good kind. They go by 'Backdoor Blake' - an infiltration specialist with a knowing smile.",
    location: "Safe House 69 - Common Room",
    choices: [
      { text: "Focus on the mission (boring but practical)", outcome: "You maintain professional distance. Blake respects this. You work well together. +1 Revolution Act", nextScene: "continue" },
      { text: "Explore the connection (what's revolution without passion?)", outcome: "The night is revolutionary in more ways than one. In the morning, you're closer than ever - in cause and otherwise. +2 Revolution Acts", nextScene: "continue" },
      { text: "Suggest combining pleasure with business", outcome: "You infiltrate a noble's party together, posing as a couple. Your chemistry sells the cover. Intel acquired. +2 Revolution Acts, +1 Bloot", nextScene: "continue" }
    ]
  },
  {
    id: "random_ritual",
    scenario: "You stumble upon an ancient Uranian fertility ritual in progress. The participants wear nothing but Bloot dust and expressions of intense concentration. A priest beckons you to join.",
    location: "Hidden Temple of Release",
    choices: [
      { text: "Participate in the ritual", outcome: "The experience is... transcendent. You emerge with enhanced Bloot sensitivity and a very relaxed disposition. +2 Bloot", nextScene: "continue" },
      { text: "Observe respectfully from a distance", outcome: "You learn the ancient chants and positions. Knowledge is power, especially THIS knowledge. +1 Revolution Act", nextScene: "continue" },
      { text: "Politely decline and leave", outcome: "Not everyone's ready for ancient Uranian practices. The priest understands. 'When you're ready, we'll be here.'", nextScene: "continue" }
    ]
  }
];

export function SlyDoubtGame() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [gameState, setGameState] = useState<GameState>({ bloot_collected: 0, revolution_acts: 0 });
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [storyProgress, setStoryProgress] = useState<string[]>([]);
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
      .from('sly_doubt_game_state')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newState } = await supabase
        .from('sly_doubt_game_state')
        .insert({ 
          user_id: user.id, 
          bloot_collected: 0, 
          revolution_acts: 0 
        })
        .select()
        .single();
      
      if (newState) {
        setGameState({ 
          bloot_collected: newState.bloot_collected, 
          revolution_acts: newState.revolution_acts 
        });
      }
    } else if (data) {
      setGameState({ 
        bloot_collected: data.bloot_collected, 
        revolution_acts: data.revolution_acts 
      });
    }
  };

  const startGame = () => {
    setCurrentScene(scenes.start);
    setOutcome(null);
    setStoryProgress(["start"]);
    
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
    if (!currentScene) return;
    
    const choice = currentScene.choices[choiceIndex];
    setOutcome(choice.outcome);
    
    // Parse rewards from outcome text
    const blootMatch = choice.outcome.match(/\+(\d+) Bloot/);
    const actMatch = choice.outcome.match(/\+(\d+) Revolution Act/);
    const blootLoss = choice.outcome.match(/-(\d+) Bloot/);
    
    let blootGain = blootMatch ? parseInt(blootMatch[1]) : 0;
    let actGain = actMatch ? parseInt(actMatch[1]) : 0;
    if (blootLoss) blootGain -= parseInt(blootLoss[1]);
    
    const newBloot = Math.max(0, gameState.bloot_collected + blootGain);
    const newActs = gameState.revolution_acts + actGain;
    
    setGameState({ bloot_collected: newBloot, revolution_acts: newActs });
    
    // Save to database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('sly_doubt_game_state')
        .upsert({ 
          user_id: user.id, 
          bloot_collected: newBloot, 
          revolution_acts: newActs,
          updated_at: new Date().toISOString()
        });
    }

    // Track story progress
    if (choice.nextScene) {
      setStoryProgress(prev => [...prev, choice.nextScene!]);
    }
  };

  const continueStory = () => {
    if (!currentScene) return;
    
    const lastChoice = currentScene.choices.find(c => outcome?.includes(c.outcome.substring(0, 20)));
    let nextSceneId = lastChoice?.nextScene;

    // Handle special cases
    if (nextSceneId === "continue" || !nextSceneId) {
      // Random encounter or continue main story
      if (Math.random() < 0.3 && storyProgress.length > 2) {
        const randomEncounter = randomEncounters[Math.floor(Math.random() * randomEncounters.length)];
        setCurrentScene(randomEncounter);
      } else if (gameState.revolution_acts >= 15) {
        // Enough acts to trigger final battle
        setCurrentScene(scenes.final_battle);
      } else {
        // Pick a random main scene we haven't visited
        const unvisited = Object.keys(scenes).filter(id => 
          !storyProgress.includes(id) && 
          id !== "start" && 
          !id.startsWith("victory")
        );
        if (unvisited.length > 0) {
          const nextId = unvisited[Math.floor(Math.random() * unvisited.length)];
          setCurrentScene(scenes[nextId]);
        } else {
          setCurrentScene(scenes.final_battle);
        }
      }
    } else if (scenes[nextSceneId]) {
      setCurrentScene(scenes[nextSceneId]);
    } else {
      // Fallback to random scene
      const sceneKeys = Object.keys(scenes).filter(k => !k.startsWith("victory") && k !== "start");
      const randomKey = sceneKeys[Math.floor(Math.random() * sceneKeys.length)];
      setCurrentScene(scenes[randomKey]);
    }
    
    setOutcome(null);
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

  const resetGame = () => {
    setCurrentScene(null);
    setOutcome(null);
    setStoryProgress([]);
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
            A revolutionary tale of resistance, rebellion, and really unfortunate place names
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
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Sly Doubt of Uranus
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              A choose-your-own-adventure through the back passages of revolution
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
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
        {!currentScene && !outcome && (
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <p className="text-foreground mb-4">
                The year is 2847. The Jovian monarchy has occupied Uranus for three centuries, extracting its precious Bloot 
                to fuel their decadent empire. You are an orphan raised in St. Crotum Orphanage, taught the old ways by 
                the rebel monk Si Deresk. Your parents died fighting the oppressors - your father exposed in his journal 
                the corruption that runs deep inside Uranus, and your mother... well, she knew how to make things explode.
              </p>
              <p className="text-foreground mb-4">
                Now it is your turn to penetrate the mysteries of your homeland and thrust Uranus toward freedom. 
                The resistance needs you. The people need you. Will you answer the call?
              </p>
              <p className="text-muted-foreground text-sm italic">
                Collect Bloot to fund the revolution. Perform Revolution Acts to build momentum. 
                Reach 15 Revolution Acts to unlock the final confrontation.
              </p>
            </div>
            <Button onClick={startGame} size="lg" variant="mystical" className="w-full">
              Begin Your Journey Into Uranus
            </Button>
          </div>
        )}

        {currentScene && !outcome && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-xs">
                {currentScene.location}
              </Badge>
              <div className="flex gap-2">
                {gameState.revolution_acts >= 12 && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    Final Battle Approaches!
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <p className="text-foreground whitespace-pre-line">{currentScene.scenario}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">What do you do?</p>
              {currentScene.choices.map((choice, index) => (
                <Button
                  key={index}
                  onClick={() => makeChoice(index)}
                  variant="outline"
                  className="w-full text-left justify-start h-auto py-3 px-4 hover:bg-primary/10 hover:border-primary whitespace-normal"
                >
                  <span className="font-bold mr-2">{index + 1}.</span>
                  {choice.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {outcome && (
          <div className="space-y-4">
            <Badge variant="outline" className="text-xs">
              {currentScene?.location}
            </Badge>
            <div className="bg-accent/10 border border-accent p-4 rounded-lg">
              <p className="text-foreground">{outcome}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={resetGame} variant="outline" className="flex-1">
                Return to Menu
              </Button>
              <Button onClick={continueStory} variant="default" className="flex-1">
                Continue Adventure
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
