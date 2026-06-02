import {
  createPaymentActions,
  type Payout,
  type RecordPayoutInput,
} from "@/features/payments/payment-actions";
import { supabase } from "@/lib/supabase";

export async function recordPayoutForHousehold(
  householdId: string,
  input: RecordPayoutInput,
): Promise<Payout> {
  return createPaymentActions(supabase, householdId).recordPayout(input);
}

export async function listPayoutsForHousehold(
  householdId: string,
): Promise<Payout[]> {
  return createPaymentActions(supabase, householdId).listPayouts();
}
