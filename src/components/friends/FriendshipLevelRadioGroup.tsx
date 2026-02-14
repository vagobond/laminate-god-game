import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { friendshipLevelLabels } from "@/lib/friendship-labels";
import type { CustomFriendshipType, FriendshipSelection } from "./types";

interface FriendshipLevelRadioGroupProps {
  value: FriendshipSelection;
  onValueChange: (value: FriendshipSelection) => void;
  customFriendshipType: CustomFriendshipType | null;
  idPrefix: string;
}

const FriendshipLevelRadioGroup = ({
  value,
  onValueChange,
  customFriendshipType,
  idPrefix,
}: FriendshipLevelRadioGroupProps) => {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v: FriendshipSelection) => onValueChange(v)}
      className="space-y-3"
    >
      <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
        <RadioGroupItem value="close_friend" id={`${idPrefix}_close_friend`} className="mt-1" />
        <Label htmlFor={`${idPrefix}_close_friend`} className="flex-1 cursor-pointer">
          <span className="font-medium">{friendshipLevelLabels.close_friend.label}</span>
          <p className="text-sm text-muted-foreground">{friendshipLevelLabels.close_friend.description}</p>
        </Label>
      </div>

      <div className="flex items-start space-x-3 p-3 rounded-lg border border-orange-500/50 hover:bg-orange-500/10">
        <RadioGroupItem value="family" id={`${idPrefix}_family`} className="mt-1" />
        <Label htmlFor={`${idPrefix}_family`} className="flex-1 cursor-pointer">
          <span className="font-medium text-orange-500">{friendshipLevelLabels.family.label}</span>
          <p className="text-sm text-muted-foreground">{friendshipLevelLabels.family.description}</p>
        </Label>
      </div>

      <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
        <RadioGroupItem value="buddy" id={`${idPrefix}_buddy`} className="mt-1" />
        <Label htmlFor={`${idPrefix}_buddy`} className="flex-1 cursor-pointer">
          <span className="font-medium">{friendshipLevelLabels.buddy.label}</span>
          <p className="text-sm text-muted-foreground">{friendshipLevelLabels.buddy.description}</p>
        </Label>
      </div>

      <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
        <RadioGroupItem value="friendly_acquaintance" id={`${idPrefix}_friendly_acquaintance`} className="mt-1" />
        <Label htmlFor={`${idPrefix}_friendly_acquaintance`} className="flex-1 cursor-pointer">
          <span className="font-medium">{friendshipLevelLabels.friendly_acquaintance.label}</span>
          <p className="text-sm text-muted-foreground">{friendshipLevelLabels.friendly_acquaintance.description}</p>
        </Label>
      </div>

      {customFriendshipType && (
        <div className="flex items-start space-x-3 p-3 rounded-lg border border-primary/50 hover:bg-primary/10">
          <RadioGroupItem value="custom" id={`${idPrefix}_custom`} className="mt-1" />
          <Label htmlFor={`${idPrefix}_custom`} className="flex-1 cursor-pointer">
            <span className="font-medium text-primary">{customFriendshipType.name}</span>
            <p className="text-sm text-muted-foreground">Your custom friendship level with personalized visibility settings.</p>
          </Label>
        </div>
      )}

      <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
        <RadioGroupItem value="secret_friend" id={`${idPrefix}_secret_friend`} className="mt-1" />
        <Label htmlFor={`${idPrefix}_secret_friend`} className="flex-1 cursor-pointer">
          <span className="font-medium">{friendshipLevelLabels.secret_friend.label}</span>
          <p className="text-sm text-muted-foreground">{friendshipLevelLabels.secret_friend.description}</p>
        </Label>
      </div>

      <div className="flex items-start space-x-3 p-3 rounded-lg border border-red-500/50 hover:bg-red-500/10">
        <RadioGroupItem value="secret_enemy" id={`${idPrefix}_secret_enemy`} className="mt-1" />
        <Label htmlFor={`${idPrefix}_secret_enemy`} className="flex-1 cursor-pointer">
          <span className="font-medium text-red-600">{friendshipLevelLabels.secret_enemy.label}</span>
          <p className="text-sm text-muted-foreground">{friendshipLevelLabels.secret_enemy.description}</p>
        </Label>
      </div>
    </RadioGroup>
  );
};

export default FriendshipLevelRadioGroup;
