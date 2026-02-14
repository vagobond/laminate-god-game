import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { UserProfile } from "./types";

interface UsersTabProps {
  users: UserProfile[];
  currentUserId: string | null;
  onDeleteUser: (userId: string) => void;
}

export function UsersTab({ users, currentUserId, onDeleteUser }: UsersTabProps) {
  const navigate = useNavigate();

  const copyAllEmails = () => {
    const emails = users.map((u) => u.email).filter((email): email is string => !!email).join(", ");
    if (!emails) { toast.error("No emails to copy"); return; }
    navigator.clipboard.writeText(emails).then(() => {
      toast.success(`Copied ${users.filter((u) => u.email).length} emails to clipboard`);
    }).catch(() => { toast.error("Failed to copy emails"); });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Registered Users</CardTitle>
            <CardDescription>All users registered on the platform</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={copyAllEmails}>
            <Copy className="h-4 w-4 mr-2" />
            Copy All Emails
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>@Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.display_name || "No name"}</TableCell>
                <TableCell className="text-muted-foreground">{user.username ? `@${user.username}` : "—"}</TableCell>
                <TableCell>{user.email || "No email"}</TableCell>
                <TableCell className="text-sm">
                  {user.invited_by_name || user.invited_by_email ? (
                    <span title={user.invited_by_email || undefined}>{user.invited_by_name || user.invited_by_email}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => user.username ? navigate(`/@${user.username}`) : navigate(`/u/${user.id}`)}>
                    View Profile
                  </Button>
                  {user.id !== currentUserId && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDeleteUser(user.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
