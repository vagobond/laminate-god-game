import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, X, Trash2, Star } from "lucide-react";
import type { FlaggedReference } from "./types";

interface FlaggedTabProps {
  flaggedReferences: FlaggedReference[];
  onResolveFlag: (flagId: string, action: "dismissed" | "resolved") => void;
  onDeleteReference: (refId: string) => void;
}

function renderStars(rating: number | null) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`w-3 h-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

export function FlaggedTab({ flaggedReferences, onResolveFlag, onDeleteReference }: FlaggedTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Flagged References
        </CardTitle>
        <CardDescription>References that users have flagged for review</CardDescription>
      </CardHeader>
      <CardContent>
        {flaggedReferences.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No flagged references pending review</p>
        ) : (
          <div className="space-y-4">
            {flaggedReferences.map((flag) => (
              <div key={flag.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">Flagged by: {flag.flagger?.display_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(flag.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onResolveFlag(flag.id, "dismissed")}>
                      <X className="w-3 h-3 mr-1" /> Dismiss
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDeleteReference(flag.reference_id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete Reference
                    </Button>
                  </div>
                </div>
                <div className="bg-destructive/10 p-2 rounded">
                  <p className="text-sm font-medium text-destructive">Flag Reason:</p>
                  <p className="text-sm">{flag.reason}</p>
                </div>
                {flag.reference && (
                  <div className="bg-secondary/30 p-3 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">
                        <span className="font-medium">From:</span> {flag.from_user?.display_name || "Unknown"}
                        {" → "}
                        <span className="font-medium">To:</span> {flag.to_user?.display_name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{flag.reference.reference_type}</Badge>
                        {renderStars(flag.reference.rating)}
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{flag.reference.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
