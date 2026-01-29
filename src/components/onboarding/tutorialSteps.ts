// Tutorial step definitions for "The Awakening of the Scroll"
// Completely siloed from main application logic

export interface TutorialStep {
  id: string;
  anchor: string; // CSS selector or special keyword for positioning
  anchorLabel: string; // Human-readable anchor description
  title?: string;
  text: string;
  subtext?: string;
  isFirst?: boolean;
  isFinal?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "intro",
    anchor: "center",
    anchorLabel: "Welcome",
    text: "This is a scroll, not a feed.\nIt is a map of people, places, and time.\nLet me show you how it works.",
    isFirst: true,
  },
  {
    id: "river",
    anchor: "[data-tutorial='river']",
    anchorLabel: "The River",
    text: "This is The River.\nIt shows one moment per person per day.\nNothing is hidden. Nothing is promoted.",
    subtext: "The River always flows in time.",
  },
  {
    id: "river-filter",
    anchor: "[data-tutorial='river']",
    anchorLabel: "Filtering The River",
    text: "You may narrow the River by trust.\nSometimes you want the crowd.\nSometimes, only your circle.",
  },
  {
    id: "daily-limit",
    anchor: "[data-tutorial='river']",
    anchorLabel: "The Daily Limit",
    text: "Each person marks the day once.\nLimits keep the map readable.\nTomorrow, the River flows again.",
  },
  {
    id: "brook",
    anchor: "[data-tutorial='forest']",
    anchorLabel: "The Brook",
    text: "A Brook is a River for two.\nPrivate. Ongoing. Quiet.\nIt exists without pressure.",
    subtext: "Brooks are found within The Forest. They may rest or fade without explanation.",
  },
  {
    id: "you",
    anchor: "[data-tutorial='you']",
    anchorLabel: "You",
    text: "This is You.\nYour profile is not one face.\nEach friend sees only what you allow.",
  },
  {
    id: "forest",
    anchor: "[data-tutorial='forest']",
    anchorLabel: "The Forest",
    text: "This is The Forest.\nFriendships grow here.\nInvite carefully. Strong roots matter.",
  },
  {
    id: "trust-levels",
    anchor: "[data-tutorial='forest']",
    anchorLabel: "Trust Levels",
    text: "Not all bonds are equal.\nTrust levels decide what each person may see.\nYou may change them at any time.",
  },
  {
    id: "world",
    anchor: "[data-tutorial='world']",
    anchorLabel: "The World",
    text: "This is The World.\nReal people, in real places.\nCommunity begins where you stand.",
  },
  {
    id: "meetups",
    anchor: "[data-tutorial='world']",
    anchorLabel: "Meetups & Hosting",
    text: "Here, people meet.\nFor walks, food, travel, or shelter.\nAlways guided by trust.",
  },
  {
    id: "strata",
    anchor: "[data-tutorial='strata']",
    anchorLabel: "The Strata",
    text: "Beneath the map are the Strata.\nNo algorithms.\nNo data trade.\nOnly what you permit.",
    subtext: "Some layers connect to other worlds.",
  },
  {
    id: "complete",
    anchor: "center",
    anchorLabel: "The Map Is Yours",
    text: "You know the terrain now.\nThe rest is walking.",
    isFinal: true,
  },
];
