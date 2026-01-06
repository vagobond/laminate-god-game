import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Trash2, Eye, EyeOff, Copy, ExternalLink, Code, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface OAuthApp {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  logo_url: string | null;
  homepage_url: string | null;
  is_verified: boolean;
  created_at: string;
}

const DeveloperAppsManager = () => {
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState<OAuthApp | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<OAuthApp | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<OAuthApp | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [newApp, setNewApp] = useState({
    name: "",
    description: "",
    homepage_url: "",
    redirect_uris: "",
    logo_url: "",
  });

  const [editApp, setEditApp] = useState({
    name: "",
    description: "",
    homepage_url: "",
    redirect_uris: "",
    logo_url: "",
  });

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("oauth_clients")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApps(data || []);
    } catch (error) {
      console.error("Error loading apps:", error);
      toast.error("Failed to load your apps");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async () => {
    if (!newApp.name.trim()) {
      toast.error("App name is required");
      return;
    }

    const redirectUris = newApp.redirect_uris
      .split("\n")
      .map(uri => uri.trim())
      .filter(Boolean);

    if (redirectUris.length === 0) {
      toast.error("At least one redirect URI is required");
      return;
    }

    // Validate URIs
    for (const uri of redirectUris) {
      try {
        new URL(uri);
      } catch {
        toast.error(`Invalid redirect URI: ${uri}`);
        return;
      }
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("oauth_clients")
        .insert({
          name: newApp.name.trim(),
          description: newApp.description.trim() || null,
          homepage_url: newApp.homepage_url.trim() || null,
          redirect_uris: redirectUris,
          logo_url: newApp.logo_url.trim() || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setApps(prev => [data, ...prev]);
      setShowCreateDialog(false);
      setShowCredentialsDialog(data);
      setNewApp({ name: "", description: "", homepage_url: "", redirect_uris: "", logo_url: "" });
      toast.success("App created successfully!");
    } catch (error) {
      console.error("Error creating app:", error);
      toast.error("Failed to create app");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteApp = async (app: OAuthApp) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("oauth_clients")
        .delete()
        .eq("id", app.id);

      if (error) throw error;

      setApps(prev => prev.filter(a => a.id !== app.id));
      toast.success(`Deleted ${app.name}`);
    } catch (error) {
      console.error("Error deleting app:", error);
      toast.error("Failed to delete app");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleShowSecret = (appId: string) => {
    setShowSecrets(prev => ({ ...prev, [appId]: !prev[appId] }));
  };

  const openEditDialog = (app: OAuthApp) => {
    setEditApp({
      name: app.name,
      description: app.description || "",
      homepage_url: app.homepage_url || "",
      redirect_uris: app.redirect_uris.join("\n"),
      logo_url: app.logo_url || "",
    });
    setShowEditDialog(app);
  };

  const handleUpdateApp = async () => {
    if (!showEditDialog) return;
    
    if (!editApp.name.trim()) {
      toast.error("App name is required");
      return;
    }

    const redirectUris = editApp.redirect_uris
      .split("\n")
      .map(uri => uri.trim())
      .filter(Boolean);

    if (redirectUris.length === 0) {
      toast.error("At least one redirect URI is required");
      return;
    }

    // Validate URIs
    for (const uri of redirectUris) {
      try {
        new URL(uri);
      } catch {
        toast.error(`Invalid redirect URI: ${uri}`);
        return;
      }
    }

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from("oauth_clients")
        .update({
          name: editApp.name.trim(),
          description: editApp.description.trim() || null,
          homepage_url: editApp.homepage_url.trim() || null,
          redirect_uris: redirectUris,
          logo_url: editApp.logo_url.trim() || null,
        })
        .eq("id", showEditDialog.id)
        .select()
        .single();

      if (error) throw error;

      setApps(prev => prev.map(a => a.id === data.id ? data : a));
      setShowEditDialog(null);
      toast.success("App updated successfully!");
    } catch (error) {
      console.error("Error updating app:", error);
      toast.error("Failed to update app");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Developer Apps</h3>
          <p className="text-sm text-muted-foreground">
            Create OAuth apps to let other sites use "Login with XCROL"
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create App
        </Button>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Apps Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first OAuth app to enable "Login with XCROL" on your website.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First App
            </Button>
          </CardContent>
        </Card>
      ) : (
        apps.map((app) => (
          <Card key={app.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{app.name}</h3>
                    {app.is_verified && (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                  </div>

                  {app.description && (
                    <p className="text-sm text-muted-foreground mt-1">{app.description}</p>
                  )}

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">Client ID:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {app.client_id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(app.client_id, "Client ID")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">Secret:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {showSecrets[app.id] ? app.client_secret : "••••••••••••••••"}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShowSecret(app.id)}
                      >
                        {showSecrets[app.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(app.client_secret, "Client Secret")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-20">Redirects:</span>
                      <div className="flex-1">
                        {app.redirect_uris.map((uri, i) => (
                          <code key={i} className="text-xs bg-muted px-2 py-1 rounded block mb-1 truncate">
                            {uri}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
                    Created {format(new Date(app.created_at), "MMM d, yyyy")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(app)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(app)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Create App Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create OAuth App</DialogTitle>
            <DialogDescription>
              Create an app to enable "Login with XCROL" on your website.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">App Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome App"
                value={newApp.name}
                onChange={(e) => setNewApp(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does your app do?"
                value={newApp.description}
                onChange={(e) => setNewApp(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="homepage_url">Homepage URL</Label>
              <Input
                id="homepage_url"
                type="url"
                placeholder="https://myapp.com"
                value={newApp.homepage_url}
                onChange={(e) => setNewApp(prev => ({ ...prev, homepage_url: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="redirect_uris">Redirect URIs * (one per line)</Label>
              <Textarea
                id="redirect_uris"
                placeholder="https://myapp.com/auth/callback&#10;http://localhost:3000/auth/callback"
                value={newApp.redirect_uris}
                onChange={(e) => setNewApp(prev => ({ ...prev, redirect_uris: e.target.value }))}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Users will be redirected here after authorization
              </p>
            </div>

            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                type="url"
                placeholder="https://myapp.com/logo.png"
                value={newApp.logo_url}
                onChange={(e) => setNewApp(prev => ({ ...prev, logo_url: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateApp} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={!!showCredentialsDialog} onOpenChange={() => setShowCredentialsDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>App Created Successfully!</DialogTitle>
            <DialogDescription>
              Save your client secret now - you won't be able to see it again.
            </DialogDescription>
          </DialogHeader>

          {showCredentialsDialog && (
            <div className="space-y-4">
              <div>
                <Label>Client ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm bg-muted px-3 py-2 rounded">
                    {showCredentialsDialog.client_id}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(showCredentialsDialog.client_id, "Client ID")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Client Secret</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-sm bg-muted px-3 py-2 rounded break-all">
                    {showCredentialsDialog.client_secret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(showCredentialsDialog.client_secret, "Client Secret")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-destructive mt-1">
                  ⚠️ This secret will not be shown again. Save it securely!
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowCredentialsDialog(null)}>
              I've Saved My Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit App Dialog */}
      <Dialog open={!!showEditDialog} onOpenChange={() => setShowEditDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit App</DialogTitle>
            <DialogDescription>
              Update your OAuth app settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">App Name *</Label>
              <Input
                id="edit-name"
                placeholder="My Awesome App"
                value={editApp.name}
                onChange={(e) => setEditApp(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="What does your app do?"
                value={editApp.description}
                onChange={(e) => setEditApp(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-homepage_url">Homepage URL</Label>
              <Input
                id="edit-homepage_url"
                type="url"
                placeholder="https://myapp.com"
                value={editApp.homepage_url}
                onChange={(e) => setEditApp(prev => ({ ...prev, homepage_url: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-redirect_uris">Redirect URIs * (one per line)</Label>
              <Textarea
                id="edit-redirect_uris"
                placeholder="https://myapp.com/auth/callback&#10;http://localhost:3000/auth/callback"
                value={editApp.redirect_uris}
                onChange={(e) => setEditApp(prev => ({ ...prev, redirect_uris: e.target.value }))}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Users will be redirected here after authorization
              </p>
            </div>

            <div>
              <Label htmlFor="edit-logo_url">Logo URL</Label>
              <Input
                id="edit-logo_url"
                type="url"
                placeholder="https://myapp.com/logo.png"
                value={editApp.logo_url}
                onChange={(e) => setEditApp(prev => ({ ...prev, logo_url: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateApp} disabled={updating}>
              {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete App</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{showDeleteConfirm?.name}</strong>? 
              All users who authorized this app will be disconnected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteConfirm && handleDeleteApp(showDeleteConfirm)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete App
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeveloperAppsManager;
