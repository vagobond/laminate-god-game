import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** username without "@", or the user id */
  slug: string;
  displayName: string;
}

/**
 * Embed / share snippets for a profile.
 *
 * The image card is the one that works everywhere: WordPress (.com and
 * self-hosted), Substack, Medium, Ghost, GitHub READMEs, forums, email
 * signatures — anywhere an <img> or Markdown image is allowed. The iframe
 * only survives on sites you fully control, so it's offered last.
 */
export function EmbedProfileDialog({ open, onOpenChange, slug, displayName }: Props) {
  const [size, setSize] = useState<"badge" | "og">("badge");
  const profileUrl = `https://xcrol.com/@${slug}`;
  const cardUrl = `https://xcrol.com/card/${slug}.png${size === "badge" ? "?size=badge" : ""}`;
  const dims = size === "badge" ? { w: 600, h: 150 } : { w: 600, h: 315 };
  const alt = `${displayName} on Xcrol`;

  const snippets = {
    html: `<a href="${profileUrl}"><img src="${cardUrl}" alt="${alt.replace(/"/g, "&quot;")}" width="${dims.w}" height="${dims.h}" style="max-width:100%;height:auto;border-radius:12px"></a>`,
    markdown: `[![${alt.replace(/\]/g, "")}](${cardUrl})](${profileUrl})`,
    bbcode: `[url=${profileUrl}][img]${cardUrl}[/img][/url]`,
    image: cardUrl,
    iframe: `<iframe src="https://xcrol.com/embed/${slug}" width="340" height="200" style="border:0;border-radius:12px" title="${alt.replace(/"/g, "&quot;")}" loading="lazy"></iframe>`,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Embed this profile</DialogTitle>
          <DialogDescription>
            The image card works on WordPress, Substack, Medium, GitHub, forums and email — anywhere an
            image is allowed. Clicking it opens the profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Card size:</span>
          <Button variant={size === "badge" ? "default" : "outline"} size="sm" onClick={() => setSize("badge")}>
            Badge (600×150)
          </Button>
          <Button variant={size === "og" ? "default" : "outline"} size="sm" onClick={() => setSize("og")}>
            Card (600×315)
          </Button>
        </div>

        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img
            key={cardUrl}
            src={cardUrl}
            alt={alt}
            width={dims.w}
            height={dims.h}
            className="w-full h-auto rounded-xl border border-border"
            loading="lazy"
          />
        </a>

        <Tabs defaultValue="html">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="bbcode">BBCode</TabsTrigger>
            <TabsTrigger value="image">Image URL</TabsTrigger>
            <TabsTrigger value="iframe">iframe</TabsTrigger>
          </TabsList>
          <SnippetTab value="html" code={snippets.html} hint="WordPress (Custom HTML block), Substack, Ghost, Squarespace, email signatures." />
          <SnippetTab value="markdown" code={snippets.markdown} hint="GitHub / GitLab READMEs, Obsidian, Reddit, Discord, most static-site generators." />
          <SnippetTab value="bbcode" code={snippets.bbcode} hint="phpBB, vBulletin and other forums." />
          <SnippetTab value="image" code={snippets.image} hint="Paste as an image anywhere (Medium: paste the URL on an empty line). Link it to the profile if the editor allows." />
          <SnippetTab value="iframe" code={snippets.iframe} hint="Only for sites you control — most platforms strip iframes." />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SnippetTab({ value, code, hint }: { value: string; code: string; hint: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't access the clipboard — select the text and copy it manually.");
    }
  };
  return (
    <TabsContent value={value} className="space-y-2">
      <div className="relative">
        <textarea
          readOnly
          value={code}
          onFocus={(e) => e.currentTarget.select()}
          rows={3}
          className="w-full rounded-md border border-input bg-muted/40 p-2 pr-10 font-mono text-xs leading-relaxed resize-none"
        />
        <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={copy} aria-label="Copy">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </TabsContent>
  );
}
