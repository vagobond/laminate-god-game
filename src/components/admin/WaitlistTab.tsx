import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Copy } from "lucide-react";
import { toast } from "sonner";
import type { WaitlistEntry } from "./types";

interface WaitlistTabProps {
  waitlist: WaitlistEntry[];
}

export function WaitlistTab({ waitlist }: WaitlistTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Waitlist ({waitlist.length})
        </CardTitle>
        <CardDescription>Users waiting for an invite code</CardDescription>
      </CardHeader>
      <CardContent>
        {waitlist.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No users on the waitlist</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitlist.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.email}</TableCell>
                  <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(entry.email); toast.success("Email copied!"); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
