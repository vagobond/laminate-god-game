import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Sparkles, MapPin, Plane, ExternalLink, RefreshCw } from "lucide-react";

type GameState = "menu" | "bored" | "lonely-choice" | "lonely-home" | "lonely-away";

// Fisher-Yates shuffle for random ordering
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Wild, offbeat, and adventurous activity suggestions
const boredActivitiesUnshuffled = [
  // Original mild activities
  "Go to a place you've never been within 5 miles of your home",
  "Write a letter to someone you haven't spoken to in years",
  "Learn three phrases in a language you don't speak",
  "Find the nearest body of water and sit by it for 30 minutes",
  "Cook a dish from a cuisine you've never tried",
  "Take 20 photos of things that are the color blue",
  "Call a family member and ask them to tell you a story from before you were born",
  "Rearrange the furniture in one room",
  "Go to a thrift store and buy something for under $5",
  "Write a poem about the last dream you remember",
  "Find a new podcast and listen to an entire episode",
  "Draw a map of your neighborhood from memory",
  "Make a playlist for a specific mood you've never made one for",
  "Find a recipe that uses an ingredient you've never cooked with",
  "Go somewhere and read a book for an hour",
  "Take a different route to somewhere you go regularly",
  "Learn to do something with your non-dominant hand",
  "Find a local event happening this week and go to it",
  "Create art with materials you find around your home",
  "Walk until you find something interesting, then research its history",
  "Watch a documentary about something you know nothing about",
  "Try to identify 5 plants or trees in your area",
  "Write down 10 things you're grateful for, then read them aloud",
  "Find a new coffee shop or café and spend an hour there",
  "Learn a card trick or magic trick",
  "Clean out one drawer or closet completely",
  "Take a photo walk focusing only on shadows",
  "Call a local business and ask them about their story",
  "Find free samples of something and try them all",
  "Make something from scratch that you usually buy",
  
  // Wild and offbeat adventures
  "Crash a wedding reception and dance with strangers",
  "Go to a fancy hotel lobby and act like you belong there",
  "Order the weirdest thing on the menu at a restaurant you've never been to",
  "Go to a karaoke bar and sing a song you don't know",
  "Wear a ridiculous outfit in public for an entire day",
  "Start a conga line at a random public place",
  "Leave cryptic notes in library books",
  "Go to an open mic night and perform something you've never done",
  "Attend a religious service of a faith completely different from your own",
  "Pretend to be a tourist in your own city and ask strangers for directions",
  "Go to a cemetery at night and read gravestones by flashlight",
  "Dumpster dive behind a bakery at closing time",
  "Sneak onto a rooftop and watch the sunset",
  "Go to a fancy restaurant in pajamas",
  "Take a bus to the end of the line and explore whatever neighborhood you end up in",
  "Go to a bar alone and make up an elaborate fake backstory for yourself",
  "Attend a city council meeting and ask bizarre questions during public comment",
  "Go to an auction and bid on something ridiculous",
  "Visit every floor of a parking garage and rate the views",
  "Find an abandoned building and photograph it from every angle",
  "Go to a car dealership and test drive a car you could never afford",
  "Attend a time-share presentation for the free stuff",
  "Go to a pet store and ask extensive questions about exotic animals",
  "Find a street performer and become their hype person",
  "Go to a laundromat at 2am and talk to whoever's there",
  "Ride public transit for an entire day without a destination",
  "Go to a grocery store and rearrange items on the shelf artistically",
  "Find a 24-hour diner and spend the entire night there writing",
  "Go to a thrift store and buy the ugliest outfit, then wear it out",
  "Attend a protest for a cause you know nothing about",
  "Go to an airport and watch people reunite at arrivals for hours",
  "Find a body of water and go swimming at midnight",
  "Go to a casino with exactly $20 and make it last all night",
  "Hitchhike to the next town over",
  "Sleep in your car in a Walmart parking lot",
  "Go to a truck stop and interview the truckers about their lives",
  "Sneak into a second movie after your first one ends",
  "Go to a drive-in theater and watch from outside the fence",
  "Find a construction site at night and explore it",
  "Go to a 24-hour gym at 3am and see who else is there",
  "Spend an entire day only speaking in questions",
  "Go to a fortune teller and argue with their predictions",
  "Find a psychic hotline and call it just to chat",
  "Go to a speed dating event with no intention of dating",
  "Attend an AA meeting as an observer (with permission)",
  "Go to a political rally for someone you disagree with",
  "Find a drum circle and join in with no rhythm",
  "Go to a poetry slam and perform something you wrote in the car",
  "Attend a funeral for someone you don't know (from the back)",
  "Go to an estate sale and learn about the deceased from their stuff",
  "Find a group of strangers playing a sport and ask to join",
  "Go to a firing range and pretend it's your first time",
  "Attend a gun show and ask philosophical questions about violence",
  "Go to a flea market and haggle aggressively over cheap items",
  "Find a farm and offer to work for the day for free",
  "Go to a meditation retreat and try not to laugh",
  "Attend a yoga class and be intentionally inflexible",
  "Go to a CrossFit gym and question their methods",
  "Find a chess tournament and challenge the winner",
  "Go to a bingo hall and yell BINGO when you don't have it",
  "Attend a dog show without a dog",
  "Go to a baby shower for someone you've never met",
  "Find a graduation ceremony and clap enthusiastically for every name",
  "Go to a strip mall and review every business on Yelp",
  "Attend a cult's recruitment meeting out of curiosity",
  "Go to a nursing home and ask the residents for life advice",
  "Find a prison pen pal through a legitimate service",
  "Go to a homeless shelter and volunteer for the night shift",
  "Attend a secret society meeting (if you can find one)",
  "Go to a Masonic temple and ask how to join",
  "Find a witch coven and ask to observe a ritual",
  "Go to a satanic temple meeting out of curiosity",
  "Attend a UFO spotting group's night watch",
  "Go to a conspiracy theory meetup and play devil's advocate",
  "Find a ghost hunting group and tag along",
  "Go to a séance and remain skeptical throughout",
  "Attend a past life regression hypnosis session",
  "Go to a float tank and confront your inner demons",
  "Find an isolation chamber and see how long you last",
  "Go to a sensory deprivation experience and document it",
  "Attend an ayahuasca ceremony preparation meeting",
  "Go to a sweat lodge ceremony (with permission and respect)",
  "Find a vision quest guide and learn about the process",
  "Go to a shamanic drumming circle and let go",
  "Attend a fire walking seminar and watch people do it",
  "Go to a Tony Robbins event and analyze the psychology",
  "Find a pickup artist seminar and observe the absurdity",
  "Go to a multi-level marketing presentation and count the red flags",
  "Attend a prosperity gospel church service",
  "Go to a snake handling church (observe only)",
  "Find a faith healer and document the experience",
  "Go to a megachurch and count the TVs",
  "Attend a Scientology intro session and take notes",
  "Go to a Hare Krishna temple for the free food",
  "Find a silent retreat and see if you can last a day",
  "Go to a monastery and ask about becoming a monk",
  "Attend a Quaker meeting and sit in silence",
  "Go to a speaking in tongues service and try to translate",
  "Find an exorcism training seminar and observe",
  "Go to a palm reader and give them fake information",
  "Attend a tarot reading and ask only about lunch",
  "Go to a crystal healing session and remain stone-faced",
  "Find a reiki practitioner and ask scientific questions",
  "Go to an acupuncture appointment and count the needles",
  "Attend a sound bath and critique the acoustics",
  "Go to a gong meditation and try not to flinch",
  "Find a breathwork class and hyperventilate intentionally",
  "Go to a laughter yoga session and observe without laughing",
  "Attend a rage room and break things methodically",
  "Go to an escape room alone and see if you can beat it",
  "Find a murder mystery dinner and accuse the waiter",
  "Go to a haunted house and critique the scares",
  "Attend a corn maze at night without a flashlight",
  "Go to a pumpkin patch in spring and ask about pumpkins",
  "Find a Christmas tree farm in July and inquire about trees",
  "Go to a Halloween store in February",
  "Attend an Easter egg hunt as an adult without children",
  "Go to a Santa Claus photo op in August",
  "Find a New Year's party on a random Tuesday",
  "Go to a St. Patrick's Day parade sober",
  "Attend a Mardi Gras celebration in a landlocked state",
  "Go to a Cinco de Mayo party and speak only French",
  "Find a Fourth of July celebration in another country",
  "Go to a Thanksgiving dinner at a restaurant alone",
  "Attend a Valentine's Day event single and loving it",
  "Go to a Mother's Day brunch without your mother",
  "Find a Father's Day BBQ and grill something weird",
  "Go to a Labor Day event and don't labor",
  "Attend a Memorial Day service and learn the history",
  "Go to a Veterans Day parade and thank everyone",
  "Find a Columbus Day celebration and question it",
  "Go to an Indigenous Peoples Day event and listen",
  "Attend a Juneteenth celebration and learn",
  "Go to a Pride parade in the most boring outfit possible",
  "Find an Earth Day event and pick up trash aggressively",
  "Go to an Arbor Day celebration and hug a tree literally",
  "Attend a Groundhog Day event and make predictions",
  "Go to an April Fools Day prank meetup and out-prank everyone",
  "Find a Pi Day celebration and recite digits",
  "Go to a Star Wars Day event as a Star Trek fan",
  "Attend a Talk Like a Pirate Day event seriously",
  "Go to a National Donut Day and eat only one",
  "Find a National Hot Dog Day and ask for a veggie dog",
  "Go to a National Pizza Day and order pineapple",
  "Attend a National Ice Cream Day and get the weirdest flavor",
  "Go to a National Coffee Day and order decaf",
  "Find a National Beer Day and order water",
  "Go to a National Wine Day and ask for grape juice",
  "Attend a National Tequila Day and do math",
  "Go to a food truck rally and try everything",
  "Find a chili cook-off and bring store-bought chili",
  "Go to a BBQ competition and ask for tofu",
  "Attend a pie eating contest and eat slowly",
  "Go to a hot dog eating contest and watch in horror",
  "Find a watermelon seed spitting contest and win",
  "Go to a cheese rolling race and question everything",
  "Attend a wife carrying competition and analyze it",
  "Go to a bog snorkeling event and train for it",
  "Find a toe wrestling championship and challenge someone",
  "Go to a rock paper scissors tournament with a strategy",
  "Attend an air guitar competition with an air band",
  "Go to a beard competition without a beard",
  "Find a mullet festival and appreciate the artistry",
  "Go to a ugly sweater contest in summer",
  "Attend a costume contest as yourself",
  "Go to a talent show with no talent and own it",
  "Find a lip sync battle and go off script",
  "Go to a dance-off and do the robot exclusively",
  "Attend a rap battle and use only compliments",
  "Go to a roast and be genuinely nice",
  "Find an improv show and heckle supportively",
  "Go to a comedy club and laugh at everything",
  "Attend a magic show and figure out every trick",
  "Go to a hypnosis show and resist hypnosis",
  "Find a ventriloquist and talk to the puppet only",
  "Go to a circus and befriend a clown",
  "Attend a rodeo and root for the animals",
  "Go to a monster truck rally and evaluate fuel efficiency",
  "Find a demolition derby and appreciate the chaos",
  "Go to a car show and ask about bus routes",
  "Attend a boat show and ask about seasickness",
  "Go to an RV show and live in one for a day",
  "Find a tiny house expo and question the bathrooms",
  "Go to a home show and ask about haunted houses",
  "Attend a garden show and plant something immediately",
  "Go to a craft fair and buy something you'll never use",
  "Find an art show and interpret everything literally",
  "Go to a sculpture garden and touch nothing",
  "Attend a museum after dark event and get lost",
  "Go to a planetarium show and ask about aliens",
  "Find an aquarium and pick a favorite fish",
  "Go to a zoo and observe the observers",
  "Attend a butterfly garden and stand very still",
  "Go to a botanical garden and smell every flower",
  "Find a nature preserve and go completely off trail",
  "Go to a state park and find the least popular trail",
  "Attend a national park ranger talk and ask weird questions",
  "Go to a lighthouse and count the stairs",
  "Find a covered bridge and research its history",
  "Go to a historical site and reenact something",
  "Attend a Civil War reenactment and pick the losing side",
  "Go to a Renaissance faire as a time traveler from the future",
  "Find a Viking festival and challenge someone to combat",
  "Go to a pirate festival and speak normally",
  "Attend a steampunk convention and ask about WiFi",
  "Go to an anime convention and learn something new",
  "Find a comic book convention and start debates",
  "Go to a sci-fi convention as a fantasy fan",
  "Attend a horror convention and never flinch",
  "Go to a gaming convention and beat everyone at something",
  "Find a board game cafe and play something alone",
  "Go to a video game arcade and master one game",
  "Attend a pinball tournament and tilt intentionally",
  "Go to a bowling alley and use the wrong hand",
  "Find a mini golf course and keep score honestly",
  "Go to a driving range and hit only one ball",
  "Attend a batting cage and swing at nothing",
  "Go to a go-kart track and let everyone pass you",
  "Find a laser tag arena and be a pacifist",
  "Go to a trampoline park and bounce minimally",
  "Attend a climbing gym and stay on the ground",
  "Go to an ice skating rink and hold the wall",
  "Find a roller skating rink and fall gracefully",
  "Go to a skate park and appreciate from afar",
  "Attend a BMX track and cheer for everyone",
  "Go to a motocross event and worry about safety",
  "Find a dirt bike trail and hike it instead",
  "Go to an ATV park and ask about emissions",
  "Attend a snowmobile event in summer",
  "Go to a ski resort in July and ride the lifts",
  "Find a water park and only do the lazy river",
  "Go to a wave pool and fight the waves",
  "Attend a slip and slide event and go slowly",
  "Go to a beach and build the most elaborate sandcastle",
  "Find a lake and skip exactly 100 stones",
  "Go to a river and follow it as far as you can",
  "Attend a waterfall and stand behind it",
  "Go to a hot spring and overstay your welcome",
  "Find a cold plunge and time yourself",
  "Go to a sauna and bring a book",
  "Attend a spa and ask for unusual treatments",
  "Go to a massage parlor and remain tense",
  "Find a nail salon and pick the wildest design",
  "Go to a hair salon and ask for the stylist's choice",
  "Attend a barber shop and stay for the conversation",
  "Go to a tattoo parlor and get something tiny",
  "Find a piercing studio and ask endless questions",
  "Go to a body modification convention and observe",
  "Attend a wellness expo and try everything free",
  "Go to a health food store and sample everything",
  "Find a farmers market and buy only purple vegetables",
  "Go to a fish market and learn to identify everything",
  "Attend a butcher shop and ask about the process",
  "Go to a cheese shop and find the stinkiest one",
  "Find a chocolate factory tour and control yourself",
  "Go to a brewery tour and take notes seriously",
  "Attend a distillery tour and ask about prohibition",
  "Go to a winery and spit like the pros",
  "Find a cidery and compare every variety",
  "Go to a meadery and learn about bees",
  "Attend a sake brewery and bow respectfully",
  "Go to a tea house and stay for hours",
  "Find a coffee roaster and become a snob temporarily",
  "Go to a bakery at opening time and buy everything fresh",
  "Attend a cooking class and follow no rules",
  "Go to a knife skills class and be extra careful",
  "Find a fermentation workshop and start a project",
  "Go to a canning class and preserve something weird",
  "Attend a foraging walk and eat something wild",
  "Go to a mushroom hunting expedition and be very careful",
  "Find a fishing charter and throw them all back",
  "Go to a hunting safety course and pass",
  "Attend an archery range and find your zen",
  "Go to a shooting range and wear ear protection proudly",
  "Find a martial arts dojo and bow to everyone",
  "Go to a boxing gym and just hit the bag",
  "Attend a wrestling practice and watch from afar",
  "Go to a fencing club and challenge someone",
  "Find a HEMA group and swing a sword",
  "Go to a LARPing event and take it seriously",
  "Attend a D&D session and become your character",
  "Go to a tabletop gaming meetup and learn something new",
  "Find a puzzle competition and solve nothing",
  "Go to a crossword tournament and finish last proudly",
  "Attend a Sudoku championship and count squares",
  "Go to a Rubik's cube meetup and watch in awe",
  "Find a memory competition and forget your name",
  "Go to a spelling bee and misspell your own name",
  "Attend a trivia night and win one category",
  "Go to a pub quiz and make up answers confidently",
  "Find a debate club and argue both sides",
  "Go to a Toastmasters meeting and give a speech",
  "Attend a book club for a book you haven't read",
  "Go to a writing workshop and share something vulnerable",
  "Find a critique group and take notes",
  "Go to a NaNoWriMo meetup in any month",
  "Attend a journaling workshop and write uncensored",
  "Go to a calligraphy class and make beautiful mistakes",
  "Find a lettering workshop and design your name",
  "Go to a painting class and use only one color",
  "Attend a drawing meetup and sketch everyone there",
  "Go to a life drawing class and volunteer as the model",
  "Find a sculpture class and make something ugly on purpose",
  "Go to a pottery wheel and create chaos",
  "Attend a glass blowing demonstration and feel the heat",
  "Go to a blacksmithing class and make a nail",
  "Find a woodworking shop and sand something smooth",
  "Go to a welding class and wear all the gear",
  "Attend a sewing circle and prick your finger",
  "Go to a knitting group and make a very long scarf",
  "Find a crochet meetup and learn one stitch",
  "Go to a quilting bee and cut something crooked",
  "Attend an embroidery class and personalize something",
  "Go to a macramé workshop and tie many knots",
  "Find a basket weaving class and question your life choices",
  "Go to a paper making workshop and touch the pulp",
  "Attend a bookbinding class and make your own journal",
  "Go to a printmaking studio and ink your hands",
  "Find a screen printing shop and make a shirt",
  "Go to a tie-dye event and embrace the chaos",
  "Start a conversation with a complete stranger and don't stop for an hour",
  "Go to a bridge and wave at every car that passes",
  "Find the highest point in your area and yell into the void",
  "Take a photo with every statue you can find in one day",
  "Go to a pet adoption event and interview the animals",
  "Find a 24-hour restaurant and order breakfast at midnight",
  "Go to a convenience store and buy one item from every aisle",
  "Visit three different religious buildings in one day",
  "Find a piano in public and play something you barely know",
  "Go to a hospital cafeteria and eat like a doctor",
  "Attend a court hearing open to the public and observe justice",
  "Find a naturist beach or resort and just observe the vibes (legally)",
  "Go to a car wash and stay in the car the whole time",
  "Attend a timeshare presentation with the most absurd questions",
  "Find a protest you disagree with and listen quietly",
  "Go to a store and try on the most expensive thing they have",
  "Leave anonymous compliment notes on parked cars",
  "Go to a high school sports game for a school you don't know",
  "Find a parade route before the parade and claim the best spot",
  "Go to a food bank and volunteer to sort the weirdest donations",
  "Attend a city hall meeting and ask about the town mascot",
  "Find an all-night diner and document every customer who enters",
  "Go to a batting cage and narrate your own at-bats dramatically",
  "Take public transit to the roughest neighborhood and find beauty there",
  "Go to a fancy department store and test all the perfumes",
  "Find a free concert and dance like no one is watching",
  "Go to a random church potluck and bring something unusual",
  "Attend a class reunion for a school you didn't attend",
  "Find a tractor pull and cheer for the underdogs",
  "Go to a county fair and judge the livestock judges",
  "Attend a soap box derby and interview the kids",
  "Find a demolition site and watch safely from the perimeter",
  "Go to an estate auction and bid on something with a story",
  "Attend a livestock auction and learn the lingo",
  "Find a machinery auction and appreciate the engineering",
  "Go to a police auction and wonder about the backstories",
  "Attend a government surplus sale and buy something weird",
  "Find a storage unit auction and imagine the contents",
  "Go to a bail bonds office and observe the waiting room",
  "Attend traffic court and appreciate your clean record",
  "Find a small claims court session and pick sides mentally",
  "Go to a family court waiting area and people watch",
  "Attend a naturalization ceremony and feel patriotic",
  "Find a military recruitment office and ask about the benefits",
  "Go to a veteran's hall and buy them all drinks",
  "Attend an Elks Lodge event as a guest",
  "Find a Moose Lodge and learn the secret handshake",
  "Go to an Eagles club and observe the dynamics",
  "Attend a Knights of Columbus fish fry and eat too much",
  "Find a VFW hall and listen to stories",
  "Go to a Legion hall and pay your respects",
  "Attend a Rotary Club meeting and network aggressively",
  "Find a Kiwanis Club event and volunteer",
  "Go to a Lions Club fundraiser and buy everything",
  "Attend an Optimist Club meeting and be pessimistic",
  "Find a Jaycees event and act older than you are",
  "Go to a Junior League meeting and take notes",
  "Attend a garden club meeting and talk only about weeds",
  "Find a bird watching group and misidentify everything",
  "Go to a star gazing club and ask about astrology",
  "Attend a rock hounding group expedition and find nothing",
  "Find a metal detecting club and dig holes",
  "Go to a coin collecting meetup and spend some coins",
  "Attend a stamp collecting club and lick nothing",
  "Find a model train club and play conductor",
  "Go to a model airplane flying field and watch crashes",
  "Attend a drone racing event and bet on outcomes",
  "Find a ham radio club and say 'over' after everything",
  "Go to a maker space and break something fixably",
  "Attend a hacker space and learn one command",
  "Find a robotics club and befriend a robot",
  "Go to an electronics meetup and shock yourself safely",
  "Attend an inventor's club and pitch a ridiculous idea",
  "Find a 3D printing meetup and print something useless",
  "Go to a CNC machining shop and smell the metal"
];

