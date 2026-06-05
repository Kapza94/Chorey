type PaymentClient = {
  from(table: string): any;
};

export type PayoutMethod = "cash" | "bank_transfer" | "other";

export type Payout = {
  id: string;
  childProfileId: string;
  childName: string;
  amountCents: number;
  method: PayoutMethod;
  /** for `other` payouts: what the kid was given (e.g. "Gift"); null otherwise. */
  note: string | null;
  /** ISO timestamp of when the off-app payment was recorded */
  paidAt: string;
};

export type RecordPayoutInput = {
  childProfileId: string;
  amountCents: number;
  method: PayoutMethod;
  /** optional detail for `other` payouts (a preset label or free text). */
  note?: string;
};

const PAYOUT_COLUMNS =
  "id, child_profile_id, amount_cents, method, note, paid_at, child:child_profiles(display_name)";

function mapPayout(row: any): Payout {
  return {
    id: row.id,
    childProfileId: row.child_profile_id,
    // PostgREST embeds the joined row under `child`; fall back to a flat column.
    childName: row.child?.display_name ?? row.child_name ?? "",
    amountCents: row.amount_cents,
    method: row.method,
    note: row.note ?? null,
    paidAt: row.paid_at,
  };
}

/**
 * Off-app payouts. No money moves in the app — the parent pays directly and we
 * record the amount + method. Backed by the `payouts` table with parent-admin
 * RLS; reads/writes are scoped to one household.
 */
export function createPaymentActions(client: PaymentClient, householdId: string) {
  return {
    async recordPayout(input: RecordPayoutInput): Promise<Payout> {
      if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
        throw new Error("Payout amount must be greater than zero.");
      }

      const payload: Record<string, unknown> = {
        household_id: householdId,
        child_profile_id: input.childProfileId,
        amount_cents: input.amountCents,
        method: input.method,
      };

      // Only set the note column when supplied, so cash payouts stay clean.
      if (input.note) {
        payload.note = input.note;
      }

      const result = await client
        .from("payouts")
        .insert(payload)
        .select(PAYOUT_COLUMNS)
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Payout was not recorded.");
      }

      return mapPayout(result.data);
    },

    async listPayouts(): Promise<Payout[]> {
      const result = await client
        .from("payouts")
        .select(PAYOUT_COLUMNS)
        .eq("household_id", householdId)
        .order("paid_at", { ascending: false });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map(mapPayout);
    },
  };
}

/** Sum of payouts recorded in the same calendar month as `reference` (default now). */
export function payoutsThisMonthCents(
  payouts: Payout[],
  reference: Date = new Date(),
): number {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();

  return payouts.reduce((total, payout) => {
    const paidAt = new Date(payout.paidAt);

    if (paidAt.getUTCFullYear() === year && paidAt.getUTCMonth() === month) {
      return total + payout.amountCents;
    }

    return total;
  }, 0);
}
