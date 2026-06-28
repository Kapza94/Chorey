import {
  createChoreTemplateActions,
  type CreatedChoreTemplate,
} from "@/features/chores/chore-template-actions";
import { repriceRecurringChores } from "@/features/chores/reprice-actions";
import type { Recurrence } from "@/features/chores/recurrence";
import type { DueTime } from "@/features/chores/due-time";
import { supabase } from "@/lib/supabase";

export async function createChoreTemplateForHousehold(input: {
  householdId: string;
  childProfileId: string;
  title: string;
  rewardCents: number;
  recurrence: Recurrence;
  dueTime?: DueTime;
}): Promise<CreatedChoreTemplate> {
  return createChoreTemplateActions(supabase, input.householdId).createTemplate({
    childProfileId: input.childProfileId,
    title: input.title,
    rewardCents: input.rewardCents,
    recurrence: input.recurrence,
    dueTime: input.dueTime ?? null,
  });
}

export async function ensureRecurringInstancesForHousehold(
  householdId: string,
): Promise<number> {
  return createChoreTemplateActions(supabase, householdId).ensureInstances();
}

/**
 * Budget-first: re-share a kid's allowance across their recurring chores. Call
 * after adding or removing a recurring chore so per-completion rewards stay in
 * sync with the current set. Returns the new per-completion cents.
 */
export async function repriceRecurringChoresForHousehold(input: {
  householdId: string;
  childProfileId: string;
}): Promise<number> {
  return repriceRecurringChores(
    supabase,
    input.householdId,
    input.childProfileId,
  );
}
