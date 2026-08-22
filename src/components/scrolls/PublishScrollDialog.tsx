import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BookMarked, Loader2, Copy, Check } from "lucide-react";
import { publishScroll, publicationUrl, type Publication } from "@/lib/scroll-publish";
import { toast } from "@/hooks/use-toast";

interface Props {
  scrollId: string;
  meta: { title: string; subtitle: string | null; blurb: string | null; cover_image_url: string | null };
  onPublished?: (pub: Publication) => void;
}

export function PublishScrollDialog({ scrollId, meta, onPublished }: Props) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "unlisted">("public");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Publication | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setResult(null);
    setCopied(false);
    setVisibility("public");
  };

  const submit = async () => {
    setBusy(true);
    try {
      const pub = await publishScroll(scrollId, visibility);
      setResult(pub);
      onPublished?.(pub);
      toast({ title: "Published" });
    } catch (e) {
      toast({
        title: "Publish failed",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(publicationUrl(result.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BookMarked className="h-4 w-4 mr-2" /> Publish
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{result ? "Published" : "Publish to the Castle Library"}</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="rounded border border-border p-3 bg-muted/30 flex gap-3">
              {meta.cover_image_url ? (
                <img
                  src={meta.cover_image_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-16 h-20 object-cover rounded"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-16 h-20 rounded bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
              <div className="min-w-0">
                <div className="font-semibold truncate">{meta.title}</div>
                {meta.subtitle && <div className="text-xs italic text-muted-foreground truncate">{meta.subtitle}</div>}
                {meta.blurb && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{meta.blurb}</div>}
              </div>
            </div>

            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as "public" | "unlisted")}>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="public" id="vis-public" className="mt-1" />
                <Label htmlFor="vis-public" className="cursor-pointer">
                  <div className="font-medium">Public</div>
                  <div className="text-xs text-muted-foreground">Listed in the Castle Library. Anyone can discover and read it.</div>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="unlisted" id="vis-unlisted" className="mt-1" />
                <Label htmlFor="vis-unlisted" className="cursor-pointer">
                  <div className="font-medium">Unlisted</div>
                  <div className="text-xs text-muted-foreground">Only people with the link can read it. Not in the Library.</div>
                </Label>
              </div>
            </RadioGroup>

            <p className="text-xs text-muted-foreground italic">
              Publishing creates a snapshot at a stable link. Edits to this Scroll won't appear
              until you publish again — republishing updates the same link, so
              everyone you've shared it with sees the newest version.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">Your Scroll is live. Share the link:</p>
            <div className="flex items-center gap-2 rounded border border-border p-2 bg-muted/30">
              <code className="text-xs flex-1 truncate">{publicationUrl(result.slug)}</code>
              <Button size="sm" variant="ghost" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
              <Button asChild>
                <a href={`/library/${result.slug}`} target="_blank" rel="noreferrer">Open</a>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
