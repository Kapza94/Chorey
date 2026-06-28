import { rewardPerOccurrenceCents } from "@/features/chores/budget-allocation";
import type { Recurrence } from "@/features/chores/recurrence";
import type { SettlementFrequency } from "@/features/household/household-actions";

type RepriceClient = {
  from(table: string): any;
};

/**
 * Budget-first re-pricing for one kid's RECURRING chores. After a recurring
 * chore is added or removed, the kid's per-period allowance is re-shared across
 * their (now changed) set of recurring chores, so "do everything = earn the
 * whole allowance" keeps holding without the parent typing any amount.
 *
 * Touches only what's safe to reprice: active templates and their not-yet-paid
 * current instances (`assigned`/`sent_back`). One-off chores (`template_id`
 * null) keep their manual amount, and `submitted`/`approved` work is left alone
 * so we never change a reward the kid already earned or is mid-submitting.
 *
 * Returns the new per-completion cents (0 when there's no budget or no chores).
 */
export async function repriceRecurringChores(
  client: RepriceClient,
  householdId: string,
  childProfileId: string,
): Promise<number> {
  const child = await client
    .from("child_profiles")
    .select("budget_cents, cadence")
    .eq("id", childProfileId)
    .eq("household_id", householdId)
    .single();
  if (child.error) {
    throw child.error;
  }

  const templates = await client
    .from("chore_templates")
    .select("recurrence")
    .eq("household_id", householdId)
    .eq("child_profile_id", childProfileId)
    .eq("active", true);
  if (templates.error) {
    throw templates.error;
  }

  const perOccurrence = rewardPerOccurrenceCents(
    child.data?.budget_cents ?? 0,
    (child.data?.cadence ?? "weekly") as SettlementFrequency,
    ((templates.data ?? []) as { recurrence: Recurrence }[]).map((row) => ({
      recurrence: row.recurrence,
    })),
  );

  const updatedTemplates = await client
    .from("chore_templates")
    .update({ reward_cents: perOccurrence })
    .eq("household_id", householdId)
    .eq("child_profile_id", childProfileId)
    .eq("active", true);
  if (updatedTemplates.error) {
    throw updatedTemplates.error;
  }

  const updatedInstances = await client
    .from("chore_instances")
    .update({ reward_cents: perOccurrence })
    .eq("household_id", householdId)
    .eq("child_profile_id", childProfileId)
    .not("template_id", "is", null)
    .in("status", ["assigned", "sent_back"]);
  if (updatedInstances.error) {
    throw updatedInstances.error;
  }

  return perOccurrence;
}