// Shuffle on module load
const boredActivities = shuffleArray(boredActivitiesUnshuffled);

const homeResources = [
  { name: "Meetup.com", url: "https://www.meetup.com", description: "Find local groups based on your interests" },
  { name: "Eventbrite", url: "https://www.eventbrite.com", description: "Discover events happening near you" },
  { name: "Facebook Events", url: "https://www.facebook.com/events", description: "Search for local events and groups in your area" },
  { name: "NomadTable", url: "https://nomadtable.app", description: "Social dining experiences with locals and travelers" },
];

const homeSuggestions = [
  "Search Google Maps for 'events near me' or 'things to do near me'",
  "Look for community bulletin boards at local coffee shops or libraries",
  "Check your local subreddit for meetups and events",
  "Visit your local library - many host free community events",
  "Search for volunteer opportunities in your area",
  "Look for local Discord servers for your city or interests",
  "Check Nextdoor for neighborhood events and groups",
  "Find local clubs or classes (pottery, dance, sports leagues, etc.)"
];

const awayResources = [
  { name: "Couchers.org", url: "https://couchers.org", description: "Free community-driven hospitality exchange" },
  { name: "Couchsurfing", url: "https://www.couchsurfing.com", description: "Meet locals and travelers worldwide" },
  { name: "Workaway", url: "https://www.workaway.info", description: "Cultural exchange through volunteering" },
  { name: "Meetup.com", url: "https://www.meetup.com", description: "Find local groups wherever you are" },
  { name: "Hostelworld", url: "https://www.hostelworld.com", description: "Social hostels with events and common areas" },
  { name: "NomadTable", url: "https://nomadtable.app", description: "Social dining experiences with locals and travelers" },
];

