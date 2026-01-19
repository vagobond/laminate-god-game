import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export type FriendshipLevel = 
  | "close_friend" 
  | "family"
  | "buddy" 
  | "friendly_acquaintance" 
  | "secret_friend" 
  | "secret_enemy" 
  | "not_friend";

interface FriendshipLevelOption {
  value: FriendshipLevel;
  label: string;
  description: string;
  variant?: "default" | "warning" | "danger" | "destructive";
}

const friendshipLevelOptions: FriendshipLevelOption[] = [
  {
    value: "close_friend",
    label: "Close Friend",
    description: "Can see your WhatsApp, phone number, or private email. Can see friendship levels in mutual close friends' lists.",
  },
  {
    value: "family",
    label: "Family",
    description: "Independent category: phone, private email, and full birthday only. No social links.",
    variant: "warning",
  },
  {
    value: "buddy",
    label: "Buddy",
    description: "Can see your Instagram or other social profile. Can see your friends list without levels.",
  },
  {
    value: "friendly_acquaintance",
    label: "Friendly Acquaintance",
    description: "Can see your LinkedIn or general contact email. Can see your friends list without levels.",
  },
  {
    value: "secret_friend",
    label: "Secret Friend",
    description: "All privileges of close friend, but neither of you appears in each other's friends lists.",
  },
  {
    value: "secret_enemy",
    label: "Secret Enemy",
    description: "They'll think you're friends, but get no access or see decoy info. Perfect for people you don't trust.",
    variant: "danger",
  },
  {
    value: "not_friend",
    label: "Not Friend",
    description: "Decline the request without any friendship.",
    variant: "destructive",
  },
];

interface FriendshipLevelSelectorProps {
  value: FriendshipLevel;
  onChange: (value: FriendshipLevel) => void;
  idPrefix?: string;
  showNotFriend?: boolean;
  showFamily?: boolean;
  compact?: boolean;
}

export function FriendshipLevelSelector({
  value,
  onChange,
  idPrefix = "",
  showNotFriend = false,
  showFamily = true,
  compact = false,
}: FriendshipLevelSelectorProps) {
  const filteredOptions = friendshipLevelOptions.filter((opt) => {
    if (opt.value === "not_friend" && !showNotFriend) return false;
    if (opt.value === "family" && !showFamily) return false;
    return true;
  });

  const getVariantClasses = (variant?: string) => {
    switch (variant) {
      case "warning":
        return "border-orange-500/50 hover:bg-orange-500/10";
      case "danger":
        return "border-red-500/50 hover:bg-red-500/10";
      case "destructive":
        return "border-destructive/50 hover:bg-destructive/10";
      default:
        return "border-border hover:bg-secondary/50";
    }
  };

  const getLabelClasses = (variant?: string) => {
    switch (variant) {
      case "warning":
        return "text-orange-500";
      case "danger":
        return "text-red-600";
      case "destructive":
        return "text-destructive";
      default:
        return "";
    }
  };

  if (compact) {
    return (
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as FriendshipLevel)}
        className="space-y-2"
      >
        {filteredOptions.map((option) => (
          <div
            key={option.value}
            className={`flex items-center justify-between p-2 rounded-lg border ${getVariantClasses(option.variant)}`}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value={option.value} id={`${idPrefix}${option.value}`} />
              <Label
                htmlFor={`${idPrefix}${option.value}`}
                className={`cursor-pointer font-medium ${getLabelClasses(option.variant)}`}
              >
                {option.label}
              </Label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="left" className="w-64 text-sm">
                {option.description}
              </PopoverContent>
            </Popover>
          </div>
        ))}
      </RadioGroup>
    );
  }

  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as FriendshipLevel)}
      className="space-y-3"
    >
      {filteredOptions.map((option) => (
        <div
          key={option.value}
          className={`flex items-start space-x-3 p-3 rounded-lg border ${getVariantClasses(option.variant)}`}
        >
          <RadioGroupItem value={option.value} id={`${idPrefix}${option.value}`} className="mt-1" />
          <Label htmlFor={`${idPrefix}${option.value}`} className="flex-1 cursor-pointer">
            <span className={`font-medium ${getLabelClasses(option.variant)}`}>
              {option.label}
            </span>
            <p className="text-sm text-muted-foreground">{option.description}</p>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export default FriendshipLevelSelector;
