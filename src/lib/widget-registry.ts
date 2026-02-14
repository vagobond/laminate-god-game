export interface WidgetDefinition {
  key: string;
  name: string;
  siteName: string;
  description: string;
  icon: string;
  getEmbedUrl: (username: string) => string;
  height: number;
  usernameLabel: string;
  usernamePlaceholder: string;
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    key: "microvictoryarmy",
    name: "MicroVictoryArmy",
    siteName: "MicroVictoryArmy.com",
    description: "Show your micro victories on your profile",
    icon: "🏆",
    getEmbedUrl: (username) => `https://microvictoryarmy.com/embed/${username}`,
    height: 400,
    usernameLabel: "Your MicroVictoryArmy username",
    usernamePlaceholder: "e.g. johndoe",
  },
  {
    key: "w3wu",
    name: "W3WU",
    siteName: "W3WU.com",
    description: "Show your W3WU profile on your Xcrol profile",
    icon: "🌐",
    getEmbedUrl: (username) => `https://w3wu.lovable.app/embed/${username}`,
    height: 400,
    usernameLabel: "Your W3WU username",
    usernamePlaceholder: "e.g. johndoe",
  },
  {
    key: "voicemarkr",
    name: "VoiceMarkr",
    siteName: "VoiceMarkr.com",
    description: "Show your VoiceMarkr profile on your Xcrol profile",
    icon: "🎙️",
    getEmbedUrl: (username) => `https://www.voicemarkr.com/embed/${username}`,
    height: 400,
    usernameLabel: "Your VoiceMarkr username",
    usernamePlaceholder: "e.g. johndoe",
  },
  {
    key: "baoism",
    name: "Baoism",
    siteName: "Baoism.org",
    description: "Show your Baoism profile on your Xcrol profile",
    icon: "☯️",
    getEmbedUrl: (username) => `https://www.baoism.org/embed/${username}`,
    height: 400,
    usernameLabel: "Your Baoism username",
    usernamePlaceholder: "e.g. johndoe",
  },
];

/** Lookup a widget by key */
export const getWidgetByKey = (key: string) => WIDGET_REGISTRY.find((w) => w.key === key);
