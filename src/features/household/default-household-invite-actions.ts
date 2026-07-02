import {
  createHouseholdInviteActions,
  type AcceptedHouseholdInvite,
  type HouseholdInvite,
  type HouseholdParent,
} from "@/features/household/household-invite-actions";
import { supabase } from "@/lib/supabase";

export async function createParentInvite(input: {
  householdId: string;
}): Promise<HouseholdInvite> {
  return createHouseholdInviteActions(supabase).createInvite(input);
}

export async function listParentInvites(
  householdId: string,
): Promise<HouseholdInvite[]> {
  return createHouseholdInviteActions(supabase).listInvites(householdId);
}

export async function listHouseholdParents(
  householdId: string,
): Promise<HouseholdParent[]> {
  return createHouseholdInviteActions(supabase).listParents(householdId);
}

export async function cancelParentInvite(input: {
  householdId: string;
  inviteId: string;
}): Promise<void> {
  return createHouseholdInviteActions(supabase).cancelInvite(input);
}

export async function acceptParentInvite(
  token: string,
): Promise<AcceptedHouseholdInvite> {
  return createHouseholdInviteActions(supabase).acceptInvite(token);
}
