import type { ParentKid } from "@/features/parent-app/parent-primitives";

type RpcClient = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

/** Narrow the stored tone (allowance|savings|giving|sky|…) to a kid swatch. */
function mapTone(tone: string | null | undefined): ParentKid["tone"] {
  return tone === "savings" || tone === "giving" ? tone : "allowance";
}

/** Postgres bigints arrive as numbers or strings; coerce safely to a number. */
function num(value: unknown): number {
  return Number(value ?? 0);
}

function mapKid(row: any): ParentKid {
  return {
    id: row.child_profile_id,
    name: row.display_name,
    age: row.age ?? null,
    tone: mapTone(row.tone),
    earnedCents: num(row.earned_cents),
    allowanceCents: num(row.spend_cents),
    savingsCents: num(row.savings_cents),
    givingCents: num(row.giving_cents),
    choresDone: num(row.chores_done),
    choresTotal: num(row.chores_total),
    pendingApprovals: num(row.pending_approvals),
    cadence: row.cadence,
    budgetCents: num(row.budget_cents),
    assignedCents: num(row.assigned_cents),
  };
}

export function createParentKidsActions(client: RpcClient) {
  return {
    async listHouseholdKids(householdId: string): Promise<ParentKid[]> {
      const result = await client.rpc("list_household_kids", {
        input_household_id: householdId,
      });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map(mapKid);
    },
  };
}
