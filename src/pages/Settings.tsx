import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bell, Shield, Eye, ArrowLeft, Trash2, AlertTriangle, Loader2, Link2, Code, Key } from "lucide-react";
import { toast } from "sonner";
import BlockedUsersManager from "@/components/BlockedUsersManager";
import ConnectedAppsManager from "@/components/ConnectedAppsManager";
import DeveloperAppsManager from "@/components/DeveloperAppsManager";
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
import { Badge } from "@/components/ui/badge";

interface DeletionRequest {
  id: string;
  status: string;
  reason: string | null;
  created_at: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Settings state (these would be persisted to DB in a full implementation)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [friendRequestNotifications, setFriendRequestNotifications] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [submittingDeletion, setSubmittingDeletion] = useState(false);
  const [existingRequest, setExistingRequest] = useState<DeletionRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
      loadDeletionRequest(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadDeletionRequest(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadDeletionRequest = async (userId: string) => {
    setLoadingRequest(true);
    try {
      const { data, error } = await supabase
        .from("account_deletion_requests")
        .select("id, status, reason, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setExistingRequest(data);
    } catch (error) {
      console.error("Error loading deletion request:", error);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user) return;

    setSubmittingDeletion(true);
    try {
      const { error } = await supabase
        .from("account_deletion_requests")
        .insert({
          user_id: user.id,
          reason: deletionReason.trim() || null,
        });

      if (error) throw error;

      toast.success("Account deletion request submitted. An admin will review it shortly.");
      setShowDeleteDialog(false);
      setDeletionReason("");
      loadDeletionRequest(user.id);
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

  const handleSettingChange = (setting: string, value: boolean) => {
    // In a full implementation, this would save to the database
    toast.success("Setting updated");
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your account activity
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={(checked) => {
                    setEmailNotifications(checked);
                    handleSettingChange("emailNotifications", checked);
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="friend-request-notifications">Friend Request Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone sends you a friend request
                  </p>
                </div>
                <Switch
                  id="friend-request-notifications"
                  checked={friendRequestNotifications}
                  onCheckedChange={(checked) => {
                    setFriendRequestNotifications(checked);
                    handleSettingChange("friendRequestNotifications", checked);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy
              </CardTitle>
              <CardDescription>
                Control your privacy and visibility settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="online-status">Show Online Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you're online
                  </p>
                </div>
                <Switch
                  id="online-status"
                  checked={showOnlineStatus}
                  onCheckedChange={(checked) => {
                    setShowOnlineStatus(checked);
                    handleSettingChange("showOnlineStatus", checked);
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-friend-requests">Allow Friend Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others send you friend requests
                  </p>
                </div>
                <Switch
                  id="allow-friend-requests"
                  checked={allowFriendRequests}
                  onCheckedChange={(checked) => {
                    setAllowFriendRequests(checked);
                    handleSettingChange("allowFriendRequests", checked);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Blocked Users Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Blocked Users
              </CardTitle>
              <CardDescription>
                Manage users you've blocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BlockedUsersManager />
            </CardContent>
          </Card>

          {/* Connected Apps Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Connected Apps
              </CardTitle>
              <CardDescription>
                Apps you've authorized to access your XCROL account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectedAppsManager />
            </CardContent>
          </Card>

          {/* Developer Apps Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Developer
              </CardTitle>
              <CardDescription>
                Create OAuth apps to let other sites use "Login with XCROL"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeveloperAppsManager />
            </CardContent>
          </Card>

          {/* Account Deletion Section */}
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
                  <Button 
                    variant="outline" 
                    onClick={handleCancelDeletionRequest}
                    className="w-full"
                  >
                    Cancel Deletion Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Once your account is deleted, all your data including profile, messages, 
                    friendships, and entries will be permanently removed. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Request Account Deletion
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Dialog */}
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
            <Label htmlFor="deletion-reason">Reason for leaving (optional)</Label>
            <Textarea
              id="deletion-reason"
              placeholder="Help us improve by telling us why you're leaving..."
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
              {submittingDeletion ? "Submitting..." : "Submit Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;