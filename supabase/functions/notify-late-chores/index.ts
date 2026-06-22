// Scheduled notifier: pings a child (via Expo push) about chores tied to their
// "due by" time. Two passes:
//   • due-soon — a gentle nudge within the hour before the deadline
//     (stamped `reminder_notified_at`)
//   • late     — once the deadline has passed and it's still not done
//     (stamped `late_notified_at`)
// Delivery is at-least-once: the push is sent before the stamp, so a failed
// stamp or an overlapping cron run could re-ping. We accept a rare duplicate
// over a missed reminder; each pass stamps its own column to avoid steady spam.
//
// Deploy:   supabase functions deploy notify-late-chores --no-verify-jwt
// Schedule: call it on a cron (e.g. every 15 min) via pg_cron + pg_net, or
//           Supabase scheduled functions. See README.md in this folder.

import { createClient } from "jsr:@supabase/supabase-js@2";

type ChoreRow = {
  chore_id: string;
  child_profile_id: string;
  title: string;
  token: string;
};

type ExpoMessage = {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data: { choreId: string; type: "late_chore" | "due_soon_chore" };
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase env." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Pass 1: gentle pre-deadline reminders.
  const dueSoon = await runPass(supabase, {
    rpc: "get_due_soon_chores_to_notify",
    stampColumn: "reminder_notified_at",
    type: "due_soon_chore",
    title: "A chore is due soon",
    body: (t) => `${t} is due soon — finish it to keep your streak going.`,
  });
  if (dueSoon.error) {
    return json({ error: dueSoon.error }, 500);
  }

  // Pass 2: overdue pings.
  const late = await runPass(supabase, {
    rpc: "get_late_chores_to_notify",
    stampColumn: "late_notified_at",
    type: "late_chore",
    title: "A chore is late",
    body: (t) => `${t} is overdue — do it now to keep your streak going.`,
  });
  if (late.error) {
    return json({ error: late.error }, 500);
  }

  return json({ dueSoon: dueSoon.notified, late: late.notified });
});

/** Run one notification pass: fetch rows, push, stamp. Returns count or error. */
async function runPass(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  config: {
    rpc: string;
    stampColumn: "late_notified_at" | "reminder_notified_at";
    type: ExpoMessage["data"]["type"];
    title: string;
    body: (title: string) => string;
  },
): Promise<{ notified: number; error?: string }> {
  const { data, error } = await supabase.rpc(config.rpc);
  if (error) {
    return { notified: 0, error: error.message };
  }

  const rows = (data ?? []) as ChoreRow[];
  if (rows.length === 0) {
    return { notified: 0 };
  }

  // One push per device token; one body per chore (a chore may have several).
  const messages: ExpoMessage[] = rows.map((row) => ({
    to: row.token,
    sound: "default",
    title: config.title,
    body: config.body(row.title),
    data: { choreId: row.chore_id, type: config.type },
  }));

  await sendExpoPush(messages);

  const choreIds = [...new Set(rows.map((row) => row.chore_id))];
  const { error: stampError } = await supabase
    .from("chore_instances")
    .update({ [config.stampColumn]: new Date().toISOString() })
    .in("id", choreIds);

  if (stampError) {
    return { notified: 0, error: stampError.message };
  }

  return { notified: choreIds.length };
}

/** Expo accepts up to 100 messages per request; chunk to be safe. */
async function sendExpoPush(messages: ExpoMessage[]): Promise<void> {
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk),
    });
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
