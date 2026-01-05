import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Trash2, ExternalLink, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ConnectedApp {
  id: string;
  scopes: string[];
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    homepage_url: string | null;
    is_verified: boolean;
  };
}

interface ScopeInfo {
  id: string;
  name: string;
  description: string;
}

const ConnectedAppsManager = () => {
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [scopes, setScopes] = useState<Record<string, ScopeInfo>>({});
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<ConnectedApp | null>(null);

  useEffect(() => {
    loadConnectedApps();
    loadScopes();
  }, []);

  const loadScopes = async () => {
    const { data } = await supabase
      .from("oauth_scopes")
      .select("id, name, description");
    
    if (data) {
      const scopeMap: Record<string, ScopeInfo> = {};
      data.forEach((s: any) => {
        scopeMap[s.id] = s;
      });
      setScopes(scopeMap);
    }
  };

  const loadConnectedApps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("oauth_user_authorizations")
        .select(`
          id,
          scopes,
          created_at,
          updated_at,
          oauth_clients (
            id,
            name,
            description,
            logo_url,
            homepage_url,
            is_verified
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedApps = (data || []).map((item: any) => ({
        id: item.id,
        scopes: item.scopes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        client: item.oauth_clients,
      }));

      setApps(formattedApps);
    } catch (error) {
      console.error("Error loading connected apps:", error);
      toast.error("Failed to load connected apps");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (app: ConnectedApp) => {
    setRevoking(app.id);
    try {
      // Revoke all tokens for this app
      await supabase
        .from("oauth_tokens")
        .update({ revoked: true })
        .eq("client_id", app.client.id);

      // Delete the authorization
      const { error } = await supabase
        .from("oauth_user_authorizations")
        .delete()
        .eq("id", app.id);

      if (error) throw error;

      setApps(prev => prev.filter(a => a.id !== app.id));
      toast.success(`Revoked access for ${app.client.name}`);
    } catch (error) {
      console.error("Error revoking access:", error);
      toast.error("Failed to revoke access");
    } finally {
      setRevoking(null);
      setConfirmRevoke(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No Connected Apps</h3>
          <p className="text-sm text-muted-foreground">
            You haven't authorized any third-party apps to access your XCROL account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {apps.map((app) => (
        <Card key={app.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                {app.client.logo_url ? (
                  <AvatarImage src={app.client.logo_url} alt={app.client.name} />
                ) : (
                  <AvatarFallback>
                    {app.client.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{app.client.name}</h3>
                  {app.client.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                {app.client.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {app.client.description}
                  </p>
                )}

                {app.client.homepage_url && (
                  <a
                    href={app.client.homepage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    {new URL(app.client.homepage_url).hostname}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {app.scopes.map((scopeId) => (
                      <Badge key={scopeId} variant="outline" className="text-xs">
                        {scopes[scopeId]?.name || scopeId}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Connected {format(new Date(app.created_at), "MMM d, yyyy")}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmRevoke(app)}
                disabled={revoking === app.id}
              >
                {revoking === app.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Revoke
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={!!confirmRevoke} onOpenChange={() => setConfirmRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke access for <strong>{confirmRevoke?.client.name}</strong>? 
              This app will no longer be able to access your XCROL data. You can re-authorize it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRevoke && handleRevokeAccess(confirmRevoke)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConnectedAppsManager;
