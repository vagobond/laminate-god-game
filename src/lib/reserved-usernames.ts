// Usernames live at the top-level route /:username, so a username equal to
// any static first path segment would be unreachable (the static route wins).
// Keep this list in sync with App.tsx's route table + worker paths; the DB
// mirrors it in a CHECK constraint (migration 20260822121000).
export const RESERVED_USERNAMES = new Set([
  // App.tsx route first-segments
  "admin",
  "auth",
  "brook",
  "content-policy",
  "developers",
  "every-country",
  "getting-started",
  "group",
  "hearthsurf",
  "host",
  "install-app",
  "invite-friends",
  "irl-layer",
  "library",
  "map",
  "messages",
  "mini-games-hub",
  "my-xcrol",
  "myxcrol",
  "oauth",
  "post",
  "powers",
  "privacy",
  "profile",
  "scrolls",
  "settings",
  "terms",
  "the-castle",
  "the-forest",
  "the-river",
  "the-town",
  "the-village",
  "u",
  "xcrol",
  // Worker / infrastructure paths and likely future routes
  "embed",
  "card",
  "assets",
  "api",
  "functions",
  "rest",
  "storage",
  "welcome",
  "home",
  "login",
  "logout",
  "signup",
  "search",
  "about",
  "help",
  "support",
  "notifications",
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}
