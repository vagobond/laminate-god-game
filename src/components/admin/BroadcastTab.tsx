import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";

interface BroadcastTabProps {
  broadcastMessage: string;
  onMessageChange: (value: string) => void;
  sendingBroadcast: boolean;
  onSend: () => void;
  totalUsers: number;
}

export function BroadcastTab({ broadcastMessage, onMessageChange, sendingBroadcast, onSend, totalUsers }: BroadcastTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Broadcast Message
        </CardTitle>
        <CardDescription>Send a system message to all users. This will appear in their inbox.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea placeholder="Type your broadcast message here..." value={broadcastMessage} onChange={(e) => onMessageChange(e.target.value)} className="min-h-[150px]" />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">This will be sent to {totalUsers - 1} users</p>
          <Button onClick={onSend} disabled={sendingBroadcast || !broadcastMessage.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {sendingBroadcast ? "Sending..." : "Send Broadcast"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
