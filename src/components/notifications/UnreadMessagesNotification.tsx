import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

interface UnreadMessagesNotificationProps {
  count: number;
}

export function UnreadMessagesNotification({ count }: UnreadMessagesNotificationProps) {
  const navigate = useNavigate();

  if (count === 0) return null;

  return (
    <button
      onClick={() => navigate("/messages")}
      className="w-full p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Bell className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Unread Messages</p>
          <p className="text-sm text-muted-foreground">
            You have {count} unread message{count > 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </button>
  );
}

export default UnreadMessagesNotification;
