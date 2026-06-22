import { createChoreActions, type CreatedChore } from "@/features/chores/chore-actions";
import { supabase } from "@/lib/supabase";

export async function createChoreForHousehold(input: {
  householdId: string;
  childProfileId: string;
  title: string;
  rewardCents: number;
  dueAt?: string | null;
}): Promise<CreatedChore> {
  return createChoreActions(supabase, input.householdId).createChore({
    childProfileId: input.childProfileId,
    title: input.title,
    rewardCents: input.rewardCents,
    dueAt: input.dueAt ?? null,
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

export async function deleteChoreForHousehold(input: {
  householdId: string;
  choreId: string;
}): Promise<void> {
  return createChoreActions(supabase, input.householdId).deleteChore(
    input.choreId,
  );
}

/**
 * Short-lived signed URLs for chore-completion photos, keyed by storage path.
 * The bucket is private; the household read policy lets a signed-in parent mint
 * these for their own household's photos. Paths that fail to sign are omitted.
 */
export async function signChorePhotoUrls(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) {
    return {};
  }

  const { data, error } = await supabase.storage
    .from("chore-photos")
    .createSignedUrls(paths, 60 * 60);

  if (error || !data) {
    return {};
  }

  const urls: Record<string, string> = {};
  for (const item of data) {
    if (item.signedUrl && item.path) {
      urls[item.path] = item.signedUrl;
    }
  }
  return urls;
}
