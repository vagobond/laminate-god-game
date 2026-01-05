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

    const scopes = token.scopes as string[];

    // Build response based on scopes
    const response: Record<string, any> = {
      sub: token.user_id,
    };

    // Get profile if any profile scope is granted
    if (scopes.some(s => s.startsWith("profile:"))) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", token.user_id)
        .single();

      if (profile) {
        // Always include basic info if profile:read is granted
        if (scopes.includes("profile:read")) {
          response.name = profile.display_name;
          response.picture = profile.avatar_url;
          response.bio = profile.bio;
          response.username = profile.username;
          response.link = profile.link;
        }

        if (scopes.includes("profile:email")) {
          response.email = profile.email || profile.contact_email;
        }

        if (scopes.includes("hometown:read")) {
          response.hometown = {
            city: profile.hometown_city,
            country: profile.hometown_country,
            description: profile.hometown_description,
            latitude: profile.hometown_latitude,
            longitude: profile.hometown_longitude,
          };
        }
      }
    }

    // Get connections if connections scope is granted
    if (scopes.includes("connections:read")) {
      const { data: friends } = await supabase
        .from("friendships")
        .select("friend_id, level, profiles!friendships_friend_id_fkey(display_name, avatar_url)")
        .eq("user_id", token.user_id)
        .in("level", ["close_friend", "buddy", "friendly_acquaintance"]);

      response.connections = (friends || []).map((f: any) => ({
        id: f.friend_id,
        level: f.level,
        name: f.profiles?.display_name,
        avatar: f.profiles?.avatar_url,
      }));
    }

    // Get xcrol entries if xcrol scope is granted
    if (scopes.includes("xcrol:read")) {
      const { data: entries } = await supabase
        .from("xcrol_entries")
        .select("id, content, entry_date, created_at")
        .eq("user_id", token.user_id)
        .eq("privacy_level", "public")
        .order("entry_date", { ascending: false })
        .limit(10);

      response.xcrol_entries = entries || [];
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth userinfo error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", error_description: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
