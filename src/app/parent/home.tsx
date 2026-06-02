import { ParentApp } from "@/features/parent-app/parent-app";
import {
  getOnboardingResult,
  parentPreviewFromResult,
} from "@/features/onboarding/onboarding-handoff";
import { payoutsThisMonthCents } from "@/features/payments/payment-actions";
import type { DuePayout, PayoutHistoryRow } from "@/features/parent-app/parent-payments-screen";

/**
 * Preview route for the redesigned parent app, seeded from the onboarding the
 * user just completed. Real Supabase wiring (per-kid aggregates) is the next
 * step; this lets the whole redesign be walked in the simulator today.
 */
export default function ParentHomeRoute() {
  const result = getOnboardingResult();
  const { currency, split, kids } = parentPreviewFromResult(result);

  const due: DuePayout[] = kids.map((kid) => ({
    id: kid.id,
    name: kid.name,
    tone: kid.tone,
    earnedCents: kid.earnedCents,
    allowanceCents: kid.allowanceCents,
    savingsCents: kid.savingsCents,
    givingCents: kid.givingCents,
    choresDone: kid.choresDone,
    cadence: kid.cadence,
  }));

  const history: PayoutHistoryRow[] =
    kids.length > 0
      ? [
          {
            id: "h1",
            kidName: kids[0].name,
            tone: kids[0].tone,
            dateLabel: "May 25",
            method: "cash",
            amountCents: kids[0].budgetCents,
          },
        ]
      : [];

  return (
    <ParentApp
      subtitle="This week"
      currency={currency}
      split={split}
      kids={kids}
      due={due}
      payoutHistory={history}
      paidThisMonthCents={payoutsThisMonthCents(
        history.map((row) => ({
          id: row.id,
          childProfileId: "",
          childName: row.kidName,
          amountCents: row.amountCents,
          method: row.method,
          paidAt: new Date().toISOString(),
        })),
      )}
      chores={[]}
      assignees={kids.map((kid) => ({ id: kid.id, name: kid.name }))}
    />
  );
}
