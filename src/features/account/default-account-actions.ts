import { createAccountActions } from "@/features/account/account";
import { supabase } from "@/lib/supabase";

/**
 * Permanently delete the signed-in parent's account (household + all data) via
 * the delete_my_account RPC. The caller is responsible for signing out and
 * navigating away afterwards, since the session is now invalid.
 */
export async function deleteParentAccount(): Promise<void> {
  await createAccountActions(supabase).deleteAccount();
}
