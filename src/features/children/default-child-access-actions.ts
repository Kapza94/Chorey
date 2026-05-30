import {
  createChildAccessActions,
  type ChildAccessCode,
  type ResolvedChildAccess,
} from "@/features/children/child-access-actions";
import { supabase } from "@/lib/supabase";

export async function createAccessCodeForChild(input: {
  childProfileId: string;
  householdId: string;
}): Promise<ChildAccessCode> {
  return createChildAccessActions(supabase).createAccessCode(input);
}

export async function resolveChildAccessCode(
  code: string,
): Promise<ResolvedChildAccess> {
  return createChildAccessActions(supabase).resolveAccessCode(code);
}
