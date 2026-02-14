import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2 } from "lucide-react";
import type { AllReference } from "./types";

interface ReferencesTabProps {
  allReferences: AllReference[];
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

export function ReferencesTab({ allReferences, onDeleteReference }: ReferencesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          All References
        </CardTitle>
        <CardDescription>Recent references (showing last 100)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allReferences.map((ref) => (
              <TableRow key={ref.id}>
                <TableCell className="font-medium">{ref.from_user?.display_name || "Unknown"}</TableCell>
                <TableCell>{ref.to_user?.display_name || "Unknown"}</TableCell>
                <TableCell><Badge variant="secondary">{ref.reference_type}</Badge></TableCell>
                <TableCell>{renderStars(ref.rating)}</TableCell>
                <TableCell className="max-w-[200px] truncate">{ref.content}</TableCell>
                <TableCell>{new Date(ref.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDeleteReference(ref.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
