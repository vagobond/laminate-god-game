import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, UserPlus, Send } from "lucide-react";
import type { FriendRequest } from "./types";

interface ReceivedRequestsSectionProps {
  requests: FriendRequest[];
  onAccept: (request: FriendRequest) => void;
  onDecline: (requestId: string) => void;
}

export const ReceivedRequestsSection = ({ requests, onAccept, onDecline }: ReceivedRequestsSectionProps) => {
  const navigate = useNavigate();

  if (requests.length === 0) return null;

  return (
    <div className="mb-6 pb-4 border-b border-border">
      <h4 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4" />
        Friend Requests ({requests.length})
      </h4>
      <p className="text-xs text-muted-foreground mb-2">People who want to be your friend</p>
      <div className="space-y-2">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/u/${request.from_user_id}`)}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.profile?.avatar_url || undefined} />
                <AvatarFallback>{(request.profile?.display_name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{request.profile?.display_name || "Unknown"}</p>
                {request.message && <p className="text-xs text-muted-foreground truncate">{request.message}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/20" onClick={(e) => { e.stopPropagation(); onAccept(request); }}>
                    <Check className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Accept</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/20" onClick={(e) => { e.stopPropagation(); onDecline(request.id); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Decline</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface SentRequestsSectionProps {
  requests: FriendRequest[];
  onNudge: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

export const SentRequestsSection = ({ requests, onNudge, onCancel }: SentRequestsSectionProps) => {
  const navigate = useNavigate();

  if (requests.length === 0) return null;

  return (
    <div className="mt-6 pt-4 border-t border-border">
      <h4 className="text-sm font-medium text-blue-500 mb-3 flex items-center gap-2">
        <Send className="w-4 h-4" /> {/* Using Send icon instead of Clock for consistency */}
        Sent Requests ({requests.length})
      </h4>
      <p className="text-xs text-muted-foreground mb-2">Waiting for their response</p>
      <div className="space-y-2">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/u/${request.to_user_id}`)}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.profile?.avatar_url || undefined} />
                <AvatarFallback>{(request.profile?.display_name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{request.profile?.display_name || "Unknown"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${request.nudge_sent_at ? "text-muted-foreground" : "text-blue-500 hover:text-blue-600 hover:bg-blue-500/20"}`} onClick={() => onNudge(request.id)} disabled={!!request.nudge_sent_at}>
                    <Send className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{request.nudge_sent_at ? "Nudge already sent" : "Send nudge"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onCancel(request.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cancel request</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
