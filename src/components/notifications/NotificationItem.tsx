import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface NotificationItemProps {
  id: string;
  avatarUrl?: string | null;
  displayName?: string | null;
  title: string;
  subtitle?: string;
  variant?: "default" | "primary" | "warning" | "info" | "success";
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  onAvatarClick?: () => void;
}

const variantClasses = {
  default: "bg-secondary/50",
  primary: "bg-primary/10 border border-primary/30",
  warning: "bg-yellow-500/10 border border-yellow-500/30",
  info: "bg-blue-500/10 border border-blue-500/30",
  success: "bg-green-500/10 border border-green-500/30",
};

export function NotificationItem({
  avatarUrl,
  displayName,
  title,
  subtitle,
  variant = "default",
  icon,
  actions,
  onClick,
  onAvatarClick,
}: NotificationItemProps) {
  return (
    <div className={`p-3 rounded-lg space-y-2 ${variantClasses[variant]}`}>
      <div className="flex items-center gap-3">
        <Avatar
          className={`h-10 w-10 ${onAvatarClick ? "cursor-pointer" : ""}`}
          onClick={onAvatarClick}
        >
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>
            {(displayName || "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium truncate ${onClick ? "cursor-pointer hover:underline" : ""}`}
            onClick={onClick}
          >
            {title}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {icon && <div className="flex-shrink-0">{icon}</div>}
      </div>
      {actions}
    </div>
  );
}

export default NotificationItem;
