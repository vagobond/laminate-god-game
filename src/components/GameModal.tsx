import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const GameModal = ({ isOpen, onClose, title, children }: GameModalProps) => {
  const isMobile = useIsMobile();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={`
          ${isMobile 
            ? "w-screen h-screen max-w-none max-h-none rounded-none p-4" 
            : "w-[95vw] max-w-4xl max-h-[90vh]"
          } 
          overflow-y-auto
        `}
      >
        <DialogHeader className="flex flex-row items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 pb-4 border-b">
          <DialogTitle className="text-xl md:text-2xl">{title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        <div className={`${isMobile ? "pb-8" : ""}`}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};
