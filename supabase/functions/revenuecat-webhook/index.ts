// RevenueCat -> Supabase webhook. RevenueCat is the source of truth for billing;
// this keeps `household_entitlements` in sync server-side so a household's access
// never depends on the client reporting back. We set RevenueCat's appUserID to
// the household id (see configureRevenueCat in the app), so event.app_user_id IS
// the household id.
//
// Deploy:   supabase functions deploy revenuecat-webhook --no-verify-jwt
// Secret:   supabase secrets set REVENUECAT_WEBHOOK_AUTH=<the value you also set
//           as the Authorization header in the RevenueCat webhook settings>
// See README.md in this folder for the full setup.

import { createClient } from "jsr:@supabase/supabase-js@2";

type RcEvent = {
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  period_type?: string; // "NORMAL" | "TRIAL" | "INTRO"
  expiration_at_ms?: number | null;
};

// Events that grant or extend access.
const ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "SUBSCRIPTION_EXTENDED",
]);

// Events that end access. (CANCELLATION only turns off auto-renew — the user
// keeps access until EXPIRATION, so it does NOT lapse the household.)
const LAPSED_EVENTS = new Set(["EXPIRATION", "SUBSCRIPTION_PAUSED"]);

/** Best-effort plan from the store product id; null when undeterminable. */
function planFromProductId(
  productId: string | undefined,
): "monthly" | "annual" | null {
  if (!productId) return null;
  const id = productId.toLowerCase();
  if (id.includes("year") || id.includes("annual")) return "annual";
  if (id.includes("month")) return "monthly";
  return null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!expectedAuth || !supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing server env." }, 500);
  }

  // RevenueCat sends the Authorization header you configure in its dashboard.
  if (req.headers.get("Authorization") !== expectedAuth) {
    return json({ error: "Unauthorized." }, 401);
  }

  let payload: { event?: RcEvent };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const event = payload.event;
  const householdId = event?.app_user_id ?? event?.original_app_user_id;
  if (!event || !householdId) {
    return json({ error: "No app_user_id on event." }, 400);
  }

  // Decide the new status. Unknown/no-op event types are acknowledged but skip.
  let status: "active" | "trialing" | "lapsed" | null = null;
  if (ACTIVE_EVENTS.has(event.type)) {
    status = event.period_type === "TRIAL" ? "trialing" : "active";
  } else if (LAPSED_EVENTS.has(event.type)) {
    status = "lapsed";
  }

  if (status === null) {
    return json({ ignored: event.type });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const update: Record<string, unknown> = {
    status,
    revenuecat_customer_id: householdId,
    current_period_ends_at: event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };
  const plan = planFromProductId(event.product_id);
  if (plan) {
    update.plan = plan;
  }

  const { error } = await supabase
    .from("household_entitlements")
    .update(update)
    .eq("household_id", householdId);

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ ok: true, householdId, status });
});
