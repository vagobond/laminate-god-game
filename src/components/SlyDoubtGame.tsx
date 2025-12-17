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
    scenario: "Trusting no one, you venture into Degen-City alone. The streets pulse with neon and desperation. A brothel called 'The Pleasure Dome of Uranus' catches your eye - rumor has it, the monarchy's secrets spill there nightly. But you notice guards watching you...",
    location: "Degen-City - Red Light District",
    choices: [
      { text: "Enter The Pleasure Dome as a customer", outcome: "The workers here know everything. For the price of a drink, you learn about a secret Bloot shipment. +1 Bloot, +1 Revolution Act", nextScene: "pleasure_dome" },
      { text: "Attempt to lose the guards in the alleys", outcome: "You duck and weave but they anticipated your move. Captured! +0 Revolution Acts", nextScene: "captured_by_monarchy" },
      { text: "Confront the guards directly with confidence", outcome: "Your boldness catches them off-guard. They assume you're nobility. You bluff your way to freedom. +1 Revolution Act", nextScene: "oberon_outskirts" }
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
    scenario: "You've made it to Oberon, the seat of Jovian power over Uranus. The moon is covered in obscene palaces built on stolen Bloot. Guards patrol everywhere, but the servants' quarters offer... opportunities. A royal messenger approaches with an unexpected invitation.",
    location: "Oberon - Servants' District",
    choices: [
      { text: "Infiltrate the palace as a servant", outcome: "You learn the intimate details of palace life. The Duke of Io has a foot fetish. The Countess of Europa... doesn't bear mentioning. +2 Revolution Acts", nextScene: "final_battle" },
      { text: "Accept the Queen's mysterious invitation", outcome: "The messenger leads you to perfumed chambers. Queen Sphincteria awaits... +1 Bloot", nextScene: "royal_seduction" },
      { text: "Scout the Royal Shaft pipeline directly", outcome: "Your mother died here. The pipeline is heavily guarded, but you spot weaknesses. Her sacrifice wasn't in vain. +1 Bloot, +2 Revolution Acts", nextScene: "final_battle" }
    ]
  },

  // REFINERY ASSAULT
  refinery_assault: {
    id: "refinery_assault",
    scenario: "D-Day. The Myanus Bloot Refinery processes 80% of Uranus's output. Your team approaches under cover of a Blorp storm. Inside, workers toil under brutal conditions. Freeing them could turn the tide, but the guards are alert.",
    location: "Myanus Bloot Refinery - Perimeter",
    choices: [
      { text: "Create a distraction and free the workers", outcome: "You trigger alarms on the far side. In the chaos, you arm the workers with mining tools. Revolution! +4 Revolution Acts", nextScene: "celebration_night" },
      { text: "Plant explosives and evacuate secretly", outcome: "The refinery goes up in a spectacular Uranian Surprise. Bloot prices skyrocket. The monarchy bleeds. +3 Revolution Acts, +2 Bloot", nextScene: "final_battle" },
      { text: "Attempt a risky solo infiltration", outcome: "Your bravado gets the better of you. Guards surround you. Captured! +0 Revolution Acts", nextScene: "captured_by_monarchy" }
    ]
  },

  // FESTIVAL INFILTRATION
  festival_infiltration: {
    id: "festival_infiltration",
    scenario: "The Golden Shower of Uranus - the annual festival where Blorp flowers release their yellow pollen across the planet. Tourists come from across the solar system, including a curious Neptunian delegation. It's beautiful, romantic, and the perfect cover for revolutionary activity.",
    location: "Blorp Forest Amphitheater - Festival Grounds",
    choices: [
      { text: "Hijack the broadcast system", outcome: "For five glorious minutes, the truth about Uranian oppression reaches billions. The monarchy scrambles to respond. +5 Revolution Acts", nextScene: "humiliation_choice" },
      { text: "Approach the Neptunian diplomats", outcome: "The alien ambassador seems very interested in your revolutionary cause... and in you. +2 Bloot", nextScene: "alien_encounter" },
      { text: "Use the chaos to liberate a Bloot shipment", outcome: "While everyone watches the golden pollen fall, your team relieves a convoy of its precious cargo. +4 Bloot", nextScene: "celebration_night" }
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
    scenario: "The revolution has reached its climax. Across Uranus, cells rise in coordinated action. The Royal Shaft - the main pipeline draining Uranus's wealth - stands before you. Your mother died trying to reach this point. Now it's your turn to finish what she started. But there are many paths to victory... or defeat.",
    location: "The Royal Shaft - Control Center",
    choices: [
      { text: "Destroy the pipeline entirely", outcome: "The explosion is visible from Neptune. Uranus's Bloot stays in Uranus now. The monarchy crumbles without their supply. VICTORY! +10 Revolution Acts", nextScene: "victory_destruction" },
      { text: "Humiliate the monarchy publicly", outcome: "You have leverage. Time to make them squirm in front of the entire solar system. +5 Revolution Acts", nextScene: "humiliation_choice" },
      { text: "Accept the Queen's offer of 'private negotiations'", outcome: "Her Majesty has made it clear she finds revolutionaries... stimulating. +2 Bloot", nextScene: "royal_seduction" },
      { text: "Demand the monarchy submit to YOUR rule", outcome: "Why destroy power when you can take it? +3 Revolution Acts", nextScene: "domination_path" }
    ]
  },

  // HUMILIATION PATH
  humiliation_choice: {
    id: "humiliation_choice",
    scenario: "You've captured the entire royal family. The broadcasting system is yours. Billions across the solar system are watching. How do you want to humiliate the oppressors who have exploited Uranus for centuries?",
    location: "The Royal Shaft - Broadcast Chamber",
    choices: [
      { text: "Force them to perform the Uranian Dance of Shame", outcome: "The ancient ritual was banned by the monarchy for being 'undignified.' Now they perform it naked on live broadcast. +5 Revolution Acts", nextScene: "ending_humiliation_dance" },
      { text: "Make them read their own corruption logs aloud", outcome: "Hours of confessions stream across the galaxy. Every dirty deal, every stolen Bloot, every lie - from their own mouths. +5 Revolution Acts", nextScene: "ending_humiliation_confession" },
      { text: "Let the alien ambassador have a word", outcome: "The Neptunian delegate has been waiting for this moment. They have... interesting requests. +3 Bloot", nextScene: "alien_encounter" }
    ]
  },

  // ALIEN ENCOUNTER PATH
  alien_encounter: {
    id: "alien_encounter",
    scenario: "The Neptunian ambassador, a being of shimmering tentacles and incomprehensible beauty, approaches you. 'We have watched your revolution with great interest,' they pulse in colors that somehow translate to words. 'On Neptune, we celebrate liberation in... very physical ways. Would you honor us by participating in our Communion of Victory?'",
    location: "The Royal Shaft - Diplomatic Suite",
    choices: [
      { text: "Accept the alien communion", outcome: "The Neptunian's touch transcends human understanding. Time loses meaning. You experience pleasure across seventeen dimensions. +10 Bloot", nextScene: "ending_alien_communion" },
      { text: "Politely decline - focus on the revolution", outcome: "The ambassador understands. 'Another time, perhaps.' You return to your duties. +3 Revolution Acts", nextScene: "victory_destruction" },
      { text: "Invite your resistance comrades to join", outcome: "The Neptunian's eyes (all forty of them) light up. 'A collective experience! How delightfully Uranian!' +5 Revolution Acts", nextScene: "ending_group_alien" }
    ]
  },

  // ROYAL SEDUCTION PATH
  royal_seduction: {
    id: "royal_seduction",
    scenario: "Queen Sphincteria of Io awaits you in her private chambers. She's removed her crown and most of her dignity. 'You've won, revolutionary,' she purrs. 'But I can offer you something better than mere victory. Rule beside me. Or...' she gestures to her guards, 'learn what happens to those who refuse a queen.'",
    location: "Oberon Palace - Royal Bedchamber",
    choices: [
      { text: "Accept her offer of partnership", outcome: "Power and pleasure intertwine as you join the monarchy through... merger. +5 Bloot", nextScene: "ending_betrayal_seduction" },
      { text: "Refuse and face the consequences", outcome: "The Queen's face hardens. 'Then you'll experience the Zigzag.' Guards seize you. +0 Revolution Acts", nextScene: "ending_death_zigzag" },
      { text: "Turn the tables and seduce HER to the revolution", outcome: "Your revolutionary charisma overcomes her monarchist conditioning. She renounces her crown... among other things. +7 Revolution Acts", nextScene: "ending_humiliation_queen" }
    ]
  },

  // DOMINATION PATH
  domination_path: {
    id: "domination_path",
    scenario: "You stand above the kneeling royal family. The power feels intoxicating. 'From now on,' you declare, 'Uranus answers to ME.' The monarchy looks at you with a mixture of fear and... is that arousal? Prince Fissure whispers, 'We were always looking for a strong hand.'",
    location: "Oberon Palace - Throne Room",
    choices: [
      { text: "Embrace your dark side - become the new tyrant", outcome: "You take the throne by force of will alone. The monarchy submits completely to your dominance. +10 Bloot", nextScene: "ending_betrayal_domination" },
      { text: "This feels wrong - return to revolutionary principles", outcome: "Power corrupts. You step back from the edge and remember why you started this fight. +5 Revolution Acts", nextScene: "victory_destruction" },
      { text: "Demand they grovel for forgiveness from all Uranians", outcome: "The royal family crawls on their bellies through every mining district, begging forgiveness. Cathartic. +6 Revolution Acts", nextScene: "ending_humiliation_grovel" }
    ]
  },

  // CAPTURE/TORTURE PATH
  captured_by_monarchy: {
    id: "captured_by_monarchy",
    scenario: "Your infiltration failed. The Royal Inquisitor, a gaunt figure known as 'The Probing,' stands over you in the dungeon. 'Revolutionary scum. You will tell us everything about your comrades. We have... methods.'",
    location: "Oberon Palace - The Pit",
    choices: [
      { text: "Resist the torture", outcome: "Hours become days. The pain is beyond description. But you reveal nothing. Your body gives out before your spirit. +0 Revolution Acts", nextScene: "ending_death_torture" },
      { text: "Pretend to break - feed them false information", outcome: "You scream convincingly and give them lies. It buys time for the real attack. +3 Revolution Acts", nextScene: "refinery_assault" },
      { text: "Offer to betray your comrades", outcome: "The Probing smiles. 'Wise choice.' But is it? -5 Revolution Acts", nextScene: "ending_betrayal_seduction" }
    ]
  },

  // GROUP CELEBRATION PATH
  celebration_night: {
    id: "celebration_night",
    scenario: "The revolution has succeeded! In the liberated pleasure houses of Degen-City, your closest comrades gather to celebrate. Backdoor Blake, Velvet, the Sphincter Sisters, and a dozen other revolutionaries look at you with admiration and desire. 'Tonight,' Blake says, 'we celebrate freedom in the most Uranian way possible.'",
    location: "The Pleasure Dome - Liberation Night",
    choices: [
      { text: "Join the revolutionary orgy", outcome: "The celebration lasts until dawn. Bodies intertwine in every combination imaginable. This is what freedom feels like. +5 Revolution Acts, +5 Bloot", nextScene: "ending_group_celebration" },
      { text: "Celebrate with just Blake", outcome: "Some revolutions are intimate. You and Blake find a quiet corner and make your own fireworks. +3 Revolution Acts", nextScene: "victory_diplomatic" },
      { text: "Give a rousing speech instead", outcome: "Not every celebration needs to be physical. Your words inspire the crowd. Songs are sung. +4 Revolution Acts", nextScene: "victory_control" }
    ]
  },

  // ============ ENDINGS ============

  // HAPPY ENDINGS - MONARCHY HUMILIATED
  ending_humiliation_dance: {
    id: "ending_humiliation_dance",
    scenario: "THE DANCE OF SHAME\n\nThe royal family performs the banned Uranian fertility dance on live broadcast. King Sphincter's rhythmic thrusting, Queen Sphincteria's awkward gyrations, and Prince Fissure's surprisingly enthusiastic participation are witnessed by billions. The monarchy's mystique is shattered forever. Memes of the dance spread across the solar system. Uranians laugh for the first time in centuries. The revolution doesn't just win - it makes tyranny a punchline. You are hailed as the hero who showed the galaxy that emperors have no clothes.",
    location: "ENDING - The Galaxy Laughs",
    choices: [
      { text: "Begin a new adventure", outcome: "The dance lives forever in the collective memory. +10 Revolution Acts", nextScene: "start" }
    ]
  },

  ending_humiliation_grovel: {
    id: "ending_humiliation_grovel",
    scenario: "THE CRAWL OF PENANCE\n\nFor seven days and seven nights, the royal family crawls naked through every mining district of Uranus. At each stop, workers line up to spit on them, throw rotten Blorp fruit, and deliver detailed accounts of their suffering. By the end, the monarchy is broken - not by violence, but by finally being forced to see what they had done. King Sphincter weeps openly. Queen Sphincteria begs for death. Prince Fissure converts to the revolutionary cause on day three. The images become monuments to justice. Uranus is free, and its oppressors have been drowned in the shame they always deserved.",
    location: "ENDING - Justice Through Humiliation",
    choices: [
      { text: "Begin a new adventure", outcome: "Some punishments are worse than death. +10 Revolution Acts", nextScene: "start" }
    ]
  },

  // HAPPY ENDINGS - SEXUAL VICTORY (GROUP)
  ending_group_celebration: {
    id: "ending_group_celebration",
    scenario: "THE ORGY OF LIBERATION\n\nThe celebration becomes legend. In the steamy halls of the liberated Pleasure Dome, you and your comrades explore every possibility of freedom. Backdoor Blake's infiltration skills prove useful in new contexts. The Sphincter Sisters demonstrate why they work so well as a pair. Velvet shows you techniques the pleasure houses never taught customers. By dawn, you've formed bonds deeper than any revolution could forge. The group becomes the new governing council - the Collective of Carnal Liberation. Your first act: declaring that pleasure is a fundamental Uranian right. History will remember this night as the true birth of the new Uranus.",
    location: "ENDING - Freedom's Embrace",
    choices: [
      { text: "Begin a new adventure", outcome: "Some victories are sweeter than others. +10 Bloot, +10 Revolution Acts", nextScene: "start" }
    ]
  },

  // HAPPY ENDINGS - SEXUAL VICTORY (ALIEN)
  ending_alien_communion: {
    id: "ending_alien_communion",
    scenario: "THE NEPTUNIAN COMMUNION\n\nThe ambassador's tentacles envelope you in warmth beyond human comprehension. Time fractures. You experience pleasure simultaneously across past, present, and future. Sensations that have no name in any Terran language cascade through your being. The Neptunian shows you the heat death of the universe and somehow makes it feel like coming home. When you finally return to baseline reality, three weeks have passed. Uranus is free. The revolution succeeded without you. But you carry within you something greater - a connection to cosmic ecstasy that transcends politics. The Neptunian Embassy offers you a permanent position as 'Cultural Liaison.' The job duties are exactly what you hope they are.",
    location: "ENDING - Cosmic Union",
    choices: [
      { text: "Begin a new adventure", outcome: "Some pleasures are literally out of this world. +15 Bloot", nextScene: "start" }
    ]
  },

  ending_group_alien: {
    id: "ending_group_alien",
    scenario: "THE COLLECTIVE COMMUNION\n\nYour comrades join you and the Neptunian ambassador in an experience that redefines the concept of 'group activity.' The ambassador's forty-seven tentacles prove more than sufficient for the dozen revolutionaries present. Backdoor Blake achieves sounds previously unknown to human vocal cords. The Sphincter Sisters finally find something that challenges their flexibility. The collective consciousness that forms during the experience accidentally solves cold fusion, creates three new art forms, and establishes permanent peace between Uranus and Neptune. You wake tangled in a pile of satisfied revolutionaries and gently pulsing tentacles. This is how civilizations should celebrate victory.",
    location: "ENDING - Interplanetary Harmony",
    choices: [
      { text: "Begin a new adventure", outcome: "First contact was... thorough. +10 Revolution Acts, +10 Bloot", nextScene: "start" }
    ]
  },

  // DEATH ENDINGS - TORTURE
  ending_death_torture: {
    id: "ending_death_torture",
    scenario: "DEATH BY THE PROBING\n\nYou never break. Through seven days of The Probing's instruments - the Neural Scraper, the Bone Singer, the Thing That Goes In All The Holes - you give them nothing. Your revolutionary spirit burns brighter than any pain they can inflict. On the eighth day, your heart simply stops. But your sacrifice is not in vain. News of your defiance spreads through the resistance like wildfire. Your name becomes a rallying cry. 'Remember the Orphan!' echoes through the mines and slums of Uranus. The revolution you started continues without you, fueled by your martyrdom. Your body dies in chains, but your legend lives free.",
    location: "DEATH - Martyrdom Through Endurance",
    choices: [
      { text: "Begin a new adventure", outcome: "Your spirit inspires thousands. +0 Revolution Acts (but the cause continues)", nextScene: "start" }
    ]
  },

  // DEATH ENDINGS - ZIGZAG
  ending_death_zigzag: {
    id: "ending_death_zigzag",
    scenario: "DEATH BY THE ZIGZAG\n\nThe Zigzag. Whispered about in terrified tones. The monarchy's most secret punishment, reserved for those who refuse royal advances. You're strapped to the Oscillating Throne - a device that moves in patterns no human body was meant to endure. The Queen watches with cold satisfaction as the machine activates. 'The Zigzag takes exactly 47 hours,' she explains. 'You'll experience pleasure and pain in alternating waves until your nervous system simply... gives up.' She wasn't lying. The sensations are impossible to describe - ecstasy and agony in perfect balance, zigzagging through your synapses until you can no longer tell them apart. On hour 46, you achieve a state of enlightenment that no living being was meant to reach. Then everything goes white. Your last thought: at least it was interesting.",
    location: "DEATH - The Mysterious Zigzag",
    choices: [
      { text: "Begin a new adventure", outcome: "Some deaths are stranger than others. +0 Revolution Acts", nextScene: "start" }
    ]
  },

  // BETRAYAL ENDINGS - SEDUCTION
  ending_betrayal_seduction: {
    id: "ending_betrayal_seduction",
    scenario: "BETRAYAL THROUGH SEDUCTION\n\nQueen Sphincteria's embrace is warm, her promises warmer. You tell yourself you're infiltrating the monarchy from within. You tell yourself you'll help the people eventually. But days become weeks, weeks become months. The silk sheets are so comfortable. The Bloot-infused wines so intoxicating. Your former comrades are captured and executed. You watch from the royal balcony, the Queen's hand on your thigh. 'You made the smart choice,' she whispers. You've become everything you fought against. The revolution dies. Your principles die. But you? You live like a king - or rather, like a king's kept lover. At night, when the Queen sleeps, you sometimes remember the orphanage, the journal, the dreams of freedom. Then she wakes and calls you to her, and you forget again.",
    location: "ENDING - The Gilded Cage",
    choices: [
      { text: "Begin a new adventure (as the villain)", outcome: "Power corrupts. Pleasure corrupts absolutely. -10 Revolution Acts, +10 Bloot", nextScene: "start" }
    ]
  },

  // BETRAYAL ENDINGS - DOMINATION
  ending_betrayal_domination: {
    id: "ending_betrayal_domination",
    scenario: "BETRAYAL THROUGH DOMINATION\n\nYou take the throne not through marriage but through sheer force of will. The royal family kneels before you now - not as prisoners, but as willing subjects. Something in your revolutionary fire awakens their submissive nature. King Sphincter calls you 'Master.' Queen Sphincteria begs for your discipline. Prince Fissure becomes your most devoted servant. You rule Uranus with an iron fist, extracting Bloot not for Jupiter but for yourself. The oppressed become the oppressor. The revolutionary becomes the tyrant. Your former comrades stage their own revolution against you. You crush them without mercy. Si Deresk dies cursing your name. But the throne feels so RIGHT beneath you. Perhaps this was your destiny all along - not to destroy the monarchy, but to become it, perfected.",
    location: "ENDING - The New Tyrant",
    choices: [
      { text: "Begin a new adventure (as the new monarch)", outcome: "You became what you fought. -10 Revolution Acts, +15 Bloot", nextScene: "start" }
    ]
  },

  // ORIGINAL VICTORY ENDINGS (preserved)
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
  },

  ending_humiliation_confession: {
    id: "ending_humiliation_confession",
    scenario: "THE GREAT CONFESSION\n\nFor twelve straight hours, the royal family reads aloud from their own encrypted communications. Every bribe, every assassination order, every crude joke about Uranian workers - broadcast to the entire solar system. King Sphincter's voice breaks as he reads his order to massacre the Myanus Miners' Strike of 2799. Queen Sphincteria weeps through her own letters describing Uranians as 'barely human excrement farmers.' The galaxy hears their true nature. Allies abandon them. The Jovian Congress demands their abdication. By morning, the monarchy is politically dead, killed by their own words. No violence was needed - just truth.",
    location: "ENDING - Truth Is The Ultimate Weapon",
    choices: [
      { text: "Begin a new adventure", outcome: "Their own words destroyed them. +10 Revolution Acts", nextScene: "start" }
    ]
  },

  ending_humiliation_queen: {
    id: "ending_humiliation_queen",
    scenario: "THE QUEEN'S CONVERSION\n\nYour revolutionary charisma proves more powerful than three centuries of royal conditioning. Queen Sphincteria renounces her throne, her wealth, and her clothes - in that order. She broadcasts her conversion live: 'I have seen the truth. I have felt the passion of liberation. I was a tyrant, but now I serve the people... and especially this particular revolutionary.' She becomes your devoted partner, using her knowledge of royal secrets to dismantle the entire Jovian power structure. The former Queen of Io now makes your breakfast and writes revolutionary pamphlets. It's a strange relationship, but effective.",
    location: "ENDING - Love Conquers Tyranny",
    choices: [
      { text: "Begin a new adventure", outcome: "The ultimate humiliation: becoming what she oppressed. +8 Revolution Acts, +5 Bloot", nextScene: "start" }
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
      { text: "Fight your way through", outcome: "Bold and stupid. You take down two guards but catch a stun bolt. You wake in a cell. -1 Bloot", nextScene: "captured_by_monarchy" }
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