const awaySuggestions = [
  "Use the Meetup app to find events in your current location",
  "Check if your hostel or accommodation has social events",
  "Look for free walking tours - great way to meet other travelers",
  "Find local language exchange meetups",
  "Search for 'digital nomad' groups in the city you're visiting",
  "Check Facebook for expat groups in your current location",
  "Visit popular cafés known for remote workers and travelers",
  "Look for local cooking classes or food tours"
];

export default function CureToLonelinessGame() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [currentActivity, setCurrentActivity] = useState<string>("");

  const getRandomActivity = () => {
    const randomIndex = Math.floor(Math.random() * boredActivities.length);
    setCurrentActivity(boredActivities[randomIndex]);
    setGameState("bored");
  };

  const resetGame = () => {
    setGameState("menu");
    setCurrentActivity("");
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-primary/30">
      <CardHeader>
        <CardTitle className="text-2xl text-primary flex items-center gap-2">
          <Heart className="h-6 w-6" />
          The Cure to Loneliness and Boredom
        </CardTitle>
        <CardDescription>
          Find connection or adventure - the choice is yours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "menu" && (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="mystical"
              size="lg"
              className="flex-1"
              onClick={() => setGameState("lonely-choice")}
            >
              <Heart className="mr-2 h-5 w-5" />
              I am Lonely
            </Button>
            <Button
              variant="mystical"
              size="lg"
              className="flex-1"
              onClick={getRandomActivity}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              I am Bored
            </Button>
          </div>
        )}

        {gameState === "bored" && (
          <div className="space-y-4">
            <div className="p-6 bg-primary/10 rounded-lg border border-primary/30">
              <Badge variant="secondary" className="mb-3">Your Quest</Badge>
              <p className="text-lg text-foreground font-medium">{currentActivity}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetGame}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button variant="mystical" onClick={getRandomActivity}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Another One
              </Button>
            </div>
          </div>
        )}

        {gameState === "lonely-choice" && (
          <div className="space-y-4">
            <p className="text-muted-foreground">Where are you right now?</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="mystical"
                size="lg"
                className="flex-1"
                onClick={() => setGameState("lonely-home")}
              >
                <MapPin className="mr-2 h-5 w-5" />
                I'm in the place I live
              </Button>
              <Button
                variant="mystical"
                size="lg"
                className="flex-1"
                onClick={() => setGameState("lonely-away")}
              >
                <Plane className="mr-2 h-5 w-5" />
                I'm away from home
              </Button>
            </div>
            <Button variant="outline" onClick={resetGame}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {gameState === "lonely-home" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Find Your People Locally</h3>
              <div className="grid gap-3">
                {homeResources.map((resource) => (
                  <a
                    key={resource.name}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{resource.name}</p>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-primary" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">More Ideas</h3>
              <ul className="space-y-2">
                {homeSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="outline" onClick={resetGame}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {gameState === "lonely-away" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Connect While Traveling</h3>
              <div className="grid gap-3">
                {awayResources.map((resource) => (
                  <a
                    key={resource.name}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/30 hover:bg-primary/20 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{resource.name}</p>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-primary" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">More Ideas</h3>
              <ul className="space-y-2">
                {awaySuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="outline" onClick={resetGame}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
