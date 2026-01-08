import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64Encode(new Uint8Array(hash))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, string>;
    
    console.log("OAuth token request received, content-type:", contentType);
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    } else {
      body = await req.json();
    }

    console.log("Request body parsed:", { 
      grant_type: body.grant_type, 
      client_id: body.client_id,
      redirect_uri: body.redirect_uri,
      code: body.code ? body.code.substring(0, 10) + "..." : undefined,
      has_client_secret: !!body.client_secret,
      has_code_verifier: !!body.code_verifier
    });

    const { grant_type, code, redirect_uri, client_id, client_secret, refresh_token, code_verifier } = body;

    if (grant_type === "authorization_code") {
      if (!code || !redirect_uri || !client_id) {
        console.error("Missing required parameters:", { code: !!code, redirect_uri: !!redirect_uri, client_id: !!client_id });
        return new Response(
          JSON.stringify({ error: "invalid_request", error_description: "Missing required parameters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get authorization code
      console.log("Looking up authorization code...");
      const { data: authCode, error: codeError } = await supabase
        .from("oauth_authorization_codes")
        .select("*, oauth_clients!inner(id, client_id, client_secret)")
        .eq("code", code)
        .single();

      if (codeError || !authCode) {
        console.error("Auth code lookup failed:", codeError);
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Invalid authorization code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Auth code found:", {
        id: authCode.id,
        client_id_from_db: authCode.oauth_clients.client_id,
        client_id_from_request: client_id,
        expires_at: authCode.expires_at,
        redirect_uri_db: authCode.redirect_uri,
        redirect_uri_request: redirect_uri
      });

      // Check expiration
      if (new Date(authCode.expires_at) < new Date()) {
        await supabase.from("oauth_authorization_codes").delete().eq("id", authCode.id);
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Authorization code expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify client credentials
      if (authCode.oauth_clients.client_id !== client_id) {
        return new Response(
          JSON.stringify({ error: "invalid_client", error_description: "Client ID mismatch" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify client secret (if provided) or PKCE code_verifier
      if (client_secret) {
        if (authCode.oauth_clients.client_secret !== client_secret) {
          return new Response(
            JSON.stringify({ error: "invalid_client", error_description: "Invalid client secret" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (authCode.code_challenge && code_verifier) {
        // PKCE verification
        let computedChallenge: string;
        if (authCode.code_challenge_method === "S256") {
          computedChallenge = await sha256(code_verifier);
        } else {
          computedChallenge = code_verifier;
        }
        
        if (computedChallenge !== authCode.code_challenge) {
          return new Response(
            JSON.stringify({ error: "invalid_grant", error_description: "Invalid code verifier" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (authCode.code_challenge) {
        return new Response(
          JSON.stringify({ error: "invalid_request", error_description: "Code verifier required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify redirect_uri matches
      if (authCode.redirect_uri !== redirect_uri) {
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Redirect URI mismatch" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete the used authorization code
      await supabase.from("oauth_authorization_codes").delete().eq("id", authCode.id);

      // Create access token
      const { data: token, error: tokenError } = await supabase
        .from("oauth_tokens")
        .insert({
          client_id: authCode.client_id,
          user_id: authCode.user_id,
          scopes: authCode.scopes,
        })
        .select("access_token, refresh_token, access_token_expires_at, scopes")
        .single();

      if (tokenError) {
        console.error("Error creating token:", tokenError);
        return new Response(
          JSON.stringify({ error: "server_error", error_description: "Could not create tokens" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          access_token: token.access_token,
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: token.refresh_token,
          scope: token.scopes.join(" "),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (grant_type === "refresh_token") {
      if (!refresh_token || !client_id) {
        return new Response(
          JSON.stringify({ error: "invalid_request", error_description: "Missing required parameters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find existing token
      const { data: existingToken, error: tokenError } = await supabase
        .from("oauth_tokens")
        .select("*, oauth_clients!inner(client_id, client_secret)")
        .eq("refresh_token", refresh_token)
        .eq("revoked", false)
        .single();

      if (tokenError || !existingToken) {
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Invalid refresh token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check refresh token expiration
      if (new Date(existingToken.refresh_token_expires_at) < new Date()) {
        await supabase.from("oauth_tokens").update({ revoked: true }).eq("id", existingToken.id);
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Refresh token expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify client
      if (existingToken.oauth_clients.client_id !== client_id) {
        return new Response(
          JSON.stringify({ error: "invalid_client" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (client_secret && existingToken.oauth_clients.client_secret !== client_secret) {
        return new Response(
          JSON.stringify({ error: "invalid_client" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Revoke old token
      await supabase.from("oauth_tokens").update({ revoked: true }).eq("id", existingToken.id);

      // Create new token
      const { data: newToken, error: newTokenError } = await supabase
        .from("oauth_tokens")
        .insert({
          client_id: existingToken.client_id,
          user_id: existingToken.user_id,
          scopes: existingToken.scopes,
        })
        .select("access_token, refresh_token, access_token_expires_at, scopes")
        .single();

      if (newTokenError) {
        return new Response(
          JSON.stringify({ error: "server_error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          access_token: newToken.access_token,
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: newToken.refresh_token,
          scope: newToken.scopes.join(" "),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "unsupported_grant_type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth token error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", error_description: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
