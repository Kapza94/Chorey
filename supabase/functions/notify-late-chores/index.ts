// Scheduled notifier: pings a child (via Expo push) when a recurring chore has
// gone late and they still haven't done it. Idempotent — each overdue instance
// is stamped `late_notified_at` so it's never pinged twice.
//
// Deploy:   supabase functions deploy notify-late-chores --no-verify-jwt
// Schedule: call it on a cron (e.g. hourly) via pg_cron + pg_net, or Supabase
//           scheduled functions. See README.md in this folder.

import { createClient } from "jsr:@supabase/supabase-js@2";

type LateChore = {
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
  data: { choreId: string; type: "late_chore" };
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase env." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.rpc("get_late_chores_to_notify");
  if (error) {
    return json({ error: error.message }, 500);
  }

  const rows = (data ?? []) as LateChore[];
  if (rows.length === 0) {
    return json({ notified: 0 });
  }

  // One push per device token; one body per chore (a chore may have several).
  const messages: ExpoMessage[] = rows.map((row) => ({
    to: row.token,
    sound: "default",
    title: "A chore is late",
    body: `${row.title} is overdue — do it now to keep your streak going.`,
    data: { choreId: row.chore_id, type: "late_chore" },
  }));

  await sendExpoPush(messages);

  // Stamp every notified instance so it won't fire again.
  const choreIds = [...new Set(rows.map((row) => row.chore_id))];
  const { error: stampError } = await supabase
    .from("chore_instances")
    .update({ late_notified_at: new Date().toISOString() })
    .in("id", choreIds);

  if (stampError) {
    return json({ error: stampError.message }, 500);
  }

  return json({ notified: choreIds.length, messages: messages.length });
});

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
