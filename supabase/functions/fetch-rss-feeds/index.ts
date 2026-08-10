import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit } from "../_shared/ratelimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractText(xml: string, tag: string): string | null {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

interface FeedItem {
  title: string;
  content: string | null;
  link: string;
  published_at: string;
  guid: string;
}

function parseRSS(xml: string): { title: string | null; items: FeedItem[] } {
  const isAtom = xml.includes("<feed") && xml.includes("xmlns=\"http://www.w3.org/2005/Atom\"");

  if (isAtom) {
    return parseAtom(xml);
  }
  return parseRSS2(xml);
}

function parseRSS2(xml: string): { title: string | null; items: FeedItem[] } {
  const channelTitle = extractText(xml, "title");
  const items: FeedItem[] = [];

  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractText(itemXml, "title") || "Untitled";
    const description = extractText(itemXml, "description") || extractText(itemXml, "content:encoded");
    const link = extractText(itemXml, "link") || "";
    const pubDate = extractText(itemXml, "pubDate");
    const guid = extractText(itemXml, "guid") || link || title;

    let published_at: string;
    try {
      published_at = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
    } catch {
      published_at = new Date().toISOString();
    }

    // Strip HTML from description for clean text
    const cleanContent = description
      ? description.replace(/<[^>]*>/g, "").substring(0, 500)
      : null;

    items.push({ title, content: cleanContent, link, published_at, guid });
  }

  return { title: channelTitle, items };
}

function parseAtom(xml: string): { title: string | null; items: FeedItem[] } {
  const feedTitle = extractText(xml, "title");
  const items: FeedItem[] = [];

  const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    const title = extractText(entryXml, "title") || "Untitled";
    const summary = extractText(entryXml, "summary") || extractText(entryXml, "content");
    const link = extractAttr(entryXml, "link", "href") || "";
    const published = extractText(entryXml, "published") || extractText(entryXml, "updated");
    const id = extractText(entryXml, "id") || link || title;

    let published_at: string;
    try {
      published_at = published ? new Date(published).toISOString() : new Date().toISOString();
    } catch {
      published_at = new Date().toISOString();
    }

    const cleanContent = summary
      ? summary.replace(/<[^>]*>/g, "").substring(0, 500)
      : null;

    items.push({ title, content: cleanContent, link, published_at, guid: id });
  }

  return { title: feedTitle, items };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await enforceRateLimit(req, "fetch-rss-feeds", { limit: 10 }, corsHeaders);
  if (limited) return limited;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Use service role for DB operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const feedId = body.feed_id; // optional: fetch only one feed

    // Get user's RSS feeds
    let query = adminClient
      .from("user_rss_feeds")
      .select("*")
      .eq("user_id", userId);

    if (feedId) {
      query = query.eq("id", feedId);
    }

    const { data: feeds, error: feedsError } = await query;
    if (feedsError) throw feedsError;
    if (!feeds || feeds.length === 0) {
      return new Response(JSON.stringify({ fetched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalInserted = 0;

    for (const feed of feeds) {
      try {
        const response = await fetch(feed.feed_url, {
          headers: { "User-Agent": "XCROL-RSS-Reader/1.0" },
        });
        if (!response.ok) continue;

        const xml = await response.text();
        const parsed = parseRSS(xml);

        // Update feed name if not set
        if (!feed.feed_name && parsed.title) {
          await adminClient
            .from("user_rss_feeds")
            .update({ feed_name: parsed.title })
            .eq("id", feed.id);
        }

        // Upsert items (limit to 20 most recent)
        const items = parsed.items.slice(0, 20).map((item) => ({
          feed_id: feed.id,
          user_id: userId,
          title: item.title.substring(0, 500),
          content: item.content,
          link: item.link,
          published_at: item.published_at,
          guid: item.guid.substring(0, 500),
        }));

        if (items.length > 0) {
          const { data: upserted } = await adminClient
            .from("rss_feed_items")
            .upsert(items, { onConflict: "feed_id,guid", ignoreDuplicates: true });
          totalInserted += items.length;
        }
      } catch (e) {
        console.error(`Failed to fetch feed ${feed.feed_url}:`, e);
      }
    }

    return new Response(JSON.stringify({ fetched: totalInserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
