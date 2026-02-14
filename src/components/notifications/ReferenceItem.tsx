import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { NewReference } from "@/hooks/use-notifications";

interface ReferenceItemProps {
  reference: NewReference;
  onDismiss: (refId: string) => void;
}

const getRefTypeEmoji = (type: string) => {
  switch (type) {
    case "host": return "🏠";
    case "guest": return "🧳";
    case "business": return "💼";
    default: return "☕";
  }
};

const ReferenceItem = ({ reference, onDismiss }: ReferenceItemProps) => {
  const navigate = useNavigate();

  const profilePath = reference.from_profile?.username
    ? `/${reference.from_profile.username}`
    : `/u/${reference.from_user_id}`;

  const handleNavigate = () => {
    onDismiss(reference.id);
    navigate(profilePath);
  };

  return (
    <div className="p-3 bg-yellow-500/10 rounded-lg space-y-2 border border-yellow-500/30">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 cursor-pointer" onClick={handleNavigate}>
          <AvatarImage src={reference.from_profile?.avatar_url || undefined} />
          <AvatarFallback>
            {(reference.from_profile?.display_name || "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p
            className="font-medium truncate cursor-pointer hover:underline"
            onClick={handleNavigate}
          >
            {reference.from_profile?.display_name || "Someone"}
          </p>
          <p className="text-sm text-muted-foreground">
            Left you a {getRefTypeEmoji(reference.reference_type)} reference
            {reference.rating && ` (${reference.rating}★)`}
          </p>
        </div>
        <Star className="h-5 w-5 text-yellow-500 flex-shrink-0" />
      </div>
      <Button
        size="sm"
        className="w-full"
        variant="outline"
        onClick={handleNavigate}
      >
        <Star className="h-4 w-4 mr-2" />
        Leave Reference Back
      </Button>
    </div>
  );
};

export default ReferenceItem;
