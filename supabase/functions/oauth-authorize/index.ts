import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    
    // Handle GET request - validate client and return info for consent screen
    if (req.method === "GET") {
      const clientId = url.searchParams.get("client_id");
      const redirectUri = url.searchParams.get("redirect_uri");
      const scope = url.searchParams.get("scope") || "profile:read";
      const state = url.searchParams.get("state");
      const responseType = url.searchParams.get("response_type") || "code";
      const codeChallenge = url.searchParams.get("code_challenge");
      const codeChallengeMethod = url.searchParams.get("code_challenge_method");

      if (!clientId || !redirectUri) {
        return new Response(
          JSON.stringify({ error: "invalid_request", error_description: "Missing client_id or redirect_uri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate client
      const { data: client, error: clientError } = await supabase
        .from("oauth_clients")
        .select("id, name, description, logo_url, homepage_url, redirect_uris, is_verified")
        .eq("client_id", clientId)
        .single();

      if (clientError || !client) {
        return new Response(
          JSON.stringify({ error: "invalid_client", error_description: "Unknown client" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate redirect_uri
      if (!client.redirect_uris.includes(redirectUri)) {
        return new Response(
          JSON.stringify({ error: "invalid_redirect_uri", error_description: "Redirect URI not registered" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get scope details
      const scopes = scope.split(" ").filter(Boolean);
      const { data: scopeDetails } = await supabase
        .from("oauth_scopes")
        .select("id, name, description, category")
        .in("id", scopes);

      return new Response(
        JSON.stringify({
          client: {
            id: client.id,
            name: client.name,
            description: client.description,
            logo_url: client.logo_url,
            homepage_url: client.homepage_url,
            is_verified: client.is_verified,
          },
          scopes: scopeDetails || [],
          state,
          redirect_uri: redirectUri,
          response_type: responseType,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle POST request - user grants authorization
    if (req.method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "unauthorized", error_description: "No authorization header" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate user session
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "unauthorized", error_description: "Invalid session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { client_id, redirect_uri, scopes, state, code_challenge, code_challenge_method, action } = body;

      if (action === "deny") {
        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set("error", "access_denied");
        redirectUrl.searchParams.set("error_description", "User denied the request");
        if (state) redirectUrl.searchParams.set("state", state);
        
        return new Response(
          JSON.stringify({ redirect_url: redirectUrl.toString() }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate client again
      const { data: client, error: clientError } = await supabase
        .from("oauth_clients")
        .select("id, redirect_uris")
        .eq("client_id", client_id)
        .single();

      if (clientError || !client) {
        return new Response(
          JSON.stringify({ error: "invalid_client" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!client.redirect_uris.includes(redirect_uri)) {
        return new Response(
          JSON.stringify({ error: "invalid_redirect_uri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create authorization code
      const { data: authCode, error: codeError } = await supabase
        .from("oauth_authorization_codes")
        .insert({
          client_id: client.id,
          user_id: user.id,
          redirect_uri,
          scopes,
          code_challenge,
          code_challenge_method,
        })
        .select("code")
        .single();

      if (codeError) {
        console.error("Error creating auth code:", codeError);
        return new Response(
          JSON.stringify({ error: "server_error", error_description: "Could not create authorization code" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save/update user authorization
      await supabase
        .from("oauth_user_authorizations")
        .upsert({
          user_id: user.id,
          client_id: client.id,
          scopes,
        }, { onConflict: "user_id,client_id" });

      // Build redirect URL with code
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set("code", authCode.code);
      if (state) redirectUrl.searchParams.set("state", state);

      return new Response(
        JSON.stringify({ redirect_url: redirectUrl.toString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "method_not_allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth authorize error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", error_description: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
