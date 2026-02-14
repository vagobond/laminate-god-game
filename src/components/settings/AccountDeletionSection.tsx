import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DeletionRequest } from "./useSettingsData";

interface AccountDeletionSectionProps {
  userId: string;
  existingRequest: DeletionRequest | null;
  loadingRequest: boolean;
  setExistingRequest: (req: DeletionRequest | null) => void;
  loadDeletionRequest: (userId: string) => void;
}

export const AccountDeletionSection = ({
  userId,
  existingRequest,
  loadingRequest,
  setExistingRequest,
  loadDeletionRequest,
}: AccountDeletionSectionProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [submittingDeletion, setSubmittingDeletion] = useState(false);

  const handleRequestDeletion = async () => {
    setSubmittingDeletion(true);
    try {
      const { error } = await supabase
        .from("account_deletion_requests")
        .insert({ user_id: userId, reason: deletionReason.trim() || null });

      if (error) throw error;

      toast.success("Account deletion request submitted. An admin will review it shortly.");
      setShowDeleteDialog(false);
      setDeletionReason("");
      loadDeletionRequest(userId);
    } catch (error: any) {
      console.error("Error submitting deletion request:", error);
      if (error.code === "23505") {
        toast.error("You already have a pending deletion request.");
      } else {
        toast.error("Failed to submit deletion request");
      }
    } finally {
      setSubmittingDeletion(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!existingRequest) return;
    try {
      const { error } = await supabase
        .from("account_deletion_requests")
        .update({ status: "cancelled" })
        .eq("id", existingRequest.id);

      if (error) throw error;
      toast.success("Deletion request cancelled");
      setExistingRequest(null);
    } catch (error) {
      console.error("Error cancelling deletion request:", error);
      toast.error("Failed to cancel deletion request");
    }
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Request permanent deletion of your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingRequest ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : existingRequest && existingRequest.status === "pending" ? (
            <div className="space-y-3">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-amber-600">Deletion Request Pending</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted on {new Date(existingRequest.created_at).toLocaleDateString()}
                    </p>
                    {existingRequest.reason && (
                      <p className="text-sm mt-1">Reason: {existingRequest.reason}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    Pending Review
                  </Badge>
                </div>
              </div>
              <Button variant="outline" onClick={handleCancelDeletionRequest} className="w-full">
                Cancel Deletion Request
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Once your account is deleted, all your data including profile, messages,
                friendships, and entries will be permanently removed. This action cannot be undone.
              </p>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Request Account Deletion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Request Account Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will submit a request to permanently delete your account. An admin will review
              and process your request. You can cancel the request anytime before it's processed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="deletion-reason">Reason (optional)</Label>
            <Textarea
              id="deletion-reason"
              placeholder="Let us know why you're leaving (optional)"
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestDeletion}
              disabled={submittingDeletion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submittingDeletion ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
