import { createChoreActions, type CreatedChore } from "@/features/chores/chore-actions";
import { supabase } from "@/lib/supabase";

export async function createChoreForHousehold(input: {
  householdId: string;
  childProfileId: string;
  title: string;
  rewardCents: number;
}): Promise<CreatedChore> {
  return createChoreActions(supabase, input.householdId).createChore({
    childProfileId: input.childProfileId,
    title: input.title,
    rewardCents: input.rewardCents,
  });
}

export async function listChoresForHousehold(
  householdId: string,
): Promise<CreatedChore[]> {
  return createChoreActions(supabase, householdId).listChores();
}

export async function approveChoreForHousehold(input: {
  householdId: string;
  choreId: string;
}): Promise<CreatedChore> {
  return createChoreActions(supabase, input.householdId).approveChore(
    input.choreId,
  );
}

export async function sendBackChoreForHousehold(input: {
  householdId: string;
  choreId: string;
  reason: string;
}): Promise<CreatedChore> {
  return createChoreActions(supabase, input.householdId).sendBackChore({
    choreId: input.choreId,
    reason: input.reason,
  });
}
