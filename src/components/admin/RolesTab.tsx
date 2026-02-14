import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "./types";

interface RolesTabProps {
  roles: UserRole[];
}

export function RolesTab({ roles }: RolesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Roles</CardTitle>
        <CardDescription>Users with special privileges</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.profile?.display_name || "Unknown"}</TableCell>
                <TableCell>{role.profile?.email || "No email"}</TableCell>
                <TableCell>
                  <Badge variant={role.role === "admin" ? "default" : "secondary"}>{role.role}</Badge>
                </TableCell>
                <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
