import type { SettlementFrequency } from "@/features/household/household-actions";

export type SettlementBucket = "spend" | "savings" | "giving";
export type SettlementBucketStatus = "pending" | "settled";

export type SettlementPeriod = {
  bucketStatuses: Record<SettlementBucket, SettlementBucketStatus>;
  endsOn: string;
  frequency: SettlementFrequency;
  id: string;
  startsOn: string;
};

type SettlementClient = {
  from(table: string): any;
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: any; error: Error | null }>;
};

function mapPeriod(row: any): SettlementPeriod {
  return {
    bucketStatuses: {
      giving: row.giving_status,
      savings: row.savings_status,
      spend: row.spend_status,
    },
    endsOn: row.ends_on,
    frequency: row.frequency,
    id: row.id,
    startsOn: row.starts_on,
  };
}

export function createSettlementActions(
  client: SettlementClient,
  householdId: string,
) {
  return {
    async getActivePeriod(): Promise<SettlementPeriod> {
      const result = await client.rpc("ensure_active_settlement_period", {
        input_household_id: householdId,
      });

      if (result.error) {
        throw result.error;
      }

      return mapPeriod(Array.isArray(result.data) ? result.data[0] : result.data);
    },

    async settleAllBuckets(periodId: string) {
      const result = await client
        .from("settlement_bucket_statuses")
        .update({ status: "settled" })
        .eq("settlement_period_id", periodId);

      if (result.error) {
        throw result.error;
      }
    },
  };
}
