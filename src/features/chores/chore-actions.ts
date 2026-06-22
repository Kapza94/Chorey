import type { Recurrence } from "@/features/chores/recurrence";

export type ChoreStatus = "assigned" | "submitted" | "approved" | "sent_back";

type ChoreClient = {
  from(table: string): any;
};

export type CreateChoreInput = {
  childProfileId: string;
  title: string;
  rewardCents: number;
  /** ISO instant this one-off chore is due, or null for anytime. */
  dueAt?: string | null;
};

export type CreatedChore = {
  id: string;
  householdId: string;
  childProfileId: string;
  title: string;
  rewardCents: number;
  status: ChoreStatus;
  /** present when the chore was sent back, so the parent/child can see why. */
  sentBackReason?: string | null;
  /** the recurrence of the template this instance was generated from, if any. */
  recurrence?: Recurrence | null;
  /** the period this recurring instance belongs to (YYYY-MM-DD), if any. */
  periodKey?: string | null;
  /** storage path of the kid's completion photo, if they attached one. */
  photoPath?: string | null;
  /** ISO instant this chore is due (one-off or recurring), if any. */
  dueAt?: string | null;
};

const CHORE_COLUMNS =
  "id, household_id, child_profile_id, title, reward_cents, status, sent_back_reason, period_key, photo_path, due_at, chore_templates(recurrence)";

function mapChore(row: any): CreatedChore {
  // The joined template (if any) carries the recurrence; one-off chores have none.
  const template = Array.isArray(row.chore_templates)
    ? row.chore_templates[0]
    : row.chore_templates;

  return {
    id: row.id,
    householdId: row.household_id,
    childProfileId: row.child_profile_id,
    title: row.title,
    rewardCents: row.reward_cents,
    status: row.status,
    sentBackReason: row.sent_back_reason ?? null,
    recurrence: template?.recurrence ?? null,
    periodKey: row.period_key ?? null,
    photoPath: row.photo_path ?? null,
    dueAt: row.due_at ?? null,
  };
}

export function createChoreActions(client: ChoreClient, householdId: string) {
  return {
    async listChores(): Promise<CreatedChore[]> {
      const result = await client
        .from("chore_instances")
        .select(CHORE_COLUMNS)
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
        .select(CHORE_COLUMNS)
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Chore was not approved.");
      }

      return mapChore(result.data);
    },

    async sendBackChore(input: {
      choreId: string;
      reason: string;
    }): Promise<CreatedChore> {
      const reason = input.reason.trim();

      if (!reason) {
        throw new Error("A reason is required to send a chore back.");
      }

      const result = await client
        .from("chore_instances")
        .update({ status: "sent_back", sent_back_reason: reason })
        .eq("id", input.choreId)
        .eq("status", "submitted")
        .select(CHORE_COLUMNS)
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Chore was not sent back.");
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
          due_at: input.dueAt ?? null,
        })
        .select(CHORE_COLUMNS)
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Chore was not created.");
      }

      return mapChore(result.data);
    },

    // Remove a chore that hasn't been approved yet. Approved chores own ledger
    // events (the 40/40/20 split already paid out), so the status guard keeps a
    // delete from ever silently clawing money back out of a kid's buckets.
    async deleteChore(choreId: string): Promise<void> {
      const result = await client
        .from("chore_instances")
        .delete()
        .eq("id", choreId)
        .neq("status", "approved");

      if (result.error) {
        throw result.error;
      }
    },
  };
}
