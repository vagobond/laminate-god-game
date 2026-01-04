import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Check, X, Loader2, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface IntroductionRequest {
  id: string;
  requester_id: string;
  introducer_id: string;
  target_id: string;
  message: string;
  status: string;
  response_message: string | null;
  created_at: string;
  requester?: { display_name: string | null; avatar_url: string | null };
  introducer?: { display_name: string | null; avatar_url: string | null };
  target?: { display_name: string | null; avatar_url: string | null };
}

interface IntroductionRequestsManagerProps {
  userId: string;
}

const IntroductionRequestsManager = ({ userId }: IntroductionRequestsManagerProps) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<IntroductionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [responseDialog, setResponseDialog] = useState<IntroductionRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    loadRequests();
  }, [userId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("introduction_requests")
        .select("*")
        .or(`requester_id.eq.${userId},introducer_id.eq.${userId},target_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch all related profiles
      const allUserIds = new Set<string>();
      (data || []).forEach(req => {
        allUserIds.add(req.requester_id);
        allUserIds.add(req.introducer_id);
        allUserIds.add(req.target_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", Array.from(allUserIds));

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );

      const enrichedRequests = (data || []).map(req => ({
        ...req,
        requester: profileMap.get(req.requester_id),
        introducer: profileMap.get(req.introducer_id),
        target: profileMap.get(req.target_id),
      }));

      setRequests(enrichedRequests);
    } catch (error) {
      console.error("Error loading introduction requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: IntroductionRequest) => {
    setResponseDialog(request);
  };

  const confirmAccept = async () => {
    if (!responseDialog) return;
    
    setProcessingId(responseDialog.id);
    try {
      const { error } = await supabase
        .from("introduction_requests")
        .update({ 
          status: "accepted",
          response_message: responseMessage.trim() || null
        })
        .eq("id", responseDialog.id);

      if (error) throw error;

      toast.success("Introduction accepted! Both parties have been notified.");
      setResponseDialog(null);
      setResponseMessage("");
      loadRequests();
    } catch (error) {
      console.error("Error accepting introduction:", error);
      toast.error("Failed to accept introduction");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from("introduction_requests")
        .update({ status: "declined" })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Introduction request declined");
      loadRequests();
    } catch (error) {
      console.error("Error declining introduction:", error);
      toast.error("Failed to decline introduction");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from("introduction_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Introduction request cancelled");
      loadRequests();
    } catch (error) {
      console.error("Error cancelling introduction:", error);
      toast.error("Failed to cancel introduction");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingToReview = requests.filter(r => r.introducer_id === userId && r.status === "pending");
  const sentRequests = requests.filter(r => r.requester_id === userId);
  const receivedIntros = requests.filter(r => r.target_id === userId && r.status === "accepted");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400"><Check className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderRequestCard = (request: IntroductionRequest, type: "review" | "sent" | "received") => (
    <div key={request.id} className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => navigate(`/u/${request.requester_id}`)}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={request.requester?.avatar_url || undefined} />
            <AvatarFallback>
              {(request.requester?.display_name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {request.requester_id === userId ? "You" : request.requester?.display_name || "Unknown"}
          </span>
        </button>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => navigate(`/u/${request.introducer_id}`)}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={request.introducer?.avatar_url || undefined} />
            <AvatarFallback>
              {(request.introducer?.display_name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {request.introducer_id === userId ? "You" : request.introducer?.display_name || "Unknown"}
          </span>
        </button>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => navigate(`/u/${request.target_id}`)}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={request.target?.avatar_url || undefined} />
            <AvatarFallback>
              {(request.target?.display_name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {request.target_id === userId ? "You" : request.target?.display_name || "Unknown"}
          </span>
        </button>
      </div>

      <p className="text-sm text-muted-foreground bg-secondary/30 p-2 rounded">
        "{request.message}"
      </p>

      {request.response_message && (
        <p className="text-sm text-primary bg-primary/10 p-2 rounded">
          Response: "{request.response_message}"
        </p>
      )}

      <div className="flex items-center justify-between">
        {getStatusBadge(request.status)}
        
        {type === "review" && request.status === "pending" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDecline(request.id)}
              disabled={processingId === request.id}
            >
              <X className="w-4 h-4 mr-1" />
              Decline
            </Button>
            <Button
              size="sm"
              onClick={() => handleAccept(request)}
              disabled={processingId === request.id}
            >
              {processingId === request.id ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              Accept
            </Button>
          </div>
        )}

        {type === "sent" && request.status === "pending" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCancel(request.id)}
            disabled={processingId === request.id}
          >
            Cancel
          </Button>
        )}

        <span className="text-xs text-muted-foreground">
          {new Date(request.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null; // Don't show the section if there are no requests
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5" />
            Introduction Requests
            {pendingToReview.length > 0 && (
              <Badge variant="destructive">{pendingToReview.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={pendingToReview.length > 0 ? "review" : "sent"}>
            <TabsList className="w-full">
              <TabsTrigger value="review" className="flex-1">
                To Review {pendingToReview.length > 0 && `(${pendingToReview.length})`}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex-1">
                Sent ({sentRequests.length})
              </TabsTrigger>
              <TabsTrigger value="received" className="flex-1">
                For You ({receivedIntros.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="review" className="space-y-4 mt-4">
              {pendingToReview.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No introduction requests to review
                </p>
              ) : (
                pendingToReview.map(req => renderRequestCard(req, "review"))
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4 mt-4">
              {sentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You haven't sent any introduction requests
                </p>
              ) : (
                sentRequests.map(req => renderRequestCard(req, "sent"))
              )}
            </TabsContent>

            <TabsContent value="received" className="space-y-4 mt-4">
              {receivedIntros.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No introductions made for you yet
                </p>
              ) : (
                receivedIntros.map(req => renderRequestCard(req, "received"))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Accept Response Dialog */}
      <Dialog open={!!responseDialog} onOpenChange={() => setResponseDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Introduction</DialogTitle>
            <DialogDescription>
              You're about to introduce {responseDialog?.requester?.display_name} to{" "}
              {responseDialog?.target?.display_name}. You can add a personal note.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Add a note (optional)</label>
              <Textarea
                placeholder="Hey, I'd like to introduce you both! You have a lot in common..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setResponseDialog(null)}>
                Cancel
              </Button>
              <Button onClick={confirmAccept} disabled={processingId === responseDialog?.id}>
                {processingId === responseDialog?.id && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Confirm Introduction
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IntroductionRequestsManager;
