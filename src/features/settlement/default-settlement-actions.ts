import {
  createSettlementActions,
  SettlementPeriod,
} from "@/features/settlement/settlement-actions";
import { supabase } from "@/lib/supabase";

export async function getActiveSettlementPeriod(
  householdId: string,
): Promise<SettlementPeriod> {
  return createSettlementActions(supabase, householdId).getActivePeriod();
}

export async function settleAllSettlementBuckets(input: {
  householdId: string;
  periodId: string;
}): Promise<void> {
  return createSettlementActions(supabase, input.householdId).settleAllBuckets(
    input.periodId,
  );
}
