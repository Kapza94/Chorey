import type { Payout } from "@/features/payments/payment-actions";
import type { ParentKid } from "@/features/parent-app/parent-primitives";
import type { PayoutHistoryRow } from "@/features/parent-app/parent-payments-screen";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format a payout's ISO timestamp as a short "Mon D" label (e.g. "May 25"). */
export function formatPayoutDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/**
 * Map persisted payouts into the rows the Payments history list renders. Tone
 * comes from the matching kid (for the colored avatar); falls back to the
 * allowance swatch when the kid is no longer in the household snapshot.
 */
export function toPayoutHistoryRows(
  payouts: Payout[],
  kids: ParentKid[],
): PayoutHistoryRow[] {
  const toneByChild = new Map(kids.map((kid) => [kid.id, kid.tone]));

  return payouts.map((payout) => ({
    id: payout.id,
    kidName: payout.childName,
    tone: toneByChild.get(payout.childProfileId) ?? "allowance",
    dateLabel: formatPayoutDate(payout.paidAt),
    method: payout.method,
    detail: payout.note,
    amountCents: payout.amountCents,
  }));
}
