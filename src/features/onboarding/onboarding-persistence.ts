import { createChildActions } from "@/features/children/child-actions";
import { createChildAccessActions } from "@/features/children/child-access-actions";
import { createChoreActions } from "@/features/chores/chore-actions";
import { createHouseholdActions } from "@/features/household/household-actions";
import type { OnboardingResult } from "@/features/onboarding/onboarding-flow";

/** The parent variant of an onboarding result — the only one we persist. */
export type ParentOnboardingResult = Extract<
  OnboardingResult,
  { role: "parent" }
>;

type PersistenceClient = {
  from(table: string): any;
  rpc?(
    fn: string,
    args: Record<string, unknown>,
  ): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

export type PersistedKid = {
  childProfileId: string;
  name: string;
  /** the generated 6-digit code the child uses to sign in */
  accessCode: string;
};

export type PersistedOnboarding = {
  householdId: string;
  kids: PersistedKid[];
};

/** The device's IANA timezone, or undefined if the runtime can't report one. */
function deviceTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** Onboarding `age` is a free-text string; keep only a sane whole number. */
function parseAge(age: string): number | null {
  const parsed = Number.parseInt(age, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 25) {
    return null;
  }
  return parsed;
}

/**
 * Turn a finished parent onboarding into real Supabase rows. Requires a
 * signed-in parent (RLS); call only after authentication succeeds.
 *
 * Writes, in order: the household (locale + split + cadence), then for each
 * kid a child profile (budget/cadence/age/tone), a 6-digit access code, and
 * the starter chores; finally the family's chosen giving causes.
 */
export function createOnboardingPersistence(
  client: PersistenceClient,
  parentUserId: string,
) {
  const households = createHouseholdActions(client, parentUserId);
  const access = createChildAccessActions(client);

  return {
    async persist(
      result: ParentOnboardingResult,
    ): Promise<PersistedOnboarding> {
      const familyName =
        result.familyName.trim() ||
        `${result.parentName.trim() || "My"} family`;
      const profile = await client.from("profiles").upsert({
        id: parentUserId,
        display_name: result.parentName.trim(),
        parent_label: result.parentLabel.trim(),
      });
      if (profile?.error) {
        throw profile.error;
      }

      const household = await households.createHousehold({
        name: familyName,
        settlementFrequency: result.cadence,
        country: result.country || undefined,
        currency: result.currency,
        split: result.split,
        // The device's zone makes chore "due by" times land at the family's
        // local hour; falls back to the table default (UTC) if unavailable.
        timezone: deviceTimezone(),
      });

      const children = createChildActions(client, household.id);
      const chores = createChoreActions(client, household.id);

      const kids: PersistedKid[] = [];
      for (const kid of result.kids) {
        const child = await children.createChild({
          displayName: kid.name,
          age: parseAge(kid.age),
          tone: kid.tone,
          budgetCents: result.budgetCents,
          cadence: result.cadence,
        });

        const code = await access.createAccessCode({
          childProfileId: child.id,
          householdId: household.id,
        });

        // Seed every chosen chore as a starter chore. No fixed due-by time:
        // cadence/late state handles daily, weekly, and monthly expectations.
        for (const chore of result.chores) {
          await chores.createChore({
            childProfileId: child.id,
            title: chore.name,
            rewardCents: chore.valueCents,
            dueAt: null,
          });
        }

        kids.push({
          childProfileId: child.id,
          name: child.displayName,
          accessCode: code.accessCode,
        });
      }

      // Chosen causes seed giving_options (parent-admin insert policy required).
      for (const name of result.causes) {
        const trimmed = name.trim();
        if (!trimmed) {
          continue;
        }
        const inserted = await client
          .from("giving_options")
          .insert({ household_id: household.id, name: trimmed });
        if (inserted?.error) {
          throw inserted.error;
        }
      }

      return { householdId: household.id, kids };
    },
  };
}
