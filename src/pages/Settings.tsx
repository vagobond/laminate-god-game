import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bell, Shield, Eye, ArrowLeft, Trash2, AlertTriangle, Loader2, Link2, Code, Key, Database, Lock, Info, ExternalLink, Sparkles, Scroll } from "lucide-react";
import { toast } from "sonner";
import BlockedUsersManager from "@/components/BlockedUsersManager";
import ConnectedAppsManager from "@/components/ConnectedAppsManager";
import DeveloperAppsManager from "@/components/DeveloperAppsManager";
import { useTutorial } from "@/components/onboarding";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeletionRequest {
  id: string;
  status: string;
  reason: string | null;
  created_at: string;
}

interface UserSettings {
  email_notifications: boolean;
  friend_request_notifications: boolean;
  show_online_status: boolean;
  allow_friend_requests: boolean;
  default_share_email: boolean;
  default_share_hometown: boolean;
  default_share_connections: boolean;
  default_share_xcrol: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  email_notifications: true,
  friend_request_notifications: true,
  show_online_status: true,
  allow_friend_requests: true,
  default_share_email: false,
  default_share_hometown: false,
  default_share_connections: false,
  default_share_xcrol: false,
};

const Settings = () => {
  const navigate = useNavigate();
  const { reopenTutorial } = useTutorial();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(false);
    loadDeletionRequest(user.id);
    loadUserSettings(user.id);
  }, [user, authLoading, navigate]);

  const loadUserSettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          email_notifications: data.email_notifications,
          friend_request_notifications: data.friend_request_notifications,
          show_online_status: data.show_online_status,
          allow_friend_requests: data.allow_friend_requests,
          default_share_email: data.default_share_email,
          default_share_hometown: data.default_share_hometown,
          default_share_connections: data.default_share_connections,
          default_share_xcrol: data.default_share_xcrol,
        });
      }
      setSettingsLoaded(true);
    } catch (error) {
      console.error("Error loading settings:", error);
      setSettingsLoaded(true);
    }
  };

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

  const handleSettingChange = async <K extends keyof UserSettings>(setting: K, value: UserSettings[K]) => {
    if (!user) return;

    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);
    setSavingSettings(true);

    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          ...newSettings,
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;
      toast.success("Setting saved");
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Failed to save setting");
      // Revert on error
      setSettings(settings);
    } finally {
      setSavingSettings(false);
    }
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

  if (loading || !settingsLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
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
              <p className="text-muted-foreground">Manage your account preferences and data controls</p>
            </div>

            {/* Xcrol Integrations */}
            <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Xcrol Integrations
                </CardTitle>
                <CardDescription>
                  Expand the Power of Your Xcrol
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  <a 
                    href="https://MicroVictoryArmy.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">MicroVictoryArmy</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                  <a 
                    href="https://VoiceMarkr.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">VoiceMarkr</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                  <a 
                    href="https://Baoism.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">Baoism</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                  <a 
                    href="https://xmap.lovable.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">XMap</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                  <a 
                    href="https://ZguideZ.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">ZguideZ</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                  <a 
                    href="https://Litether.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">Litether</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                  <a 
                    href="https://AVeryGoodNovel.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">A Very Good Novel</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                  <a 
                    href="https://la.mster.quest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">Lamster Quest</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy Controls - Most Important Section */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Data & Privacy Controls
                </CardTitle>
                <CardDescription>
                  Control what data third-party apps can access by default when you use "Login with XCROL"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-primary">Your Data, Your Rules</p>
                      <p className="text-muted-foreground mt-1">
                        These defaults apply when apps request access. You can always override them during authorization, 
                        and you can revoke access anytime in "Connected Apps" below.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Default OAuth Scope Permissions
                  </h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="share-email">Share Email Address</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow apps to see your email by default
                      </p>
                    </div>
                    <Switch
                      id="share-email"
                      checked={settings.default_share_email}
                      onCheckedChange={(checked) => handleSettingChange("default_share_email", checked)}
                    />
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="share-hometown">Share Hometown Location</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow apps to see your hometown coordinates
                      </p>
                    </div>
                    <Switch
                      id="share-hometown"
                      checked={settings.default_share_hometown}
                      onCheckedChange={(checked) => handleSettingChange("default_share_hometown", checked)}
                    />
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="share-connections">Share Friends List</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow apps to see who you're connected with
                      </p>
                    </div>
                    <Switch
                      id="share-connections"
                      checked={settings.default_share_connections}
                      onCheckedChange={(checked) => handleSettingChange("default_share_connections", checked)}
                    />
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="share-xcrol">Share Xcrol Entries</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow apps to read your diary entries
                      </p>
                    </div>
                    <Switch
                      id="share-xcrol"
                      checked={settings.default_share_xcrol}
                      onCheckedChange={(checked) => handleSettingChange("default_share_xcrol", checked)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Your personal info visibility (birthday, addresses, etc.) is controlled separately on your{" "}
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-xs text-primary"
                      onClick={() => navigate("/profile")}
                    >
                      Profile page
                    </Button>
                    . Those settings determine what friends at different levels can see.
                  </p>
                </div>
              </CardContent>
            </Card>

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
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => handleSettingChange("email_notifications", checked)}
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
                    checked={settings.friend_request_notifications}
                    onCheckedChange={(checked) => handleSettingChange("friend_request_notifications", checked)}
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
                  Control your visibility and accessibility
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
                    checked={settings.show_online_status}
                    onCheckedChange={(checked) => handleSettingChange("show_online_status", checked)}
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
                    checked={settings.allow_friend_requests}
                    onCheckedChange={(checked) => handleSettingChange("allow_friend_requests", checked)}
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
                  Apps you've authorized to access your XCROL account. Revoke access anytime.
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
                  Create OAuth apps to let other sites use "Login with XCROL".{" "}
                  <a 
                    href="https://xcrol.com/developers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View documentation →
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeveloperAppsManager />
              </CardContent>
            </Card>

            {/* Help & Tutorial */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scroll className="w-5 h-5" />
                  Help & Tutorial
                </CardTitle>
                <CardDescription>
                  Revisit the guided introduction to XCROL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    reopenTutorial();
                    navigate("/powers");
                  }}
                  className="w-full"
                >
                  <Scroll className="w-4 h-4 mr-2" />
                  Reopen the Scroll
                </Button>
              </CardContent>
            </Card>

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
      </div>
    </TooltipProvider>
  );
};

export default Settings;