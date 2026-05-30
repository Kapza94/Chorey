import type { BucketBalances } from "@/features/chores/money";

type LedgerEventRow = {
  amount_cents: number;
  bucket: "spend" | "savings" | "giving";
};

type HouseholdLedgerClient = {
  from(table: string): any;
};

type ChildLedgerClient = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

const emptyBalances: BucketBalances = {
  givingCents: 0,
  savingsCents: 0,
  spendCents: 0,
};

function mapBalanceRow(row: any): BucketBalances {
  return {
    givingCents: row?.giving_cents ?? 0,
    savingsCents: row?.savings_cents ?? 0,
    spendCents: row?.spend_cents ?? 0,
  };
}

export function createLedgerActions(
  client: HouseholdLedgerClient,
  householdId: string,
) {
  return {
    async getBucketBalances(): Promise<BucketBalances> {
      const result = await client
        .from("ledger_events")
        .select("bucket, amount_cents")
        .eq("household_id", householdId);

      if (result.error) {
        throw result.error;
      }

      const rows = (result.data ?? []) as LedgerEventRow[];

      return rows.reduce(
        (balances: BucketBalances, row: LedgerEventRow) => {
          if (row.bucket === "spend") {
            return {
              ...balances,
              spendCents: balances.spendCents + row.amount_cents,
            };
          }

          if (row.bucket === "savings") {
            return {
              ...balances,
              savingsCents: balances.savingsCents + row.amount_cents,
            };
          }

          return {
            ...balances,
            givingCents: balances.givingCents + row.amount_cents,
          };
        },
        { ...emptyBalances },
      );
    },
  };
}

export function createChildLedgerActions(client: ChildLedgerClient) {
  return {
    async getBucketBalances(accessCode: string): Promise<BucketBalances> {
      const result = await client.rpc("get_child_bucket_balances", {
        input_access_code: accessCode,
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;

      return mapBalanceRow(row);
    },
  };
}
