import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ClientInfo {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  homepage_url: string | null;
  is_verified: boolean;
}

interface ScopeInfo {
  id: string;
  name: string;
  description: string;
  category: string;
}

const OAuthAuthorize = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [scopes, setScopes] = useState<ScopeInfo[]>([]);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [oauthParams, setOauthParams] = useState<{
    clientId: string;
    redirectUri: string;
    state: string | null;
    codeChallenge: string | null;
    codeChallengeMethod: string | null;
  } | null>(null);

  useEffect(() => {
    checkAuthAndLoadClient();
  }, [searchParams]);

  const checkAuthAndLoadClient = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to auth with return URL
        const returnUrl = window.location.href;
        navigate(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }
      
      setUser(session.user);

      const clientId = searchParams.get("client_id");
      const redirectUri = searchParams.get("redirect_uri");
      const scope = searchParams.get("scope") || "profile:read";
      const state = searchParams.get("state");
      const codeChallenge = searchParams.get("code_challenge");
      const codeChallengeMethod = searchParams.get("code_challenge_method");

      if (!clientId || !redirectUri) {
        setError("Invalid authorization request. Missing client_id or redirect_uri.");
        setLoading(false);
        return;
      }

      setOauthParams({
        clientId,
        redirectUri,
        state,
        codeChallenge,
        codeChallengeMethod,
      });

      // Fetch client info via edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-authorize?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error_description || errorData.error || "Invalid request");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setClient(data.client);
      setScopes(data.scopes);
      setSelectedScopes(data.scopes.map((s: ScopeInfo) => s.id));
    } catch (err) {
      console.error("Error loading OAuth client:", err);
      setError("Failed to load authorization request");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!oauthParams || !client) return;
    
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please log in again.");
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            client_id: oauthParams.clientId,
            redirect_uri: oauthParams.redirectUri,
            scopes: selectedScopes,
            state: oauthParams.state,
            code_challenge: oauthParams.codeChallenge,
            code_challenge_method: oauthParams.codeChallengeMethod,
            action: "authorize",
          }),
        }
      );

      const data = await response.json();
      
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        toast.error(data.error_description || "Authorization failed");
      }
    } catch (err) {
      console.error("Authorization error:", err);
      toast.error("Authorization failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!oauthParams) return;
    
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            client_id: oauthParams.clientId,
            redirect_uri: oauthParams.redirectUri,
            state: oauthParams.state,
            action: "deny",
          }),
        }
      );

      const data = await response.json();
      
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch (err) {
      // On error, still try to redirect with error
      const redirectUrl = new URL(oauthParams.redirectUri);
      redirectUrl.searchParams.set("error", "access_denied");
      if (oauthParams.state) redirectUrl.searchParams.set("state", oauthParams.state);
      window.location.href = redirectUrl.toString();
    }
  };

  const toggleScope = (scopeId: string) => {
    if (scopeId === "profile:read") return; // Always required
    
    setSelectedScopes(prev => 
      prev.includes(scopeId) 
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "basic": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "personal": return <Shield className="w-4 h-4 text-yellow-500" />;
      case "social": return <Shield className="w-4 h-4 text-blue-500" />;
      case "content": return <Shield className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Authorization Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate("/")}>
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-16 h-16">
              {client?.logo_url ? (
                <AvatarImage src={client.logo_url} alt={client.name} />
              ) : (
                <AvatarFallback className="text-lg">
                  {client?.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            {client?.name}
            {client?.is_verified && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            wants to access your XCROL account
          </CardDescription>
          {client?.homepage_url && (
            <a 
              href={client.homepage_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:underline flex items-center justify-center gap-1"
            >
              {new URL(client.homepage_url).hostname}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {client?.description && (
            <p className="text-sm text-muted-foreground text-center">
              {client.description}
            </p>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">This application will be able to:</h4>
            <div className="space-y-2 border rounded-lg p-3">
              {scopes.map((scope) => (
                <div key={scope.id} className="flex items-start gap-3">
                  <Checkbox
                    id={scope.id}
                    checked={selectedScopes.includes(scope.id)}
                    onCheckedChange={() => toggleScope(scope.id)}
                    disabled={scope.id === "profile:read"}
                  />
                  <label 
                    htmlFor={scope.id} 
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(scope.category)}
                      <span className="text-sm font-medium">{scope.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {scope.description}
                    </p>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {!client?.is_verified && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                This application has not been verified by XCROL. Only authorize if you trust the developer.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Authorizing as <strong>{user?.email}</strong>
          </p>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDeny}
            disabled={submitting}
          >
            Deny
          </Button>
          <Button
            className="flex-1"
            onClick={handleAuthorize}
            disabled={submitting || selectedScopes.length === 0}
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Authorize
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OAuthAuthorize;
