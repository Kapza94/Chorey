export type SavingsGoal = {
  id: string;
  name: string;
  targetCents: number;
};

type SavingsGoalClient = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

/**
 * One savings goal per kid: a name and a target the Savings bucket fills
 * toward. Recognition only — no unlocks, no money movement.
 */
export function createSavingsGoalActions(client: SavingsGoalClient) {
  return {
    async getGoalForChild(accessCode: string): Promise<SavingsGoal | null> {
      const result = await client.rpc("get_child_savings_goal", {
        input_access_code: accessCode,
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;

      if (!row) {
        return null;
      }

      return { id: row.id, name: row.name, targetCents: row.target_cents };
    },

    async setGoalForChild(input: {
      accessCode: string;
      name: string;
      targetCents: number;
    }): Promise<SavingsGoal> {
      const name = input.name.trim();

      if (!name) {
        throw new Error("Goal name is required.");
      }

      if (!Number.isInteger(input.targetCents) || input.targetCents <= 0) {
        throw new Error("Goal target must be more than zero.");
      }

      const result = await client.rpc("set_child_savings_goal", {
        input_access_code: input.accessCode,
        input_name: name,
        input_target_cents: input.targetCents,
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;

      if (!row) {
        throw new Error("Savings goal was not saved.");
      }

      return { id: row.id, name: row.name, targetCents: row.target_cents };
    },
  };
}
