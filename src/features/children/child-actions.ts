import {
  canAddChild,
  resolveHouseholdEntitlement,
} from "@/features/entitlements/entitlements";
import type { SettlementFrequency } from "@/features/household/household-actions";

type ChildClient = {
  from(table: string): any;
};

export type CreateChildInput = {
  displayName: string;
  /** Optional onboarding profile bits. Omitted fields keep the table defaults. */
  age?: number | null;
  tone?: string;
  budgetCents?: number;
  cadence?: SettlementFrequency;
};

export type CreatedChild = {
  id: string;
  displayName: string;
  householdId: string;
};

export function createChildActions(client: ChildClient, householdId: string) {
  return {
    async createChild(input: CreateChildInput): Promise<CreatedChild> {
      const displayName = input.displayName.trim();

      if (!displayName) {
        throw new Error("Child name is required.");
      }

      const existingChildren = await client
        .from("child_profiles")
        .select("id")
        .eq("household_id", householdId);

      if (existingChildren.error) {
        throw existingChildren.error;
      }

      const entitlement = await client
        .from("household_entitlements")
        .select("status")
        .eq("household_id", householdId)
        .maybeSingle();

      if (entitlement.error) {
        throw entitlement.error;
      }

      const access = resolveHouseholdEntitlement(entitlement.data);

      if (
        !canAddChild({
          access,
          currentChildCount: (existingChildren.data ?? []).length,
        })
      ) {
        throw new Error("Upgrade required to add another child.");
      }

      const payload: Record<string, unknown> = {
        household_id: householdId,
        display_name: displayName,
      };

      // Include onboarding profile bits only when supplied, so simpler callers
      // (and their tests) keep writing just the household + name.
      if (input.age != null) {
        payload.age = input.age;
      }
      if (input.tone) {
        payload.tone = input.tone;
      }
      if (input.budgetCents != null) {
        payload.budget_cents = input.budgetCents;
      }
      if (input.cadence) {
        payload.cadence = input.cadence;
      }

      const result = await client
        .from("child_profiles")
        .insert(payload)
        .select("id, display_name, household_id")
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Child profile was not created.");
      }

      return {
        id: result.data.id,
        displayName: result.data.display_name,
        householdId: result.data.household_id,
      };
    },

    /** Update a kid's budget cap and/or cadence (parent-admin RLS). */
    async updateChildSettings(input: {
      childProfileId: string;
      budgetCents?: number;
      cadence?: SettlementFrequency;
    }): Promise<void> {
      const payload: Record<string, unknown> = {};
      if (input.budgetCents != null) {
        payload.budget_cents = input.budgetCents;
      }
      if (input.cadence) {
        payload.cadence = input.cadence;
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      const result = await client
        .from("child_profiles")
        .update(payload)
        .eq("id", input.childProfileId)
        .eq("household_id", householdId);

      if (result.error) {
        throw result.error;
      }
    },
  };
}
