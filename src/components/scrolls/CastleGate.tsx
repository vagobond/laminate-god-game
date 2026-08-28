import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { BookOpen } from "lucide-react";

// The Castle Library is signup-gated (CD, 2026-08-28): anonymous visitors may
// read a publication's front matter (everything before the first chapter
// label); the rest requires a free Xcrol account. The popup pitches the
// account on arrival; the inline panel holds the line where the free preview
// ends. Bot link-previews are unaffected — the worker serves those.

function useAuthHref(): string {
  const location = useLocation();
  return `/auth?returnUrl=${encodeURIComponent(location.pathname + location.search)}`;
}

function GateButtons() {
  const href = useAuthHref();
  return (
    <div className="flex flex-col gap-2 w-full">
      <Button asChild size="lg">
        <Link to={href}>Get a free library card</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to={href}>I have one — sign in</Link>
      </Button>
    </div>
  );
}

export function CastleGateDialog({
  open,
  onOpenChange,
  bookTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-center">
            This library runs on library cards
          </DialogTitle>
          <DialogDescription className="text-center">
            {bookTitle ? `"${bookTitle}" is free to read, cover to cover.` : "Every book in the Castle Library is free to read."}{" "}
            The card is an Xcrol account — it takes a minute, costs nothing, and comes with no ads and no data harvesting.
          </DialogDescription>
        </DialogHeader>
        <GateButtons />
      </DialogContent>
    </Dialog>
  );
}

export function CastleGatePanel({ bookTitle }: { bookTitle?: string }) {
  return (
    <div className="not-prose my-12 rounded-lg border border-primary/30 bg-primary/5 p-8 text-center space-y-4">
      <div className="flex justify-center"><BookOpen className="h-8 w-8 text-primary" /></div>
      <h3 className="font-serif text-xl font-semibold">The introduction is on the house</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        The rest{bookTitle ? ` of ${bookTitle}` : ""} is free too — you just need a library card.
        An Xcrol account takes a minute, costs nothing, and comes with no ads and no data harvesting.
      </p>
      <div className="max-w-xs mx-auto"><GateButtons /></div>
    </div>
  );
}
