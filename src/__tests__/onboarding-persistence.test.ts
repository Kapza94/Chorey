import {
  createOnboardingPersistence,
  type ParentOnboardingResult,
} from "@/features/onboarding/onboarding-persistence";

/**
 * A stub Supabase client that records every insert per table and supports the
 * two chain shapes the actions use: `.insert().select().single()` and a direct
 * `await .insert()`, plus standalone `.select().eq()[.maybeSingle()]` reads.
 */
function makeClient() {
  const inserts: Record<string, any[]> = {
    households: [],
    household_members: [],
    child_profiles: [],
    child_access_codes: [],
    chore_instances: [],
    giving_options: [],
  };

  let childSeq = 0;
  let choreSeq = 0;

  function returnRow(table: string, payload: any) {
    switch (table) {
      case "households":
        return { id: "household-1", name: payload.name };
      case "child_profiles":
        childSeq += 1;
        return {
          id: `child-${childSeq}`,
          display_name: payload.display_name,
          household_id: payload.household_id,
        };
      case "child_access_codes":
        return {
          access_code: `00000${childSeq}`,
          child_profile_id: payload.child_profile_id,
          household_id: payload.household_id,
        };
      case "chore_instances":
        choreSeq += 1;
        return {
          id: `chore-${choreSeq}`,
          household_id: payload.household_id,
          child_profile_id: payload.child_profile_id,
          title: payload.title,
          reward_cents: payload.reward_cents,
          status: payload.status,
        };
      default:
        return null;
    }
  }

  const client = {
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              const promise = Promise.resolve({ data: [], error: null });
              return Object.assign(promise, {
                // New households carry a trialing entitlement (DB trigger).
                maybeSingle: () =>
                  Promise.resolve({
                    data:
                      table === "household_entitlements"
                        ? { status: "trialing" }
                        : null,
                    error: null,
                  }),
              });
            },
          };
        },
        insert(payload: any) {
          if (inserts[table]) {
            inserts[table].push(payload);
          }
          const row = returnRow(table, payload);
          const chain: any = {
            select() {
              return {
                single: () => Promise.resolve({ data: row, error: null }),
              };
            },
          };
          chain.then = (resolve: any) =>
            resolve({ data: null, error: null });
          return chain;
        },
      };
    },
  };

  return { client, inserts };
}

const RESULT: ParentOnboardingResult = {
  role: "parent",
  parentName: "Luka",
  familyName: "Kapza",
  country: "RS",
  currency: "RSD",
  kids: [{ name: "Mina", age: "9", tone: "savings" }],
  split: { spend: 40, save: 40, give: 20 },
  cadence: "monthly",
  budgetCents: 250000,
  chores: [
    { name: "Dishes", valueCents: 250 },
    { name: "Walk the dog", valueCents: 300 },
  ],
  choreDueTime: "16:00",
  causes: ["Animals", "Hunger"],
  joinCode: "CHKAP",
};

describe("onboarding persistence", () => {
  it("creates the household with locale, split and cadence", async () => {
    const { client, inserts } = makeClient();

    await createOnboardingPersistence(client, "parent-1").persist(RESULT);

    expect(inserts.households).toEqual([
      {
        name: "Kapza",
        settlement_frequency: "monthly",
        country: "RS",
        currency: "RSD",
        split_spend: 40,
        split_save: 40,
        split_give: 20,
        // Captured from the device's IANA zone (whatever the test host reports).
        timezone: expect.any(String),
      },
    ]);
    expect(inserts.household_members[0]).toEqual({
      household_id: "household-1",
      user_id: "parent-1",
      role: "parent_admin",
    });
  });

  it("creates each kid with budget, cadence, age and tone", async () => {
    const { client, inserts } = makeClient();

    await createOnboardingPersistence(client, "parent-1").persist(RESULT);

    expect(inserts.child_profiles).toEqual([
      {
        household_id: "household-1",
        display_name: "Mina",
        age: 9,
        tone: "savings",
        budget_cents: 250000,
        cadence: "monthly",
      },
    ]);
  });

  it("generates an access code and starter chores per kid", async () => {
    const { client, inserts } = makeClient();

    const persisted = await createOnboardingPersistence(
      client,
      "parent-1",
    ).persist(RESULT);

    expect(inserts.child_access_codes).toHaveLength(1);
    // one chore per chosen chore, assigned to the kid
    expect(inserts.chore_instances).toHaveLength(2);
    expect(inserts.chore_instances).toEqual([
      {
        household_id: "household-1",
        child_profile_id: "child-1",
        title: "Dishes",
        reward_cents: 250,
        status: "assigned",
        due_at: expect.any(String),
      },
      {
        household_id: "household-1",
        child_profile_id: "child-1",
        title: "Walk the dog",
        reward_cents: 300,
        status: "assigned",
        due_at: expect.any(String),
      },
    ]);
    expect(persisted.kids[0]).toEqual({
      childProfileId: "child-1",
      name: "Mina",
      accessCode: "000001",
    });
  });

  it("seeds the chosen causes into giving options", async () => {
    const { client, inserts } = makeClient();

    await createOnboardingPersistence(client, "parent-1").persist(RESULT);

    expect(inserts.giving_options).toEqual([
      { household_id: "household-1", name: "Animals" },
      { household_id: "household-1", name: "Hunger" },
    ]);
  });
});
