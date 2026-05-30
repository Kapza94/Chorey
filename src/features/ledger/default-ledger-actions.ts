import type { BucketBalances } from "@/features/chores/money";
import {
  createChildLedgerActions,
  createLedgerActions,
} from "@/features/ledger/ledger-actions";
import { supabase } from "@/lib/supabase";

export async function getBucketBalancesForHousehold(
  householdId: string,
): Promise<BucketBalances> {
  return createLedgerActions(supabase, householdId).getBucketBalances();
}

export async function getBucketBalancesForChild(
  accessCode: string,
): Promise<BucketBalances> {
  return createChildLedgerActions(supabase).getBucketBalances(accessCode);
}
