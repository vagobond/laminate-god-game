import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { BookOpen } from "lucide-react";

// The Castle Library is signup-gated (CD, 2026-08-28): anonymous visitors may
// read a publication's free preview (the front matter, extended to roughly an
// introduction's worth of text for entry-style scrolls); the rest requires a
// free Xcrol account. Gate copy is CD's, verbatim — don't reword it. The
// popup pitches on arrival; the inline panel holds the line where the free
// preview ends. Bot link-previews are unaffected — the worker serves those.

// CD's prompt (2026-08-28). "To read the rest" on a gated book; the library
// shelf variant swaps the first clause.
const GATE_PITCH = "It's free. No ads. No algorithms. No data collection. Real people.";

function useAuthHref(): string {
  const location = useLocation();
  return `/auth?returnUrl=${encodeURIComponent(location.pathname + location.search)}`;
}

function GateButtons() {
  const href = useAuthHref();
  return (
    <div className="flex flex-col gap-2 w-full">
      <Button asChild size="lg">
        <Link to={href}>Sign up — it's free</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to={href}>Log in</Link>
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
            {bookTitle ?? "The Castle Library"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {bookTitle
              ? "To read the rest you need to sign up or log in to Xcrol."
              : "To read the books you need to sign up or log in to Xcrol."}{" "}
            {GATE_PITCH}
          </DialogDescription>
        </DialogHeader>
        <GateButtons />
      </DialogContent>
    </Dialog>
  );
}

export function CastleGatePanel({ bookTitle: _bookTitle }: { bookTitle?: string }) {
  return (
    <div className="not-prose my-12 rounded-lg border border-primary/30 bg-primary/5 p-8 text-center space-y-4">
      <div className="flex justify-center"><BookOpen className="h-8 w-8 text-primary" /></div>
      <h3 className="font-serif text-xl font-semibold">
        To read the rest you need to sign up or log in to Xcrol
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{GATE_PITCH}</p>
      <div className="max-w-xs mx-auto"><GateButtons /></div>
    </div>
  );
}
