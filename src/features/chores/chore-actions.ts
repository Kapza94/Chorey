export type ChoreStatus = "assigned" | "submitted" | "approved" | "sent_back";

type ChoreClient = {
  from(table: string): any;
};

export type CreateChoreInput = {
  childProfileId: string;
  title: string;
  rewardCents: number;
};

export type CreatedChore = {
  id: string;
  householdId: string;
  childProfileId: string;
  title: string;
  rewardCents: number;
  status: ChoreStatus;
};

function mapChore(row: any): CreatedChore {
  return {
    id: row.id,
    householdId: row.household_id,
    childProfileId: row.child_profile_id,
    title: row.title,
    rewardCents: row.reward_cents,
    status: row.status,
  };
}

export function createChoreActions(client: ChoreClient, householdId: string) {
  return {
    async listChores(): Promise<CreatedChore[]> {
      const result = await client
        .from("chore_instances")
        .select("id, household_id, child_profile_id, title, reward_cents, status")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map(mapChore);
    },

    async approveChore(choreId: string): Promise<CreatedChore> {
      const result = await client
        .from("chore_instances")
        .update({ status: "approved" })
        .eq("id", choreId)
        .eq("status", "submitted")
        .select("id, household_id, child_profile_id, title, reward_cents, status")
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Chore was not approved.");
      }

      return mapChore(result.data);
    },

    async createChore(input: CreateChoreInput): Promise<CreatedChore> {
      const title = input.title.trim();

      if (!title) {
        throw new Error("Chore title is required.");
      }

      if (!Number.isInteger(input.rewardCents) || input.rewardCents < 0) {
        throw new Error("Reward must be zero or more.");
      }

      const result = await client
        .from("chore_instances")
        .insert({
          household_id: householdId,
          child_profile_id: input.childProfileId,
          title,
          reward_cents: input.rewardCents,
          status: "assigned",
        })
        .select("id, household_id, child_profile_id, title, reward_cents, status")
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Chore was not created.");
      }

      return mapChore(result.data);
    },
  };
}
