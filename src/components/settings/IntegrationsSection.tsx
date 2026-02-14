import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Sparkles } from "lucide-react";

const INTEGRATIONS = [
  { name: "MicroVictoryArmy", url: "https://MicroVictoryArmy.com" },
  { name: "VoiceMarkr", url: "https://VoiceMarkr.com" },
  { name: "Baoism", url: "https://Baoism.org" },
  { name: "XMap", url: "https://xmap.lovable.app" },
  { name: "ZguideZ", url: "https://ZguideZ.com" },
  { name: "Litether", url: "https://Litether.com" },
  { name: "A Very Good Novel", url: "https://AVeryGoodNovel.com" },
  { name: "Lamster Quest", url: "https://la.mster.quest" },
];

export const IntegrationsSection = () => (
  <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        Xcrol Integrations
      </CardTitle>
      <CardDescription>Expand the Power of Your Xcrol</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {INTEGRATIONS.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
          >
            <span className="text-sm font-medium group-hover:text-primary transition-colors">{item.name}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        ))}
      </div>
    </CardContent>
  </Card>
);
