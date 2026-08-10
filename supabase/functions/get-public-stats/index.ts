import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { enforceRateLimit } from "../_shared/ratelimit.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=3600",
};

interface CachedStats {
  data: {
    entries_today: number;
    hometowns_total: number;
    countries_total: number;
    brooks_active: number;
  };
  expires_at: number;
}

let cache: CachedStats | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await enforceRateLimit(req, "get-public-stats", { limit: 30 }, corsHeaders);
  if (limited) return limited;

  try {
    // Serve from in-memory cache if fresh
    if (cache && cache.expires_at > Date.now()) {
      return new Response(JSON.stringify(cache.data), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const todayUtc = new Date().toISOString().slice(0, 10);

    const [entriesRes, hometownsRes, brooksRes] = await Promise.all([
      supabase
        .from("xcrol_entries")
        .select("id", { count: "exact", head: true })
        .eq("entry_date", todayUtc),
      supabase
        .from("profiles")
        .select("hometown_country", { count: "exact" })
        .not("hometown_city", "is", null),
      supabase
        .from("brooks")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ]);

    const hometownsTotal = hometownsRes.count ?? 0;
    const countries = new Set(
      (hometownsRes.data ?? [])
        .map((r: any) => r.hometown_country)
        .filter((c: string | null) => c && c.trim() !== "")
    );

    const data = {
      entries_today: entriesRes.count ?? 0,
      hometowns_total: hometownsTotal,
      countries_total: countries.size,
      brooks_active: brooksRes.count ?? 0,
    };

    cache = { data, expires_at: Date.now() + CACHE_TTL_MS };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("get-public-stats error:", error);
    return new Response(
      JSON.stringify({
        entries_today: 0,
        hometowns_total: 0,
        countries_total: 0,
        brooks_active: 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
