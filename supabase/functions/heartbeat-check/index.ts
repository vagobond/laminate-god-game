// Dead-man's switch (DISABLED by default).
// When DEADMAN_ENABLED=1, asks admin_last_activity() (heartbeat table, last
// sign-in, session refresh, latest admin post — greatest of) and emails the
// trustee if no admin activity has been recorded in DEADMAN_DAYS days.
// Always records a heartbeat row in backup_runs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = Deno.env.get("CRON_SECRET");
  const incoming = req.headers.get("x-cron-secret");
  if (cronSecret && incoming !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: runRow } = await admin
    .from("backup_runs")
    .insert({ kind: "heartbeat", status: "running" })
    .select("id")
    .single();

  const enabled = Deno.env.get("DEADMAN_ENABLED") === "1";
  const days = Number(Deno.env.get("DEADMAN_DAYS") ?? "90");
  const trustee = Deno.env.get("TRUSTEE_EMAIL");
  const resend = Deno.env.get("RESEND_API_KEY");

  const notes: Record<string, unknown> = { enabled, days, trustee_set: !!trustee };
  let alerted = false;

  if (enabled && trustee && resend) {
    // Most recent admin activity = greatest of dashboard heartbeat, fresh
    // sign-in, session token refresh (app used while staying signed in) and
    // latest admin post — see migration 20260818100000_admin_last_activity.
    let mostRecent = 0;
    const { data: lastActivity, error: rpcErr } = await admin.rpc("admin_last_activity");
    if (!rpcErr && lastActivity) {
      mostRecent = new Date(lastActivity as string).getTime();
      notes.activity_source = "admin_last_activity()";
    } else {
      // Fallback (RPC missing / errored): heartbeat table, then last_sign_in_at.
      notes.activity_source = "fallback";
      if (rpcErr) notes.rpc_error = rpcErr.message;
      const { data: heartbeat } = await admin
        .from("admin_heartbeats")
        .select("last_seen_at")
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (heartbeat?.last_seen_at) mostRecent = new Date(heartbeat.last_seen_at).getTime();
      const { data: admins } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      for (const r of admins ?? []) {
        const { data: u } = await admin.auth.admin.getUserById(r.user_id);
        const t = u?.user?.last_sign_in_at ? new Date(u.user.last_sign_in_at).getTime() : 0;
        if (t > mostRecent) mostRecent = t;
      }
    }
    notes.most_recent_admin_activity = mostRecent ? new Date(mostRecent).toISOString() : null;
    const ageMs = Date.now() - mostRecent;
    // 2026-08-21 audit, item 4: "no activity data at all" must NOT read as
    // "assume alive" — for a dead-man switch that inverts the failure mode.
    // A broken RPC + empty heartbeat table + no admin sign-in data now sends
    // its own alert instead of silently disarming the switch.
    const dataMissing = !mostRecent;
    if (dataMissing) notes.alert_reason = "activity_data_missing";
    if (dataMissing || ageMs > days * 86400 * 1000) {
      try {
        // Sender MUST be on the Resend-verified domain (invites.xcrol.com);
        // trustee@xcrol.com was never verified, so sends silently 403'd.
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Xcrol Trustee <noreply@invites.xcrol.com>",
            to: [trustee],
            subject: dataMissing
              ? "Xcrol heartbeat: activity signal MISSING — check the system"
              : "Xcrol heartbeat overdue — revival packet attached",
            text: [
              dataMissing
                ? "Xcrol's heartbeat check could not find ANY admin activity signal (RPC, heartbeat table, and sign-in data all empty or erroring). The dead-man switch cannot tell if the admin is active — someone should check the system."
                : `No admin activity has been recorded on Xcrol for over ${days} days.`,
              "",
              "Backups: see your Backblaze B2 bucket (xcrol-backups).",
              "Revival instructions: docs/RUNBOOK.md in the GitHub mirror.",
              "",
              "If this is a false alarm: sign in to xcrol.com and post or open the admin dashboard — any admin activity resets the switch.",
            ].join("\n"),
          }),
        });
        if (!res.ok) {
          notes.alert_error = `resend ${res.status}: ${(await res.text()).slice(0, 300)}`;
        } else {
          alerted = true;
        }
      } catch (e) {
        notes.alert_error = e instanceof Error ? e.message : String(e);
      }
    }
  }

  await admin
    .from("backup_runs")
    .update({
      status: "success",
      finished_at: new Date().toISOString(),
      notes: { ...notes, alerted },
    })
    .eq("id", runRow!.id);

  return new Response(JSON.stringify({ ok: true, enabled, alerted, notes }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
