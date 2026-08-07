// Nightly off-site backup.
// Dumps every public table + auth.users as gzipped NDJSON, snapshots storage
// object catalog, and uploads everything to a user-owned Backblaze B2 bucket.
//
// Auth: admin user (via JWT) OR cron (via x-cron-secret header matching CRON_SECRET).
// Required secrets: B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME, CRON_SECRET (optional).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { b2Authorize, b2GetUploadUrl, b2UploadFile, gzipString } from "../_shared/b2.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const PAGE = 1000;

// Serialize unknown error values into a readable string. Supabase PostgrestError
// objects are plain objects, so String(e) yields "[object Object]" — handle them.
function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    // deno-lint-ignore no-explicit-any
    const o = e as any;
    const parts = [o.message, o.details, o.hint, o.code]
      .filter((v) => v !== undefined && v !== null && v !== "")
      .map(String);
    if (parts.length) return parts.join(" | ");
    try { return JSON.stringify(e); } catch { return String(e); }
  }
  return String(e);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Authorize: cron secret OR admin JWT
  const cronSecret = Deno.env.get("CRON_SECRET");
  const incomingCron = req.headers.get("x-cron-secret");
  let kind: "nightly" | "manual" = "nightly";
  let authorized = false;
  if (cronSecret && incomingCron && incomingCron === cronSecret) {
    authorized = true;
  } else {
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      if (data.user) {
        const { data: roleRow } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (roleRow) {
          authorized = true;
          kind = "manual";
        }
      }
    }
  }
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Pre-flight: B2 secrets present?
  const b2KeyId = Deno.env.get("B2_KEY_ID");
  const b2AppKey = Deno.env.get("B2_APPLICATION_KEY");
  const b2Bucket = Deno.env.get("B2_BUCKET_NAME");
  if (!b2KeyId || !b2AppKey || !b2Bucket) {
    return new Response(
      JSON.stringify({
        error: "Backup destination not configured",
        missing: ["B2_KEY_ID", "B2_APPLICATION_KEY", "B2_BUCKET_NAME"].filter(
          (k) => !Deno.env.get(k),
        ),
      }),
      { status: 412, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Record run start
  const { data: runRow, error: runErr } = await admin
    .from("backup_runs")
    .insert({ kind, status: "running" })
    .select("id")
    .single();
  if (runErr || !runRow) {
    return new Response(JSON.stringify({ error: "Could not start run", detail: runErr?.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const runId: string = runRow.id;

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const prefix = `xcrol/${new Date().toISOString().slice(0, 10)}/${stamp}`;
  let bytesUploaded = 0;
  let filesUploaded = 0;
  let tablesDumped = 0;
  const tableSummary: Record<string, { rows: number; bytes: number }> = {};
  const errors: string[] = [];

  try {
    const auth = await b2Authorize(b2KeyId, b2AppKey, b2Bucket);

    // 1) Enumerate public tables. We rely on a small RPC-less approach:
    // information_schema isn't exposed to PostgREST, so we maintain the
    // canonical list here. Keep in sync with new migrations.
    const tables = await listPublicTables(admin);

    // 2) Dump each table
    for (const t of tables) {
      try {
        const lines: string[] = [];
        let from = 0;
        // deno-lint-ignore no-constant-condition
        while (true) {
          const { data, error } = await admin
            .from(t)
            .select("*")
            .range(from, from + PAGE - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          for (const row of data) lines.push(JSON.stringify(row));
          if (data.length < PAGE) break;
          from += PAGE;
        }
        const gz = await gzipString(lines.join("\n") + (lines.length ? "\n" : ""));
        const target = await b2GetUploadUrl(auth);
        const key = `${prefix}/db/${t}.ndjson.gz`;
        const res = await b2UploadFile(target, key, gz, "application/gzip");
        bytesUploaded += res.size;
        filesUploaded += 1;
        tablesDumped += 1;
        tableSummary[t] = { rows: lines.length, bytes: res.size };
      } catch (e) {
        errors.push(`table ${t}: ${errMsg(e)}`);
      }
    }

    // 3) Dump auth.users.
    // listUsers alone does NOT return encrypted_password (verified in the
    // 2026-08-06 dry-run revival — see docs/DRYRUN-2026-08-06.md), so we merge
    // in bcrypt hashes from the service_role-only SECURITY DEFINER RPC
    // backup_export_auth_password_hashes(). Without this, accounts survive a
    // revival but passwords do not.
    try {
      const users: Record<string, unknown>[] = [];
      let page = 1;
      // deno-lint-ignore no-constant-condition
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        users.push(...data.users);
        if (!data.users.length || data.users.length < 1000) break;
        page += 1;
      }
      // Merge password hashes. If the RPC fails, still upload the hash-less
      // dump but record the error so the run is marked failed (a backup that
      // silently drops hashes is exactly what the dry run caught).
      try {
        const { data: hashRows, error: hashErr } = await admin.rpc(
          "backup_export_auth_password_hashes",
        );
        if (hashErr) throw hashErr;
        const hashById = new Map<string, string>(
          (hashRows ?? []).map((r: { id: string; encrypted_password: string }) => [
            r.id,
            r.encrypted_password,
          ]),
        );
        for (const u of users) {
          const h = hashById.get(u.id as string);
          if (h) u.encrypted_password = h;
        }
      } catch (e) {
        errors.push(`auth.users password hashes: ${errMsg(e)}`);
      }
      const gz = await gzipString(users.map((u) => JSON.stringify(u)).join("\n"));
      const target = await b2GetUploadUrl(auth);
      const key = `${prefix}/auth/users.ndjson.gz`;
      const res = await b2UploadFile(target, key, gz, "application/gzip");
      bytesUploaded += res.size;
      filesUploaded += 1;
      tableSummary["auth.users"] = { rows: users.length, bytes: res.size };
    } catch (e) {
      errors.push(`auth.users: ${errMsg(e)}`);
    }

    // 4) Storage object catalog (paths + metadata, not bytes — v1)
    const storageCatalog: Record<string, { name: string; size: number; updated_at?: string }[]> = {};
    try {
      const { data: buckets } = await admin.storage.listBuckets();
      for (const b of buckets ?? []) {
        const list: { name: string; size: number; updated_at?: string }[] = [];
        await walkBucket(admin, b.name, "", list);
        storageCatalog[b.name] = list;
      }
      const gz = await gzipString(JSON.stringify(storageCatalog));
      const target = await b2GetUploadUrl(auth);
      const key = `${prefix}/storage/catalog.json.gz`;
      const res = await b2UploadFile(target, key, gz, "application/gzip");
      bytesUploaded += res.size;
      filesUploaded += 1;
    } catch (e) {
      errors.push(`storage catalog: ${errMsg(e)}`);
    }

    // 4b) Tier-2 read-only fallback snapshot — small JSON of public content
    // uploaded to the public `public-snapshots` storage bucket. Served by the
    // Storage CDN so the public site keeps rendering when Postgres compute is
    // paused. Best-effort — never fails the whole backup run.
    try {
      await publishPublicSnapshot(admin);
    } catch (e) {
      errors.push(`public snapshot: ${errMsg(e)}`);
    }

    // 5) Secret-name inventory (NAMES ONLY — never values)
    const secretInventory = [
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "RESEND_API_KEY",
      "MAPBOX_PUBLIC_TOKEN",
      "B2_KEY_ID",
      "B2_APPLICATION_KEY",
      "B2_BUCKET_NAME",
      "CRON_SECRET",
    ].filter((n) => Deno.env.get(n) !== undefined);

    // 6) Manifest
    const manifest = {
      kind,
      run_id: runId,
      generated_at: new Date().toISOString(),
      prefix,
      tables: tableSummary,
      storage_buckets: Object.fromEntries(
        Object.entries(storageCatalog).map(([k, v]) => [k, { files: v.length }]),
      ),
      secret_names_present: secretInventory,
      errors,
      schema_version_hint: "see supabase/migrations/ for the exact DDL to recreate the schema",
    };
    const manifestGz = await gzipString(JSON.stringify(manifest, null, 2));
    const manifestKey = `${prefix}/manifest.json.gz`;
    const mt = await b2GetUploadUrl(auth);
    const mRes = await b2UploadFile(mt, manifestKey, manifestGz, "application/gzip");
    bytesUploaded += mRes.size;
    filesUploaded += 1;

    await admin
      .from("backup_runs")
      .update({
        status: errors.length === 0 ? "success" : "failed",
        finished_at: new Date().toISOString(),
        bytes_uploaded: bytesUploaded,
        files_uploaded: filesUploaded,
        tables_dumped: tablesDumped,
        manifest_key: manifestKey,
        error: errors.length ? errors.join("; ").slice(0, 4000) : null,
        notes: { table_summary: tableSummary },
      })
      .eq("id", runId);

    // Optional alert webhook
    const webhook = Deno.env.get("BACKUP_ALERT_WEBHOOK");
    if (webhook) {
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `Xcrol backup ${errors.length ? "FAILED" : "OK"} — ${filesUploaded} files, ${Math.round(bytesUploaded / 1024)} KB — ${manifestKey}`,
          }),
        });
      } catch {
        // non-fatal
      }
    }

    return new Response(
      JSON.stringify({ ok: errors.length === 0, run_id: runId, manifest_key: manifestKey, bytes_uploaded: bytesUploaded, files_uploaded: filesUploaded, tables_dumped: tablesDumped, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = errMsg(e);
    await admin
      .from("backup_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error: msg.slice(0, 4000) })
      .eq("id", runId);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Recursively walk a storage bucket cataloging file metadata.
async function walkBucket(
  // deno-lint-ignore no-explicit-any
  admin: any,
  bucket: string,
  prefix: string,
  out: { name: string; size: number; updated_at?: string }[],
) {
  let offset = 0;
  // deno-lint-ignore no-constant-condition
  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null || item.metadata === null) {
        // folder
        await walkBucket(admin, bucket, full, out);
      } else {
        out.push({
          name: full,
          size: item.metadata?.size ?? 0,
          updated_at: item.updated_at,
        });
      }
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
}

// deno-lint-ignore no-explicit-any
async function listPublicTables(admin: any): Promise<string[]> {
  // Best-effort: try a SECURITY DEFINER RPC first; otherwise fall back to a
  // hand-maintained list of known public tables.
  try {
    const { data, error } = await admin.rpc("list_public_tables");
    if (!error && Array.isArray(data)) return data as string[];
  } catch { /* ignore */ }
  return KNOWN_TABLES;
}

// Hand-maintained fallback (keep in rough sync with migrations).
// Missing tables here only means they won't be backed up by this fallback path;
// the runbook explains the canonical list comes from the schema migrations.
const KNOWN_TABLES = [
  "account_deletion_requests",
  "art_i_fucked_state",
  "audit_log",
  "backup_runs",
  "brook_comments",
  "brook_posts",
  "brook_reactions",
  "brooks",
  "country_invites",
  "custom_friendship_types",
  "dismissed_reference_notifications",
  "dream_trips",
  "flagged_references",
  "friend_requests",
  "friendships",
  "game_deaths",
  "game_sessions",
  "group_comment_reactions",
  "group_members",
  "group_post_comments",
  "group_post_reactions",
  "group_posts",
  "groups",
  "hosting_preferences",
  "hosting_requests",
  "introduction_requests",
  "invite_notification_seen",
  "layer_relationships",
  "layers",
  "meetup_preferences",
  "meetup_requests",
  "meetups",
  "messages",
  "notifications",
  "oauth_authorization_codes",
  "oauth_clients",
  "oauth_scopes",
  "oauth_tokens",
  "oauth_user_authorizations",
  "pending_invite_codes",
  "profile_widgets",
  "profiles",
  "resolution_game_state",
  "river_replies",
  "river_reply_reactions",
  "rss_feed_items",
  "scroll_ai_usage",
  "scroll_items",
  "scroll_publication_reactions",
  "scroll_publications",
  "scrolls",
  "sly_doubt_game_state",
  "social_links",
  "town_listings",
  "tutorial_completion",
  "user_blocks",
  "user_invites",
  "user_references",
  "user_roles",
  "user_rss_feeds",
  "user_settings",
  "waitlist",
  "weekly_digest_log",
  "wolfemon_game_state",
  "xcrol_entries",
  "xcrol_reactions",
];

// ---------------------------------------------------------------------------
// Tier-2 public snapshot
// ---------------------------------------------------------------------------
// Writes a small JSON blob to the public `public-snapshots` bucket so the
// public surface of the app can degrade gracefully to read-only when the
// backend is unreachable. Contains ONLY public-safe data — no PII, no
// private fields. Overwrites `latest.json` each run.
// deno-lint-ignore no-explicit-any
async function publishPublicSnapshot(admin: any) {
  const BUCKET = "public-snapshots";

  // Ensure the bucket exists and is public. createBucket throws if exists;
  // updateBucket is the safe upsert path.
  try {
    await admin.storage.createBucket(BUCKET, { public: true });
  } catch {
    // Already exists — ensure it is public.
    try {
      await admin.storage.updateBucket(BUCKET, { public: true });
    } catch { /* ignore */ }
  }

  const todayUtc = new Date().toISOString().slice(0, 10);

  // Stats — mirrors get-public-stats.
  const [entriesRes, hometownsRes, brooksRes] = await Promise.all([
    admin.from("xcrol_entries").select("id", { count: "exact", head: true }).eq("entry_date", todayUtc),
    admin.from("profiles").select("hometown_country", { count: "exact" }).not("hometown_city", "is", null),
    admin.from("brooks").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  const countries = new Set(
    (hometownsRes.data ?? [])
      .map((r: { hometown_country: string | null }) => r.hometown_country)
      .filter((c: string | null) => c && c.trim() !== ""),
  );

  // Recent public River posts (last 50). Only public-tier scrolls.
  const { data: river } = await admin
    .from("scroll_items")
    .select("id, user_id, content, created_at, privacy_level")
    .eq("privacy_level", "public")
    .order("created_at", { ascending: false })
    .limit(50);

  // Map user_ids → public display info.
  const userIds = Array.from(new Set((river ?? []).map((r: { user_id: string }) => r.user_id)));
  const profilesById: Record<string, { username: string | null; display_name: string | null }> = {};
  if (userIds.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, username, display_name")
      .in("id", userIds);
    for (const p of profs ?? []) {
      profilesById[p.id] = { username: p.username, display_name: p.display_name };
    }
  }

  // Recent publications (public).
  const { data: pubs } = await admin
    .from("scroll_publications")
    .select("id, slug, title, author_id, published_at")
    .order("published_at", { ascending: false })
    .limit(30);

  const snapshot = {
    generated_at: new Date().toISOString(),
    stats: {
      entries_today: entriesRes.count ?? 0,
      hometowns_total: hometownsRes.count ?? 0,
      countries_total: countries.size,
      brooks_active: brooksRes.count ?? 0,
    },
    river: (river ?? []).map((r: { id: string; user_id: string; content: string; created_at: string }) => ({
      id: r.id,
      user_id: r.user_id,
      username: profilesById[r.user_id]?.username ?? null,
      display_name: profilesById[r.user_id]?.display_name ?? null,
      content: r.content,
      created_at: r.created_at,
    })),
    publications: pubs ?? [],
  };

  const body = new TextEncoder().encode(JSON.stringify(snapshot));
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload("latest.json", body, {
      contentType: "application/json",
      upsert: true,
      cacheControl: "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
    });
  if (upErr) throw upErr;
}

