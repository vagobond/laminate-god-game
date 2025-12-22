import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Backpack, Flame, Home, UtensilsCrossed, DollarSign, Heart, Map, Thermometer } from "lucide-react";

interface GameState {
  day: number;
  location: string;
  health: number;
  morale: number;
  cash: number;
  warmth: number;
  hunger: number;
  skills: {
    tarpetecture: number;
    foraging: number;
    hustling: number;
    socializing: number;
    survival: number;
  };
  inventory: string[];
  currentScene: string;
  journeyProgress: number;
  destination: string;
}

interface Choice {
  text: string;
  outcome: () => void;
  skillRequired?: { skill: keyof GameState['skills']; level: number };
}

interface Scene {
  title: string;
  description: string;
  lesson?: string;
  choices: Choice[];
}

const DESTINATIONS = ["Hawaii", "Key West", "San Diego", "New Orleans", "Austin"];

const STARTING_INVENTORY = ["Swiss Army Knife", "Lighter", "Wool Blanket"];

export function RoughLivingGame() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    day: 1,
    location: "Portland, Oregon",
    health: 100,
    morale: 75,
    cash: 4.86,
    warmth: 50,
    hunger: 50,
    skills: {
      tarpetecture: 0,
      foraging: 0,
      hustling: 0,
      socializing: 0,
      survival: 0,
    },
    inventory: [...STARTING_INVENTORY],
    currentScene: "intro",
    journeyProgress: 0,
    destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const updateState = (updates: Partial<GameState>) => {
    setGameState(prev => {
      const newState = { ...prev, ...updates };
      
      // Check for game over conditions
      if (newState.health <= 0) {
        setGameOver(true);
        toast.error("Your health has failed. The road has claimed another soul.");
      } else if (newState.morale <= 0) {
        setGameOver(true);
        toast.error("You've lost the will to continue. Sometimes the ant life calls you back.");
      } else if (newState.hunger >= 100) {
        setGameOver(true);
        toast.error("Starvation has overtaken you. Should've hit that dumpster behind Trader Joe's.");
      } else if (newState.warmth <= 0) {
        setGameOver(true);
        toast.error("The cold has taken you. A wool blanket could have saved your life.");
      }
      
      // Check for victory
      if (newState.journeyProgress >= 100) {
        setGameWon(true);
        toast.success(`You made it to ${newState.destination}! You're living like a prince now.`);
      }
      
      return newState;
    });
  };

  const addItem = (item: string) => {
    if (!gameState.inventory.includes(item)) {
      updateState({ inventory: [...gameState.inventory, item] });
      toast.success(`Acquired: ${item}`);
    }
  };

  const removeItem = (item: string) => {
    updateState({ inventory: gameState.inventory.filter(i => i !== item) });
  };

  const hasItem = (item: string) => gameState.inventory.includes(item);

  const increaseSkill = (skill: keyof GameState['skills'], amount: number = 1) => {
    updateState({
      skills: {
        ...gameState.skills,
        [skill]: Math.min(gameState.skills[skill] + amount, 10),
      },
    });
    toast.success(`${skill.charAt(0).toUpperCase() + skill.slice(1)} skill increased!`);
  };

  const advanceDay = () => {
    const warmthLoss = gameState.location.includes("Oregon") ? 15 : 5;
    const hungerIncrease = 20;
    
    updateState({
      day: gameState.day + 1,
      warmth: Math.max(0, gameState.warmth - warmthLoss + (hasItem("Wool Blanket") ? 10 : 0)),
      hunger: Math.min(100, gameState.hunger + hungerIncrease),
      journeyProgress: Math.min(100, gameState.journeyProgress + 8 + Math.floor(Math.random() * 5)),
    });
  };

  const scenes: Record<string, Scene> = {
    intro: {
      title: "The Call of the Road",
      description: `You wake up in a park in Portland, Oregon. The mist drifts through the trees like something out of a novel. You have $${gameState.cash.toFixed(2)} in your pocket, a Swiss Army knife, a lighter, and a wool blanket. Your destination: ${gameState.destination}.\n\nAs CD Damitio wrote: "The call of the road is irresistible. I am seduced by the desire to see what lies beyond the bend."\n\nYou're a grasshopper in an ant's world. Time to learn the art of rough living.`,
      lesson: "LESSON: The Three A's - Abilities (what you can do), Accumulations (your stuff), and Access (who you know and where you can go). These are your tools for survival.",
      choices: [
        {
          text: "Head to the public library to plan your route",
          outcome: () => {
            updateState({ currentScene: "library" });
            increaseSkill("survival");
          },
        },
        {
          text: "Look for breakfast - you're hungry",
          outcome: () => updateState({ currentScene: "breakfast_hunt" }),
        },
        {
          text: "Find a good spot to set up camp for another night",
          outcome: () => updateState({ currentScene: "camp_search" }),
        },
      ],
    },
    
    library: {
      title: "The Public Library",
      description: "The library is warm and dry - a vagabond's sanctuary. Free internet, free books, free bathrooms. You find a computer and start researching your route.\n\nYou notice a sign: 'Free Japanese Language Classes - Tuesdays at 2pm'. Learning something new keeps the mind sharp on the road.",
      lesson: "LESSON: Libraries give you ACCESS - internet, warmth, bathrooms, and knowledge. A library card is one of the most valuable things a vagabond can have.",
      choices: [
        {
          text: "Post a rideshare offer on Craigslist ($5 per passenger)",
          outcome: () => {
            updateState({ currentScene: "rideshare_hustle", cash: gameState.cash + 15 });
            increaseSkill("hustling");
            toast.success("Found 3 passengers! +$15");
          },
        },
        {
          text: "Research free food resources in the area",
          outcome: () => {
            updateState({ currentScene: "food_research" });
            increaseSkill("foraging");
          },
        },
        {
          text: "Study a map and plan your hitchhiking route",
          outcome: () => {
            updateState({ currentScene: "route_planning", journeyProgress: gameState.journeyProgress + 5 });
            increaseSkill("survival");
          },
        },
      ],
    },

    breakfast_hunt: {
      title: "The Hunt for Grinds",
      description: "Your stomach growls. Time to find breakfast. You remember the four ways to get what you want: Buy it, Make it, Ask for it, or Take it.\n\nYou spot a Burger King across the street. Those scratch-off game pieces on fry cartons often go unclaimed...",
      lesson: "LESSON: Four ways to get what you want - BUYING, MAKING, ASKING, and TAKING. The creative vagabond combines all four.",
      choices: [
        {
          text: "Check the trash for unclaimed scratch-off winners",
          outcome: () => {
            if (Math.random() > 0.3) {
              updateState({ currentScene: "scratch_win", hunger: Math.max(0, gameState.hunger - 30) });
              toast.success("Free French toast sticks! The scratch-off was a winner!");
              increaseSkill("foraging");
            } else {
              updateState({ currentScene: "scratch_fail" });
              toast.error("Nothing but losing tickets today.");
            }
          },
        },
        {
          text: "Spend $2 on coffee and a value menu item",
          outcome: () => {
            if (gameState.cash >= 2) {
              updateState({ 
                currentScene: "bought_breakfast", 
                cash: gameState.cash - 2,
                hunger: Math.max(0, gameState.hunger - 40),
              });
            } else {
              toast.error("Not enough cash!");
            }
          },
        },
        {
          text: "Ask someone leaving if they have any food they won't finish",
          outcome: () => {
            if (Math.random() > 0.5 || gameState.skills.socializing >= 3) {
              updateState({ currentScene: "asked_food", hunger: Math.max(0, gameState.hunger - 25) });
              increaseSkill("socializing");
              toast.success("A kind soul shares their extra hash browns!");
            } else {
              updateState({ currentScene: "asked_rejected", morale: gameState.morale - 5 });
              toast.error("No luck. Don't take it personally.");
            }
          },
        },
      ],
    },

    camp_search: {
      title: "Finding Shelter",
      description: "The art of 'Tarpetecture' - that's what vagabonds call the science of shelter building. You need to find a spot that's:\n\n1. Hidden from cops and security\n2. Protected from wind and rain\n3. Close enough to resources\n4. Not someone else's spot\n\nYou scout three potential locations.",
      lesson: "LESSON: Never set up camp before dark, and leave before dawn. Blend in. The best campsite is one nobody knows exists.",
      choices: [
        {
          text: "Under the bridge by the river (trolls welcome)",
          outcome: () => {
            updateState({ currentScene: "bridge_camp", warmth: gameState.warmth + 20 });
            increaseSkill("tarpetecture");
          },
        },
        {
          text: "Behind the grocery store (close to food... and dumpsters)",
          outcome: () => {
            updateState({ currentScene: "grocery_camp" });
            increaseSkill("foraging");
          },
        },
        {
          text: "In the park, deep in the trees",
          outcome: () => {
            if (hasItem("6x6 Tarp")) {
              updateState({ currentScene: "park_camp_good", warmth: gameState.warmth + 30 });
              increaseSkill("tarpetecture", 2);
            } else {
              updateState({ currentScene: "park_camp_bad", warmth: gameState.warmth + 10 });
            }
          },
        },
      ],
    },

    bridge_camp: {
      title: "Trolls Under Bridges",
      description: "You set up under the bridge. It's dry and blocked from the wind. You meet another traveler named Railroad Mike who's been on the road for 20 years.\n\n'First rule of rough living,' he says, 'is respect. Respect other people's spots. Respect yourself enough to stay clean. And respect the road - she'll kill you if you don't.'\n\nHe offers to show you how to set up a proper tarp shelter.",
      lesson: "LESSON: The 'people of the fire' - fellow travelers - are your community. Learn from them, share with them, but watch out for the 'jackrollers' who'll rob you while you sleep.",
      choices: [
        {
          text: "Learn tarpetecture from Railroad Mike",
          outcome: () => {
            addItem("6x6 Tarp");
            increaseSkill("tarpetecture", 2);
            updateState({ currentScene: "learned_tarp" });
          },
        },
        {
          text: "Share some food and stories",
          outcome: () => {
            updateState({ 
              currentScene: "shared_stories", 
              morale: gameState.morale + 15,
              hunger: gameState.hunger + 10,
            });
            increaseSkill("socializing", 2);
          },
        },
        {
          text: "Keep to yourself and rest",
          outcome: () => {
            updateState({ currentScene: "solo_rest", health: Math.min(100, gameState.health + 10) });
            advanceDay();
          },
        },
      ],
    },

    grocery_camp: {
      title: "Dumpster Diving 101",
      description: "Behind the grocery store, you discover a treasure trove. Perfectly good food thrown away just because the sell-by date is tomorrow. Bruised apples, day-old bread, dented cans.\n\n'They throw away $90,000 worth of perfectly good stuff at the end of every fiscal year,' you remember reading. 'What's junk to corporations is gold to grasshoppers.'",
      lesson: "LESSON: Grocery stores throw away massive amounts of edible food daily. The back of a grocery store is a vagabond's buffet - just be discreet and respectful.",
      choices: [
        {
          text: "Carefully select the best items",
          outcome: () => {
            updateState({ 
              currentScene: "dumpster_success", 
              hunger: Math.max(0, gameState.hunger - 50),
            });
            addItem("Salvaged Food Stash");
            increaseSkill("foraging", 2);
          },
        },
        {
          text: "Talk to the employee taking out trash",
          outcome: () => {
            if (Math.random() > 0.4 || gameState.skills.socializing >= 2) {
              updateState({ currentScene: "employee_friend" });
              increaseSkill("socializing");
              addItem("Employee Hookup");
              toast.success("He says to come by at closing - he'll set aside the good stuff!");
            } else {
              updateState({ currentScene: "employee_hostile", morale: gameState.morale - 10 });
              toast.error("He threatens to call the cops. Time to move on.");
            }
          },
        },
        {
          text: "Look for recyclables to sell",
          outcome: () => {
            const earnings = 2 + Math.floor(Math.random() * 5);
            updateState({ currentScene: "recycling", cash: gameState.cash + earnings });
            increaseSkill("hustling");
            toast.success(`Found $${earnings} worth of recyclables!`);
          },
        },
      ],
    },

    park_camp_good: {
      title: "Tarpetecture Success",
      description: "With your tarp, you create a perfect shelter - a lean-to against a fallen log, positioned to catch morning sun and block the prevailing wind. You're invisible from the trail.\n\nAs you settle in, you feel something you haven't felt in a while: pride. You made this with your own hands, your own knowledge. No landlord, no rent, no mortgage. Just you and the earth.",
      choices: [
        {
          text: "Rest well and prepare for tomorrow's journey",
          outcome: () => {
            updateState({ 
              currentScene: "next_day", 
              health: Math.min(100, gameState.health + 15),
              warmth: Math.min(100, gameState.warmth + 20),
            });
            advanceDay();
          },
        },
        {
          text: "Stay up and make a small fire (risky but warm)",
          outcome: () => {
            if (hasItem("Lighter") && Math.random() > 0.3) {
              updateState({ 
                currentScene: "fire_success", 
                warmth: 100,
                morale: gameState.morale + 10,
              });
              increaseSkill("survival");
            } else {
              updateState({ currentScene: "fire_attention", morale: gameState.morale - 20 });
              toast.error("The fire attracted attention. A ranger tells you to move.");
            }
          },
        },
      ],
    },

    park_camp_bad: {
      title: "Cold Night",
      description: "Without a tarp, you're exposed to the elements. You huddle under your wool blanket but the ground is cold and damp. It's going to be a long night.\n\nYou remember: 'A six-foot by six-foot tarp will keep you dry anywhere. It folds up small and has a thousand functions.'",
      lesson: "LESSON: A tarp is essential gear. Combined with a blanket, you can survive almost anywhere. Without it, you're at nature's mercy.",
      choices: [
        {
          text: "Tough it out - you'll get a tarp tomorrow",
          outcome: () => {
            updateState({ 
              currentScene: "cold_morning", 
              health: gameState.health - 15,
              warmth: gameState.warmth - 20,
            });
            advanceDay();
          },
        },
        {
          text: "Find cardboard to insulate from the ground",
          outcome: () => {
            updateState({ 
              currentScene: "cardboard_save", 
              warmth: gameState.warmth + 15,
            });
            increaseSkill("survival");
            advanceDay();
          },
        },
      ],
    },

    rideshare_hustle: {
      title: "The Hustle Pays Off",
      description: "Your Craigslist post worked! Three college students needed a ride across town and gladly paid $5 each. That's $15 for an hour of driving.\n\n'Use your abilities, accumulations, and access to get what you desire.' You used your ability to drive, your accumulation (the car), and your access to the internet.",
      choices: [
        {
          text: "Post another rideshare for tomorrow",
          outcome: () => {
            updateState({ currentScene: "double_hustle" });
            increaseSkill("hustling");
          },
        },
        {
          text: "Use the cash for supplies",
          outcome: () => updateState({ currentScene: "supply_run" }),
        },
        {
          text: "Save the money and hit the road",
          outcome: () => {
            advanceDay();
            updateState({ currentScene: "on_the_road" });
          },
        },
      ],
    },

    supply_run: {
      title: "Gathering Supplies",
      description: "You head to the Salvation Army thrift store. Everything you need for rough living can be found secondhand for a fraction of retail.\n\nYou scan the shelves: tarps, blankets, camp stoves, cookware, even a tennis racket for $3 (hey, you need entertainment too).",
      lesson: "LESSON: Thrift stores are the vagabond's outfitter. Don't pay retail when someone else's 'junk' is your treasure.",
      choices: [
        {
          text: "Buy a 6x6 Tarp ($3)",
          outcome: () => {
            if (gameState.cash >= 3) {
              addItem("6x6 Tarp");
              updateState({ currentScene: "got_tarp", cash: gameState.cash - 3 });
              increaseSkill("survival");
            } else {
              toast.error("Not enough cash!");
            }
          },
        },
        {
          text: "Buy a Camp Stove ($5)",
          outcome: () => {
            if (gameState.cash >= 5) {
              addItem("Camp Stove");
              updateState({ currentScene: "got_stove", cash: gameState.cash - 5 });
            } else {
              toast.error("Not enough cash!");
            }
          },
        },
        {
          text: "Buy a Possibles Bag ($2) - contains useful small items",
          outcome: () => {
            if (gameState.cash >= 2) {
              addItem("Possibles Bag");
              updateState({ currentScene: "got_possibles", cash: gameState.cash - 2 });
              increaseSkill("survival");
            } else {
              toast.error("Not enough cash!");
            }
          },
        },
      ],
    },

    on_the_road: {
      title: "Hitching South",
      description: `Day ${gameState.day}: You're ${gameState.journeyProgress}% of the way to ${gameState.destination}. The call of the road grows stronger.\n\nYou stand at an on-ramp with your thumb out. A trucker slows down...\n\n'Where you headed?'\n'${gameState.destination}'\n'I can get you as far as Sacramento.'`,
      choices: [
        {
          text: "Accept the ride gratefully",
          outcome: () => {
            const progress = 15 + Math.floor(Math.random() * 10);
            updateState({ 
              currentScene: "trucker_ride",
              journeyProgress: Math.min(100, gameState.journeyProgress + progress),
              morale: gameState.morale + 10,
            });
            advanceDay();
          },
        },
        {
          text: "Ask if he knows any good spots along the way",
          outcome: () => {
            updateState({ currentScene: "trucker_tips" });
            increaseSkill("socializing");
          },
        },
        {
          text: "Decline and wait for a better ride going further",
          outcome: () => {
            if (Math.random() > 0.5) {
              updateState({ 
                currentScene: "better_ride",
                journeyProgress: Math.min(100, gameState.journeyProgress + 30),
              });
              toast.success("A couple heading all the way to LA picks you up!");
            } else {
              updateState({ 
                currentScene: "no_ride",
                morale: gameState.morale - 10,
                warmth: gameState.warmth - 10,
              });
              toast.error("Hours pass. No one else stops. Should've taken that ride.");
              advanceDay();
            }
          },
        },
      ],
    },

    trucker_ride: {
      title: "Road Wisdom",
      description: `The trucker's name is Earl. He's been driving cross-country for 30 years. 'I pick up hitchers sometimes. Most of 'em got stories worth hearing.'\n\nHe tells you about truck stops with free showers if you know how to ask, rest areas where you can sleep undisturbed, and diners where the waitresses will give you extra bread if you're polite.\n\nProgress: ${gameState.journeyProgress}%`,
      lesson: "LESSON: 'Access is probably the most important thing you can have in our society.' The right people open doors that money can't buy.",
      choices: [
        {
          text: "Ask about work opportunities along the route",
          outcome: () => {
            addItem("Day Labor Contacts");
            updateState({ currentScene: "work_contacts" });
            increaseSkill("hustling");
          },
        },
        {
          text: "Share your own story",
          outcome: () => {
            updateState({ 
              currentScene: "shared_story",
              morale: gameState.morale + 15,
            });
            increaseSkill("socializing");
          },
        },
        {
          text: "Rest while you can",
          outcome: () => {
            updateState({ 
              currentScene: "truck_rest",
              health: Math.min(100, gameState.health + 20),
            });
          },
        },
      ],
    },

    food_research: {
      title: "The Food Web",
      description: "Your research reveals a network of free food:\n\n• Food banks (most don't require ID)\n• Sikh temples (free meals for anyone, no questions)\n• Church soup kitchens (usually lunch)\n• Hare Krishna temples (vegetarian but filling)\n• Day-old bread from bakeries (just ask)\n• Reduced-price meat sections (after 7 PM)\n\nYou map out the nearest options.",
      lesson: "LESSON: 'You can get a steak dinner three different ways with what you have.' The vagabond who knows where to look never goes hungry.",
      choices: [
        {
          text: "Visit the Sikh temple",
          outcome: () => {
            updateState({ 
              currentScene: "sikh_temple",
              hunger: 0,
              morale: gameState.morale + 20,
            });
            increaseSkill("socializing");
          },
        },
        {
          text: "Check the reduced-price section at the grocery store",
          outcome: () => {
            updateState({ currentScene: "reduced_price" });
            increaseSkill("foraging");
          },
        },
        {
          text: "Ask at a bakery for day-old bread",
          outcome: () => {
            if (Math.random() > 0.3 || gameState.skills.socializing >= 2) {
              updateState({ 
                currentScene: "bakery_success",
                hunger: Math.max(0, gameState.hunger - 30),
              });
              increaseSkill("socializing");
            } else {
              updateState({ currentScene: "bakery_fail" });
            }
          },
        },
      ],
    },

    sikh_temple: {
      title: "Langar - The Free Kitchen",
      description: "The Sikh temple's 'langar' feeds anyone who comes, regardless of faith, wealth, or status. You sit on the floor with doctors, laborers, families, and fellow travelers.\n\nThe food is simple but abundant: dal, rice, chapati, vegetables. Everyone eats the same food, sits at the same level. There's a lesson here.\n\n'We are all equal before God and each other,' a volunteer explains.",
      lesson: "LESSON: Some of the best things in life truly are free. Humility opens doors that pride keeps closed.",
      choices: [
        {
          text: "Volunteer to help wash dishes",
          outcome: () => {
            updateState({ currentScene: "temple_volunteer", morale: gameState.morale + 25 });
            increaseSkill("socializing", 2);
            addItem("Temple Contact");
          },
        },
        {
          text: "Thank them and continue your journey",
          outcome: () => {
            advanceDay();
            updateState({ currentScene: "on_the_road" });
          },
        },
      ],
    },

    // More scenes for variety...
    scratch_win: {
      title: "Breakfast is Served",
      description: "The scratch-off was a winner! Free French toast sticks. You also found an abandoned coffee with only a few sips taken. Living like a prince for $0.",
      choices: [
        {
          text: "Head to the library to plan your day",
          outcome: () => updateState({ currentScene: "library" }),
        },
        {
          text: "Scout for a good campsite",
          outcome: () => updateState({ currentScene: "camp_search" }),
        },
      ],
    },

    scratch_fail: {
      title: "Empty Handed",
      description: "No winners today. Your stomach growls louder. Time for plan B.",
      choices: [
        {
          text: "Check the dumpster behind the restaurant",
          outcome: () => updateState({ currentScene: "dumpster_dive" }),
        },
        {
          text: "Ask someone for spare change",
          outcome: () => {
            if (Math.random() > 0.6) {
              updateState({ cash: gameState.cash + 2 });
              toast.success("A kind soul gives you $2");
            }
            updateState({ currentScene: "spanging_result" });
          },
        },
      ],
    },

    dumpster_dive: {
      title: "Behind the Restaurant",
      description: "Dumpster diving is an art. You look for bags that were just thrown out (less spoiled), avoid anything with meat unless it's cold out, and always close the dumpster after.\n\nToday's haul: half a burrito, some fries, and an untouched salad someone apparently didn't want.",
      choices: [
        {
          text: "Eat up and continue",
          outcome: () => {
            updateState({ 
              hunger: Math.max(0, gameState.hunger - 40),
              currentScene: "fed_and_ready",
            });
            increaseSkill("foraging");
          },
        },
      ],
    },

    learned_tarp: {
      title: "Tarpetecture Mastery",
      description: "Railroad Mike shows you five different configurations:\n\n1. The A-Frame: Classic, sheds rain well\n2. The Lean-To: Easy, one-sided protection\n3. The Tube: Wrap around for maximum warmth\n4. The Diamond: Good in light rain\n5. The Basha: British military style, very versatile\n\n'A tarp and some cord,' Mike says, 'and you've got a home anywhere in the world.'",
      choices: [
        {
          text: "Practice setting up until you've got it",
          outcome: () => {
            increaseSkill("tarpetecture");
            updateState({ currentScene: "tarp_master" });
          },
        },
        {
          text: "Thank Mike and rest for the night",
          outcome: () => {
            advanceDay();
            updateState({ currentScene: "next_day" });
          },
        },
      ],
    },

    next_day: {
      title: `Day ${gameState.day + 1} - A New Dawn`,
      description: `You wake with the sun. ${gameState.journeyProgress}% of the way to ${gameState.destination}.\n\nHealth: ${gameState.health}% | Morale: ${gameState.morale}% | Cash: $${gameState.cash.toFixed(2)}\n\nThe road calls. What's your move?`,
      choices: [
        {
          text: "Hit the road - time to make progress",
          outcome: () => updateState({ currentScene: "on_the_road" }),
        },
        {
          text: "Find work - need to build up some cash",
          outcome: () => updateState({ currentScene: "work_hunt" }),
        },
        {
          text: "Take care of yourself - rest and eat",
          outcome: () => updateState({ currentScene: "self_care" }),
        },
      ],
    },

    work_hunt: {
      title: "Coming Up with Jack",
      description: "Money doesn't grow on trees, but opportunities are everywhere if you know how to look:\n\n• Day labor (tough but pays same day)\n• Busking (if you have a talent)\n• Selling found items (recyclables, scrap)\n• Odd jobs (signs at hardware stores)\n• Blood/plasma donation ($20-50)\n\nWhat's your hustle?",
      lesson: "LESSON: 'Your abilities are what you can do.' Never say you can't find work - say you haven't found the right opportunity yet.",
      choices: [
        {
          text: "Head to the day labor office",
          outcome: () => {
            const pay = 40 + Math.floor(Math.random() * 30);
            updateState({ 
              currentScene: "day_labor",
              cash: gameState.cash + pay,
              health: gameState.health - 10,
              hunger: gameState.hunger + 20,
            });
            increaseSkill("hustling");
            toast.success(`Hard day's work: $${pay}`);
            advanceDay();
          },
        },
        {
          text: "Collect recyclables",
          outcome: () => {
            const pay = 5 + Math.floor(Math.random() * 10);
            updateState({ 
              currentScene: "recycling",
              cash: gameState.cash + pay,
            });
            increaseSkill("foraging");
            toast.success(`Recyclables: $${pay}`);
          },
        },
        {
          text: "Offer to help someone carry groceries",
          outcome: () => {
            if (Math.random() > 0.4) {
              const tip = 2 + Math.floor(Math.random() * 8);
              updateState({ cash: gameState.cash + tip, currentScene: "grocery_help" });
              toast.success(`Tip: $${tip}`);
            } else {
              updateState({ currentScene: "no_takers" });
            }
            increaseSkill("socializing");
          },
        },
      ],
    },

    self_care: {
      title: "Staying Positive and Clean",
      description: "'If you are a millionaire or a bum, you're probably going to be pretty miserable if you spend all your time drinking or drugging. Tennis is fun whether you have a home or not. Learning is fun.'\n\nSelf-care on the road means:\n• Finding a place to shower (gym, truck stop, beach)\n• Washing your clothes (laundromat or by hand)\n• Keeping your mind active\n• Staying sober enough to survive",
      choices: [
        {
          text: "Find a public shower or beach to clean up",
          outcome: () => {
            updateState({ 
              currentScene: "cleaned_up",
              health: Math.min(100, gameState.health + 10),
              morale: gameState.morale + 15,
            });
          },
        },
        {
          text: "Rest in the park and read",
          outcome: () => {
            updateState({ 
              currentScene: "rest_and_read",
              health: Math.min(100, gameState.health + 15),
              morale: gameState.morale + 10,
            });
          },
        },
        {
          text: "Find other travelers and socialize",
          outcome: () => {
            updateState({ currentScene: "traveler_community" });
            increaseSkill("socializing");
          },
        },
      ],
    },

    // Default fallback scenes
    fed_and_ready: {
      title: "Ready to Move",
      description: "Belly full, spirits lifted. The road awaits.",
      choices: [
        {
          text: "Continue your journey",
          outcome: () => updateState({ currentScene: "on_the_road" }),
        },
      ],
    },

    spanging_result: {
      title: "The Asking Game",
      description: "'Asking' is scary at first, but it works. The key is to be specific, polite, and not take rejection personally. Most people ignore you. A few are kind. That's enough.",
      choices: [
        {
          text: "Try a different approach",
          outcome: () => updateState({ currentScene: "breakfast_hunt" }),
        },
      ],
    },

    tarp_master: {
      title: "Shelter Sorted",
      description: "You can now set up a weatherproof shelter in under 5 minutes. This skill will save your life.",
      choices: [
        {
          text: "Rest for the night",
          outcome: () => {
            advanceDay();
            updateState({ currentScene: "next_day", warmth: Math.min(100, gameState.warmth + 30) });
          },
        },
      ],
    },

    // Add more generic connective scenes
    cleaned_up: {
      title: "Fresh Start",
      description: "Clean body, clean mind. You feel human again. Amazing what a shower can do for morale.",
      choices: [
        {
          text: "Back on the road",
          outcome: () => {
            advanceDay();
            updateState({ currentScene: "on_the_road" });
          },
        },
      ],
    },

    traveler_community: {
      title: "The People of the Fire",
      description: "You meet other travelers at a known gathering spot. There's Freight Train Jenny, college dropout turned professional hobo. Old Pete, who's been on the road since 'Nam. And Sunshine, a young woman heading to a commune in Arizona.\n\nThey share stories, tips, and warnings about places to avoid.",
      choices: [
        {
          text: "Ask about the best route to your destination",
          outcome: () => {
            updateState({ journeyProgress: gameState.journeyProgress + 10, currentScene: "route_tips" });
            increaseSkill("socializing");
          },
        },
        {
          text: "Share what you've learned so far",
          outcome: () => {
            updateState({ morale: gameState.morale + 15, currentScene: "sharing_wisdom" });
            increaseSkill("socializing");
          },
        },
      ],
    },

    route_tips: {
      title: "Insider Knowledge",
      description: `Jenny knows the route: 'Avoid Highway 5 past Bakersfield - the cops there are brutal. Take the coast route. Slower but safer, and the beaches are good for sleeping.'\n\nProgress: ${gameState.journeyProgress}%`,
      choices: [
        {
          text: "Thank them and get some rest",
          outcome: () => {
            advanceDay();
            updateState({ currentScene: "next_day" });
          },
        },
      ],
    },

    sharing_wisdom: {
      title: "Passing It On",
      description: "You share what Railroad Mike taught you about tarpetecture. Sunshine takes notes. 'That's going in my journal,' she says. The cycle continues - knowledge passed from traveler to traveler, generation to generation.",
      choices: [
        {
          text: "Rest with your new friends",
          outcome: () => {
            advanceDay();
            updateState({ currentScene: "next_day", morale: Math.min(100, gameState.morale + 10) });
          },
        },
      ],
    },

    rest_and_read: {
      title: "A Moment of Peace",
      description: "You find a bench in a quiet corner of the park. The sun is warm. You have nowhere to be. For a moment, you understand what it means to be a grasshopper - to dance in the moonlight while the ants work themselves to death.",
      choices: [
        {
          text: "Enjoy the moment, then continue",
          outcome: () => {
            advanceDay();
            updateState({ currentScene: "next_day" });
          },
        },
      ],
    },
  };

  // Additional scenes
  const additionalScenes: Record<string, Scene> = {
    bought_breakfast: {
      title: "Simple Meal",
      description: "Sometimes the easy way is the right way. You grab a coffee and a breakfast sandwich. Simple, quick, efficient.",
      choices: [
        { text: "Continue your day", outcome: () => updateState({ currentScene: "library" }) },
      ],
    },
    asked_food: {
      title: "The Kindness of Strangers",
      description: "A woman leaving the restaurant hands you a container. 'I always order too much,' she says with a smile. People are mostly good.",
      choices: [
        { text: "Thank her and enjoy the food", outcome: () => updateState({ currentScene: "fed_and_ready" }) },
      ],
    },
    asked_rejected: {
      title: "Not Today",
      description: "People walk past without meeting your eyes. It stings, but you don't take it personally. Everyone's fighting their own battles.",
      choices: [
        { text: "Try something else", outcome: () => updateState({ currentScene: "breakfast_hunt" }) },
      ],
    },
    shared_stories: {
      title: "Around the Fire",
      description: "Railroad Mike has stories from coast to coast. He tells you about the rainbow gatherings in national forests, about communes that welcome travelers, about the unspoken rules of the road. You share your story too - why you left, where you're going, what you hope to find.",
      choices: [
        { text: "Get some sleep", outcome: () => { advanceDay(); updateState({ currentScene: "next_day" }); } },
      ],
    },
    solo_rest: {
      title: "Quiet Night",
      description: "You keep to yourself tonight. Sometimes solitude is what you need. The stars are bright through the gaps in the bridge.",
      choices: [
        { text: "Morning comes", outcome: () => updateState({ currentScene: "next_day" }) },
      ],
    },
    dumpster_success: {
      title: "Urban Foraging",
      description: "You emerge with enough food for two days. Yogurt, bread, slightly bruised fruits, and a sealed package of cheese. In a society of waste, the wise eat well.",
      choices: [
        { text: "Stash the food and rest", outcome: () => { advanceDay(); updateState({ currentScene: "next_day" }); } },
      ],
    },
    employee_friend: {
      title: "Inside Connection",
      description: "'I'm not supposed to, but come by around 10 PM,' the employee whispers. 'I'll put the good stuff in a separate bag by the side door.' Access is everything.",
      choices: [
        { text: "Thank him and make note of the time", outcome: () => updateState({ currentScene: "next_day" }) },
      ],
    },
    employee_hostile: {
      title: "Wrong Mark",
      description: "His face hardens. 'Get out of here before I call the cops.' You move on quickly. Not everyone understands.",
      choices: [
        { text: "Find another spot", outcome: () => updateState({ currentScene: "camp_search" }) },
      ],
    },
    recycling: {
      title: "Cans and Bottles",
      description: "You spend a couple hours collecting recyclables. It's honest work, and the exercise keeps you warm.",
      choices: [
        { text: "Cash them in and continue", outcome: () => updateState({ currentScene: "next_day" }) },
      ],
    },
    fire_success: {
      title: "Warmth in the Darkness",
      description: "You build a small fire using your lighter and dead wood. The flames dance, warming your face and hands. You remember the phrase: 'The people of the fire' - those who gather around flames in the darkness, sharing warmth and stories.",
      choices: [
        { text: "Sleep well", outcome: () => { advanceDay(); updateState({ currentScene: "next_day" }); } },
      ],
    },
    fire_attention: {
      title: "Busted",
      description: "The fire was too visible. A park ranger shines a flashlight in your face. 'You can't camp here. Move along.' You pack up and find another spot.",
      choices: [
        { text: "Move on", outcome: () => { updateState({ warmth: gameState.warmth - 10 }); advanceDay(); updateState({ currentScene: "next_day" }); } },
      ],
    },
    cold_morning: {
      title: "Rough Night",
      description: "You barely slept. Your bones ache from the cold ground. But you're alive. Today, you find a tarp.",
      choices: [
        { text: "Start the day", outcome: () => updateState({ currentScene: "supply_run" }) },
      ],
    },
    cardboard_save: {
      title: "Improvisation",
      description: "Cardboard from a recycling bin becomes insulation. It's not perfect, but it's the difference between misery and survival. You're learning.",
      choices: [
        { text: "Wake up wiser", outcome: () => updateState({ currentScene: "next_day" }) },
      ],
    },
    double_hustle: {
      title: "The Side Gig Economy",
      description: "You line up another rideshare for tomorrow. The van is earning its keep.",
      choices: [
        { text: "Get some rest", outcome: () => { advanceDay(); updateState({ currentScene: "on_the_road" }); } },
      ],
    },
    got_tarp: {
      title: "Essential Gear",
      description: "Six feet by six feet of waterproof possibility. With this and your blanket, you can sleep anywhere.",
      choices: [
        { text: "Test it out", outcome: () => updateState({ currentScene: "park_camp_good" }) },
      ],
    },
    got_stove: {
      title: "Hot Meals Unlocked",
      description: "Now you can cook. Rice, beans, oatmeal - cheap food becomes good food with a little heat.",
      choices: [
        { text: "Continue shopping or leave", outcome: () => updateState({ currentScene: "next_day" }) },
      ],
    },
    got_possibles: {
      title: "The Possibles Bag",
      description: "Inside you find: extra shoelaces, a sewing kit, bandaids, a small mirror, and a whistle. You're ready for almost anything.",
      choices: [
        { text: "Hit the road", outcome: () => updateState({ currentScene: "on_the_road" }) },
      ],
    },
    trucker_tips: {
      title: "Road Intel",
      description: `Earl knows all the stops: 'There's a truck stop in Grants Pass - good showers, free if you're nice to the attendant. And a diner in Redding where the cook puts out extras for travelers around closing time.'`,
      choices: [
        { text: "Take notes and thank him", outcome: () => { addItem("Truck Stop Guide"); updateState({ currentScene: "trucker_ride" }); } },
      ],
    },
    better_ride: {
      title: "Jackpot",
      description: "A couple in a Prius heading all the way to LA! They're friendly, curious about your lifestyle, and happy to have company for the long drive.",
      choices: [
        { text: "Enjoy the ride", outcome: () => { updateState({ morale: gameState.morale + 15 }); advanceDay(); updateState({ currentScene: "next_day" }); } },
      ],
    },
    no_ride: {
      title: "Stranded",
      description: "Hours pass. Your thumb aches. Finally you give up for the day and find a spot to sleep. Tomorrow you take whatever ride comes.",
      choices: [
        { text: "Rest", outcome: () => updateState({ currentScene: "camp_search" }) },
      ],
    },
    work_contacts: {
      title: "Networking",
      description: "Earl gives you the number of a guy in Sacramento who always needs hands for landscaping. 'Tell him Earl sent you. He'll give you fair work.'",
      choices: [
        { text: "Store the number safely", outcome: () => updateState({ currentScene: "trucker_ride" }) },
      ],
    },
    shared_story: {
      title: "Connection",
      description: "You tell Earl why you hit the road. He listens without judgment. 'We all got our reasons,' he says. 'The road's honest. It don't care who you were, only who you are.'",
      choices: [
        { text: "Ride in comfortable silence", outcome: () => updateState({ currentScene: "trucker_ride" }) },
      ],
    },
    truck_rest: {
      title: "Rest Stop",
      description: "You doze in the warm cab while Earl drives through the night. The hum of the engine is soothing.",
      choices: [
        { text: "Wake refreshed", outcome: () => { advanceDay(); updateState({ currentScene: "next_day" }); } },
      ],
    },
    reduced_price: {
      title: "The Meat Section After Seven",
      description: "The reduced-price section is picked over, but you find a steak marked down 50% because it expires tomorrow. Tonight, you eat like a king.",
      choices: [
        { text: "Cook it up", outcome: () => { updateState({ hunger: 0, cash: gameState.cash - 3, morale: gameState.morale + 15, currentScene: "steak_dinner" }); } },
      ],
    },
    steak_dinner: {
      title: "Living Like a Prince",
      description: "You grill the steak over your camp stove. Medium rare. As the sun sets, you realize something: you're free. No rent, no boss, no alarm clock. Just you and the road. Is this living rough, or living well?",
      choices: [
        { text: "Sleep satisfied", outcome: () => { advanceDay(); updateState({ currentScene: "next_day" }); } },
      ],
    },
    bakery_success: {
      title: "Daily Bread",
      description: "'We throw it out anyway,' the baker says, handing you a bag of day-old croissants and muffins. 'Come back tomorrow if you want.'",
      choices: [
        { text: "Thank them warmly", outcome: () => updateState({ currentScene: "fed_and_ready" }) },
      ],
    },
    bakery_fail: {
      title: "Company Policy",
      description: "'Sorry, we can't. Company policy.' The manager looks apologetic. Some places are strict about it - liability concerns. You move on.",
      choices: [
        { text: "Try somewhere else", outcome: () => updateState({ currentScene: "food_research" }) },
      ],
    },
    temple_volunteer: {
      title: "Seva - Selfless Service",
      description: "You wash dishes alongside doctors, students, and grandmothers. Everyone serves, everyone is equal. One of the volunteers offers you a place to sleep in the back room for a few nights if you need it.",
      choices: [
        { text: "Accept gratefully", outcome: () => { updateState({ warmth: 100, health: Math.min(100, gameState.health + 20) }); advanceDay(); updateState({ currentScene: "next_day" }); } },
        { text: "Thank them but continue your journey", outcome: () => updateState({ currentScene: "on_the_road" }) },
      ],
    },
    route_planning: {
      title: "Strategic Planning",
      description: "You map out rest stops, known friendly spots, and potential hazards. Knowledge is power on the road.",
      choices: [
        { text: "Start the journey", outcome: () => updateState({ currentScene: "on_the_road" }) },
      ],
    },
    day_labor: {
      title: "Honest Work",
      description: "Eight hours of loading trucks or landscaping. Your body aches but your wallet is heavier. There's dignity in hard work.",
      choices: [
        { text: "Rest your tired body", outcome: () => updateState({ currentScene: "camp_search" }) },
      ],
    },
    grocery_help: {
      title: "Small Acts",
      description: "An elderly woman gladly accepts your help with her groceries. She tips you and tells you about her grandson who 'wandered' for a few years too.",
      choices: [
        { text: "Continue your day", outcome: () => updateState({ currentScene: "next_day" }) },
      ],
    },
    no_takers: {
      title: "Quiet Day",
      description: "No one needs help today. That's okay. Tomorrow's another day.",
      choices: [
        { text: "Try something else", outcome: () => updateState({ currentScene: "work_hunt" }) },
      ],
    },
  };

  const allScenes = { ...scenes, ...additionalScenes };

  const getCurrentScene = (): Scene => {
    return allScenes[gameState.currentScene] || allScenes.intro;
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setGameWon(false);
    setGameState({
      day: 1,
      location: "Portland, Oregon",
      health: 100,
      morale: 75,
      cash: 4.86,
      warmth: 50,
      hunger: 50,
      skills: {
        tarpetecture: 0,
        foraging: 0,
        hustling: 0,
        socializing: 0,
        survival: 0,
      },
      inventory: [...STARTING_INVENTORY],
      currentScene: "intro",
      journeyProgress: 0,
      destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
    });
  };

  const currentScene = getCurrentScene();

  if (!gameStarted) {
    return (
      <Card className="border-amber-800/30 bg-gradient-to-br from-amber-950/20 to-stone-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <Backpack className="h-6 w-6" />
            Rough Living: The Life of a Vagabond
          </CardTitle>
          <CardDescription className="text-amber-200/70">
            An Oregon Trail-style adventure based on CD Damitio's urban survival manual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-amber-950/30 p-4 text-sm text-amber-100/80 space-y-2">
            <p className="italic">"Once upon a time there was an ant and a grasshopper..."</p>
            <p>The ants work themselves to death. The grasshoppers? They learn to survive creatively.</p>
            <p>In this game, you'll learn the art of <strong>Rough Living</strong>:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The Three A's: Abilities, Accumulations, Access</li>
              <li>Four ways to get what you want</li>
              <li>Tarpetecture and shelter building</li>
              <li>Finding food without money</li>
              <li>The people of the fire</li>
            </ul>
            <p className="mt-2">Can you make it from Portland to your destination?</p>
          </div>
          <Button onClick={startGame} className="w-full bg-amber-700 hover:bg-amber-600">
            Begin Your Journey
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (gameWon) {
    return (
      <Card className="border-green-800/30 bg-gradient-to-br from-green-950/20 to-stone-900/40">
        <CardHeader>
          <CardTitle className="text-green-400">🎉 You Made It!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-green-200">
            After {gameState.day} days on the road, you've arrived in {gameState.destination}!
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Final Cash: ${gameState.cash.toFixed(2)}</div>
            <div>Health: {gameState.health}%</div>
            <div>Morale: {gameState.morale}%</div>
            <div>Skills Learned: {Object.values(gameState.skills).filter(s => s > 0).length}</div>
          </div>
          <p className="text-sm italic text-amber-200/70">
            "I'm living like a prince. That's what I'm doing at the moment."
          </p>
          <Button onClick={startGame} className="w-full bg-amber-700 hover:bg-amber-600">
            Start New Journey
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (gameOver) {
    return (
      <Card className="border-red-800/30 bg-gradient-to-br from-red-950/20 to-stone-900/40">
        <CardHeader>
          <CardTitle className="text-red-400">Journey's End</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-200">
            Day {gameState.day}: Your journey has come to an end, {gameState.journeyProgress}% of the way to {gameState.destination}.
          </p>
          <p className="text-sm italic text-amber-200/70">
            "If you want to die, you won't survive a week of rough living. There are far too many ways to end up dead."
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>Skills learned: {Object.values(gameState.skills).filter(s => s > 0).length}</div>
            <div>Items collected: {gameState.inventory.length}</div>
          </div>
          <Button onClick={startGame} className="w-full bg-amber-700 hover:bg-amber-600">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-800/30 bg-gradient-to-br from-amber-950/20 to-stone-900/40">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <Backpack className="h-5 w-5" />
              Day {gameState.day}
            </CardTitle>
            <CardDescription className="text-amber-200/70">
              {gameState.journeyProgress}% to {gameState.destination}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-amber-400 border-amber-700">
            ${gameState.cash.toFixed(2)}
          </Badge>
        </div>
        
        {/* Progress bar */}
        <Progress value={gameState.journeyProgress} className="h-2 bg-amber-950" />
        
        {/* Status bars */}
        <div className="grid grid-cols-4 gap-2 text-xs mt-2">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-red-400" />
            <Progress value={gameState.health} className="h-1 flex-1" />
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="h-3 w-3 text-blue-400" />
            <Progress value={gameState.warmth} className="h-1 flex-1" />
          </div>
          <div className="flex items-center gap-1">
            <UtensilsCrossed className="h-3 w-3 text-yellow-400" />
            <Progress value={100 - gameState.hunger} className="h-1 flex-1" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs">😊</span>
            <Progress value={gameState.morale} className="h-1 flex-1" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-bold text-amber-300 mb-2">{currentScene.title}</h3>
          <p className="text-sm text-amber-100/80 whitespace-pre-line">{currentScene.description}</p>
          {currentScene.lesson && (
            <p className="text-xs text-amber-400/70 mt-2 p-2 bg-amber-900/20 rounded border border-amber-800/30">
              {currentScene.lesson}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {currentScene.choices.map((choice, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full text-left justify-start h-auto py-2 text-wrap border-amber-800/30 hover:bg-amber-800/20"
              onClick={choice.outcome}
              disabled={choice.skillRequired && gameState.skills[choice.skillRequired.skill] < choice.skillRequired.level}
            >
              {choice.text}
              {choice.skillRequired && (
                <span className="ml-2 text-xs text-amber-400">
                  (Requires {choice.skillRequired.skill} {choice.skillRequired.level})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Inventory and Skills */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-amber-950/30 rounded">
            <div className="font-bold text-amber-400 mb-1">Inventory</div>
            {gameState.inventory.map((item, i) => (
              <Badge key={i} variant="secondary" className="mr-1 mb-1 text-xs">
                {item}
              </Badge>
            ))}
          </div>
          <div className="p-2 bg-amber-950/30 rounded">
            <div className="font-bold text-amber-400 mb-1">Skills</div>
            {Object.entries(gameState.skills).map(([skill, level]) => (
              level > 0 && (
                <div key={skill} className="flex justify-between">
                  <span className="capitalize">{skill}</span>
                  <span>{level}/10</span>
                </div>
              )
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
