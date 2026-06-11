import {
  canUseRecurringChores,
  resolveHouseholdEntitlement,
} from "@/features/entitlements/entitlements";
import type { Recurrence } from "@/features/chores/recurrence";

type TemplateClient = {
  from(table: string): any;
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

export type CreateChoreTemplateInput = {
  childProfileId: string;
  title: string;
  rewardCents: number;
  recurrence: Recurrence;
};

export type CreatedChoreTemplate = {
  id: string;
  householdId: string;
  childProfileId: string;
  title: string;
  rewardCents: number;
  recurrence: Recurrence;
  active: boolean;
};

function mapTemplate(row: any): CreatedChoreTemplate {
  return {
    id: row.id,
    householdId: row.household_id,
    childProfileId: row.child_profile_id,
    title: row.title,
    rewardCents: row.reward_cents,
    recurrence: row.recurrence,
    active: row.active,
  };
}

const TEMPLATE_COLUMNS =
  "id, household_id, child_profile_id, title, reward_cents, recurrence, active";

export function createChoreTemplateActions(
  client: TemplateClient,
  householdId: string,
) {
  return {
    /** Create a recurring chore template (paused while a household is lapsed). */
    async createTemplate(
      input: CreateChoreTemplateInput,
    ): Promise<CreatedChoreTemplate> {
      const title = input.title.trim();

      if (!title) {
        throw new Error("Chore title is required.");
      }

      if (!Number.isInteger(input.rewardCents) || input.rewardCents < 0) {
        throw new Error("Reward must be zero or more.");
      }

      const entitlement = await client
        .from("household_entitlements")
        .select("status")
        .eq("household_id", householdId)
        .maybeSingle();

      if (entitlement.error) {
        throw entitlement.error;
      }

      if (!canUseRecurringChores(resolveHouseholdEntitlement(entitlement.data))) {
        throw new Error(
          "Chorey is paused. Resume your subscription to use recurring chores.",
        );
      }

      const result = await client
        .from("chore_templates")
        .insert({
          household_id: householdId,
          child_profile_id: input.childProfileId,
          title,
          reward_cents: input.rewardCents,
          recurrence: input.recurrence,
        })
        .select(TEMPLATE_COLUMNS)
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Chore template was not created.");
      }

      return mapTemplate(result.data);
    },

    /** Materialize the current period's instances; returns how many were created. */
    async ensureInstances(): Promise<number> {
      const result = await client.rpc("ensure_recurring_chore_instances", {
        input_household_id: householdId,
      });

      if (result.error) {
        throw result.error;
      }

      return Number(result.data ?? 0);
    },
  };
}
