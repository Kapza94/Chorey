import type { ChoreStatus } from "@/features/chores/chore-actions";

type RpcClient = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

export type ChildChore = {
  id: string;
  title: string;
  rewardCents: number;
  status: ChoreStatus;
  /** why a parent sent it back (when status is sent_back); null otherwise. */
  sentBackReason: string | null;
};

function mapChore(row: any): ChildChore {
  return {
    id: row.id,
    title: row.title,
    rewardCents: row.reward_cents,
    status: row.status,
    sentBackReason: row.sent_back_reason ?? null,
  };
}

export function createChildChoreActions(client: RpcClient) {
  return {
    async listChores(accessCode: string): Promise<ChildChore[]> {
      const result = await client.rpc("list_child_chores", {
        input_access_code: accessCode,
      });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map(mapChore);
    },

    async submitChore(input: {
      accessCode: string;
      choreId: string;
    }): Promise<ChildChore> {
      const result = await client.rpc("submit_child_chore", {
        input_access_code: input.accessCode,
        input_chore_id: input.choreId,
      });

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Chore was not submitted.");
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;

      if (!row) {
        throw new Error("Chore was not submitted.");
      }

      return mapChore(row);
    },
  };
}
