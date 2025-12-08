import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Sparkles, MapPin, Plane, ExternalLink, RefreshCw } from "lucide-react";

type GameState = "menu" | "bored" | "lonely-choice" | "lonely-home" | "lonely-away";

// Original activity suggestions inspired by spontaneous adventure
const boredActivities = [
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
  "Make something from scratch that you usually buy"
];

const homeResources = [
  { name: "Meetup.com", url: "https://www.meetup.com", description: "Find local groups based on your interests" },
  { name: "Eventbrite", url: "https://www.eventbrite.com", description: "Discover events happening near you" },
  { name: "Facebook Events", url: "https://www.facebook.com/events", description: "Search for local events and groups in your area" },
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
