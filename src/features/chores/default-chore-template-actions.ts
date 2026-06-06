import {
  createChoreTemplateActions,
  type CreatedChoreTemplate,
} from "@/features/chores/chore-template-actions";
import type { Recurrence } from "@/features/chores/recurrence";
import { supabase } from "@/lib/supabase";

export async function createChoreTemplateForHousehold(input: {
  householdId: string;
  childProfileId: string;
  title: string;
  rewardCents: number;
  recurrence: Recurrence;
}): Promise<CreatedChoreTemplate> {
  return createChoreTemplateActions(supabase, input.householdId).createTemplate({
    childProfileId: input.childProfileId,
    title: input.title,
    rewardCents: input.rewardCents,
    recurrence: input.recurrence,
  });
}

export async function ensureRecurringInstancesForHousehold(
  householdId: string,
): Promise<number> {
  return createChoreTemplateActions(supabase, householdId).ensureInstances();
}
