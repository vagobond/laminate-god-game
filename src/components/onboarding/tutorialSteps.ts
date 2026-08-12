// Tutorial step definitions for "The Awakening of the Scroll"
// Completely siloed from main application logic

export interface TutorialStep {
  id: string;
  anchor: string; // CSS selector, or keyword: "center" | "page"
  anchorLabel: string; // Human-readable anchor description
  title?: string;
  text: string;
  subtext?: string;
  route?: string; // Page the tour navigates to for this step (logged-in users)
  guestRoute?: string; // Fallback page for guests when `route` requires auth
  guestAnchor?: string; // Anchor selector used on guestRoute (painted map hotspots)
  isFirst?: boolean;
  isFinal?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "intro",
    anchor: "center",
    anchorLabel: "Welcome",
    text: "This is a scroll, not a feed.\nIt is a map of people, places, and time.\nLet me show you how it works.",
    route: "/powers",
    guestRoute: "/map",
    isFirst: true,
  },
  {
    id: "river",
    anchor: "page",
    anchorLabel: "The River",
    text: "This is The River.\nIt shows one moment per person per day.\nNothing is hidden. Nothing is promoted.",
    subtext: "The River always flows in time.",
    route: "/the-river",
  },
  {
    id: "river-filter",
    anchor: "page",
    anchorLabel: "Filtering The River",
    text: "You may narrow the River by trust.\nSometimes you want the crowd.\nSometimes, only your circle.",
    route: "/the-river",
  },
  {
    id: "daily-limit",
    anchor: "page",
    anchorLabel: "The Daily Limit",
    text: "Each person marks the day once.\nLimits keep the map readable.\nTomorrow, the River flows again.",
    route: "/the-river",
  },
  {
    id: "brook",
    anchor: "page",
    anchorLabel: "The Brook",
    text: "A Brook is a River for two.\nPrivate. Ongoing. Quiet.\nIt exists without pressure.",
    subtext: "Brooks are found within The Forest. They may rest or fade without explanation.",
    route: "/the-forest?tab=brooks",
    guestRoute: "/map",
    guestAnchor: "[data-tutorial='brooks']",
  },
  {
    id: "you",
    anchor: "page",
    anchorLabel: "You",
    text: "This is You.\nYour profile is not one face.\nEach friend sees only what you allow.",
    route: "/profile",
    guestRoute: "/map",
    guestAnchor: "[data-tutorial='you']",
  },
  {
    id: "forest",
    anchor: "page",
    anchorLabel: "The Forest",
    text: "This is The Forest.\nFriendships grow here.\nInvite carefully. Strong roots matter.",
    route: "/the-forest",
    guestRoute: "/map",
    guestAnchor: "[data-tutorial='forest']",
  },
  {
    id: "trust-levels",
    anchor: "page",
    anchorLabel: "Trust Levels",
    text: "Not all bonds are equal.\nTrust levels decide what each person may see.\nYou may change them at any time.",
    route: "/the-forest",
    guestRoute: "/map",
    guestAnchor: "[data-tutorial='forest']",
  },
  {
    id: "world",
    anchor: "page",
    anchorLabel: "The World",
    text: "This is The World.\nReal people, in real places.\nCommunity begins where you stand.",
    route: "/irl-layer",
    guestRoute: "/map",
    guestAnchor: "[data-tutorial='world']",
  },
  {
    id: "meetups",
    anchor: "page",
    anchorLabel: "Meetups & Hosting",
    text: "Here, people meet.\nFor walks, food, travel, or shelter.\nAlways guided by trust.",
    route: "/irl-layer",
    guestRoute: "/map",
    guestAnchor: "[data-tutorial='world']",
  },
  {
    id: "strata",
    anchor: "page",
    anchorLabel: "The Strata",
    text: "Beneath the map are the Strata.\nNo algorithms.\nNo data trade.\nOnly what you permit.",
    subtext: "Some layers connect to other worlds.",
    route: "/settings",
    guestRoute: "/map",
    guestAnchor: "[data-tutorial='strata']",
  },
  {
    id: "village",
    anchor: "page",
    anchorLabel: "The Village",
    text: "This is The Village.\nGroups form here — by invitation and request.\nEach one has its own culture, its own trust.",
    subtext: "Post, discuss, and build together. Admins shape the space.",
    route: "/the-village",
  },
  {
    id: "town",
    anchor: "page",
    anchorLabel: "The Town",
    text: "This is The Town.\nA marketplace for your community.\nOffer, seek, trade — no middleman, no algorithm.",
    subtext: "Housing, services, goods, and community needs — all in one square.",
    route: "/the-town",
  },
  {
    id: "castle",
    anchor: "[data-tutorial='castle']",
    anchorLabel: "The Castle",
    text: "Beyond all of this… there is The Castle.\nNot everyone will see it.\nEntry is earned — through invitations, through use, through quests not yet revealed.",
    subtext: "Imagine being invited to live in a castle. That is what awaits. Watch for the signs.",
    route: "/map",
  },
  {
    id: "complete",
    anchor: "center",
    anchorLabel: "The Map Is Yours",
    text: "You know the terrain now.\nThe rest is walking.",
    isFinal: true,
  },
];
