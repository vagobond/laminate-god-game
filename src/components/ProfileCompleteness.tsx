import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

interface ProfileData {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  link: string | null;
  hometown_city: string | null;
  birthday_month: number | null;
  whatsapp: string | null;
  phone_number: string | null;
  private_email: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  nicknames: string | null;
}

interface ProfileCompletenessProps {
  profile: ProfileData;
  onSectionClick?: (section: string) => void;
}

interface CompletionItem {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
}

export function ProfileCompleteness({ profile, onSectionClick }: ProfileCompletenessProps) {
  const completionItems: CompletionItem[] = [
    { id: "avatar", label: "Add a profile photo", completed: !!profile.avatar_url, weight: 20 },
    { id: "name", label: "Add your display name", completed: !!profile.display_name, weight: 15 },
    { id: "username", label: "Choose a username", completed: !!profile.username, weight: 15 },
    { id: "bio", label: "Write a bio", completed: !!profile.bio && profile.bio.length > 10, weight: 15 },
    { id: "hometown", label: "Set your hometown", completed: !!profile.hometown_city, weight: 10 },
    { id: "birthday", label: "Add your birthday", completed: !!profile.birthday_month, weight: 5 },
    { id: "link", label: "Add a personal link", completed: !!profile.link, weight: 5 },
    { id: "contact", label: "Add contact info", completed: !!(profile.whatsapp || profile.phone_number || profile.private_email), weight: 10 },
    { id: "social", label: "Connect social accounts", completed: !!(profile.instagram_url || profile.linkedin_url), weight: 5 },
  ];

  const totalWeight = completionItems.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = completionItems
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);
  const percentage = Math.round((completedWeight / totalWeight) * 100);

  const incompleteItems = completionItems.filter(item => !item.completed);
  const isComplete = percentage === 100;

  const getEncouragementMessage = () => {
    if (percentage === 100) return "🎉 Your profile is complete! You're ready to connect.";
    if (percentage >= 80) return "Almost there! Just a few more touches.";
    if (percentage >= 60) return "Great progress! Keep building your profile.";
    if (percentage >= 40) return "You're on your way! Complete profiles get more connections.";
    if (percentage >= 20) return "Good start! A complete profile helps others find you.";
    return "Let's get started! Complete your profile to connect with others.";
  };

  const getProgressColor = () => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  if (isComplete) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Sparkles className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                {getEncouragementMessage()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Profile Strength</span>
            <span className="text-sm font-bold text-primary">{percentage}%</span>
          </div>
          <div className="relative">
            <Progress value={percentage} className="h-3" />
            <div 
              className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{getEncouragementMessage()}</p>
        </div>

        {incompleteItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Complete your profile
            </p>
            <div className="space-y-1.5">
              {incompleteItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSectionClick?.(item.id)}
                  className="flex items-center gap-2 w-full text-left hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors group"
                >
                  <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground">
                    {item.label}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">+{item.weight}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {incompleteItems.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{incompleteItems.length - 3} more to complete
          </p>
        )}
      </CardContent>
    </Card>
  );
}
