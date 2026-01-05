import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get bearer token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "invalid_token", error_description: "Missing or invalid bearer token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json", "WWW-Authenticate": "Bearer" } }
      );
    }

    const accessToken = authHeader.substring(7);

    // Find token
    const { data: token, error: tokenError } = await supabase
      .from("oauth_tokens")
      .select("user_id, scopes, access_token_expires_at, revoked")
      .eq("access_token", accessToken)
      .eq("revoked", false)
      .single();

    if (tokenError || !token) {
      return new Response(
        JSON.stringify({ error: "invalid_token", error_description: "Token not found or revoked" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json", "WWW-Authenticate": "Bearer" } }
      );
    }

    // Check expiration
    if (new Date(token.access_token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "invalid_token", error_description: "Token expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json", "WWW-Authenticate": "Bearer" } }
      );
    }

    // Check scope
    const scopes = token.scopes as string[];
    if (!scopes.includes("connections:degree")) {
      return new Response(
        JSON.stringify({ error: "insufficient_scope", error_description: "connections:degree scope required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user from query
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("target_user_id");
    const targetUsername = url.searchParams.get("target_username");

    if (!targetUserId && !targetUsername) {
      return new Response(
        JSON.stringify({ error: "invalid_request", error_description: "target_user_id or target_username required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let resolvedTargetId = targetUserId;

    // Resolve username to ID if needed
    if (!resolvedTargetId && targetUsername) {
      const { data: resolvedId, error: resolveError } = await supabase
        .rpc("resolve_username_to_id", { target_username: targetUsername });

      if (resolveError || !resolvedId) {
        return new Response(
          JSON.stringify({ error: "not_found", error_description: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      resolvedTargetId = resolvedId;
    }

    // Get connection degree
    const { data: connectionResult, error: connectionError } = await supabase
      .rpc("get_connection_degree", {
        from_user_id: token.user_id,
        to_user_id: resolvedTargetId,
        max_depth: 6,
      });

    if (connectionError) {
      console.error("Connection degree error:", connectionError);
      return new Response(
        JSON.stringify({ error: "server_error", error_description: "Failed to compute connection degree" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!connectionResult || connectionResult.length === 0) {
      return new Response(
        JSON.stringify({
          connected: false,
          degree: null,
          path: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = connectionResult[0];

    // Get basic info for path members
    const { data: pathProfiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", result.path);

    const profileMap = new Map((pathProfiles || []).map((p: any) => [p.id, p]));
    const enrichedPath = result.path.map((id: string) => {
      const profile = profileMap.get(id);
      return {
        id,
        name: profile?.display_name,
        avatar: profile?.avatar_url,
      };
    });

    return new Response(
      JSON.stringify({
        connected: true,
        degree: result.degree,
        path: enrichedPath,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth connection-degree error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", error_description: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
