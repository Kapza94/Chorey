import {
  canAddChild,
  resolveHouseholdEntitlement,
} from "@/features/entitlements/entitlements";

type ChildClient = {
  from(table: string): any;
};

export type CreateChildInput = {
  displayName: string;
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

      const result = await client
        .from("child_profiles")
        .insert({
          household_id: householdId,
          display_name: displayName,
        })
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
  };
}
