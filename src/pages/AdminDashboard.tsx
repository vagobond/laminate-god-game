import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Shield, RefreshCw, Flag, UserX, Clock } from "lucide-react";
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
import { useAdminData } from "@/components/admin/useAdminData";
import { UsersTab } from "@/components/admin/UsersTab";
import { RolesTab } from "@/components/admin/RolesTab";
import { DeletionsTab } from "@/components/admin/DeletionsTab";
import { FlaggedTab } from "@/components/admin/FlaggedTab";
import { ReferencesTab } from "@/components/admin/ReferencesTab";
import { BroadcastTab } from "@/components/admin/BroadcastTab";
import { WaitlistTab } from "@/components/admin/WaitlistTab";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    isAdmin,
    loading,
    users,
    roles,
    stats,
    broadcastMessage,
    setBroadcastMessage,
    sendingBroadcast,
    currentUserId,
    flaggedReferences,
    allReferences,
    deletionRequests,
    processingDeletion,
    waitlist,
    deleteRefId,
    setDeleteRefId,
    showDeleteDialog,
    setShowDeleteDialog,
    deleteUserId,
    setDeleteUserId,
    showDeleteUserDialog,
    setShowDeleteUserDialog,
    deletingUser,
    loadDashboardData,
    sendBroadcastMessage,
    handleDeleteReference,
    handleResolveFlag,
    handleProcessDeletionRequest,
    handleDeleteUser,
  } = useAdminData();

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pt-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage users and permissions</p>
            </div>
          </div>
          <Button onClick={loadDashboardData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Friendships</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFriendships}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Admin Roles</TabsTrigger>
            <TabsTrigger value="deletions" className="flex items-center gap-1">
              <UserX className="w-3 h-3" /> Deletions ({deletionRequests.length})
            </TabsTrigger>
            <TabsTrigger value="flagged" className="flex items-center gap-1">
              <Flag className="w-3 h-3" /> Flagged ({flaggedReferences.length})
            </TabsTrigger>
            <TabsTrigger value="references">All References</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            <TabsTrigger value="waitlist" className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Waitlist ({waitlist.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab users={users} currentUserId={currentUserId} onDeleteUser={(id) => { setDeleteUserId(id); setShowDeleteUserDialog(true); }} />
          </TabsContent>
          <TabsContent value="roles">
            <RolesTab roles={roles} />
          </TabsContent>
          <TabsContent value="deletions">
            <DeletionsTab deletionRequests={deletionRequests} processingDeletion={processingDeletion} onProcess={handleProcessDeletionRequest} />
          </TabsContent>
          <TabsContent value="flagged">
            <FlaggedTab flaggedReferences={flaggedReferences} onResolveFlag={handleResolveFlag} onDeleteReference={(id) => { setDeleteRefId(id); setShowDeleteDialog(true); }} />
          </TabsContent>
          <TabsContent value="references">
            <ReferencesTab allReferences={allReferences} onDeleteReference={(id) => { setDeleteRefId(id); setShowDeleteDialog(true); }} />
          </TabsContent>
          <TabsContent value="broadcast">
            <BroadcastTab broadcastMessage={broadcastMessage} onMessageChange={setBroadcastMessage} sendingBroadcast={sendingBroadcast} onSend={sendBroadcastMessage} totalUsers={stats.totalUsers} />
          </TabsContent>
          <TabsContent value="waitlist">
            <WaitlistTab waitlist={waitlist} />
          </TabsContent>
        </Tabs>

        {/* Delete Reference Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reference</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete this reference? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteRefId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteRefId && handleDeleteReference(deleteRefId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete this user account? This will remove all their data including profile, friendships, posts, and messages. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteUserId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deletingUser} onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}>
                {deletingUser ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
