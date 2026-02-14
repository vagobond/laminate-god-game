import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, X, Check } from "lucide-react";
import type { DeletionRequest } from "./types";

interface DeletionsTabProps {
  deletionRequests: DeletionRequest[];
  processingDeletion: string | null;
  onProcess: (requestId: string, action: "approved" | "rejected") => void;
}

export function DeletionsTab({ deletionRequests, processingDeletion, onProcess }: DeletionsTabProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserX className="h-5 w-5" />
          Account Deletion Requests
        </CardTitle>
        <CardDescription>Users requesting account deletion</CardDescription>
      </CardHeader>
      <CardContent>
        {deletionRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No pending deletion requests</p>
        ) : (
          <div className="space-y-4">
            {deletionRequests.map((request) => (
              <div key={request.id} className="p-4 border border-destructive/30 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {request.profile?.display_name || "Unknown User"}
                      {request.profile?.username && <span className="text-muted-foreground ml-2">@{request.profile.username}</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{request.profile?.email || "No email"}</p>
                    <p className="text-xs text-muted-foreground">Requested: {new Date(request.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={processingDeletion === request.id} onClick={() => onProcess(request.id, "rejected")}>
                      <X className="w-3 h-3 mr-1" /> Reject
                    </Button>
                    <Button variant="destructive" size="sm" disabled={processingDeletion === request.id} onClick={() => onProcess(request.id, "approved")}>
                      <Check className="w-3 h-3 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
                {request.reason && (
                  <div className="bg-secondary/30 p-3 rounded">
                    <p className="text-sm font-medium">Reason:</p>
                    <p className="text-sm">{request.reason}</p>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => request.profile?.username ? navigate(`/@${request.profile.username}`) : navigate(`/u/${request.user_id}`)}>
                  View Profile
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
