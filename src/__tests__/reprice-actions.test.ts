import { repriceRecurringChores } from "@/features/chores/reprice-actions";

/** A chainable Supabase stub: every builder method returns the same object,
 *  which is itself awaitable (thenable) and resolves to `result`. `.single()`
 *  resolves directly. Good enough to assert the math + the update payloads. */
function queryResult(result: { data: unknown; error: unknown }) {
  const chain: any = {
    then: (resolve: any) => Promise.resolve(result).then(resolve),
  };
  for (const method of ["select", "eq", "not", "in", "update"]) {
    chain[method] = jest.fn(() => chain);
  }
  chain.single = jest.fn(() => Promise.resolve(result));
  return chain;
}

describe("repriceRecurringChores", () => {
  it("re-shares the allowance across the kid's recurring chores", async () => {
    // $8.00/week, one daily (7) + one weekly (1) = 8 completions → $1.00 each
    const childBuilder = queryResult({
      data: { budget_cents: 800, cadence: "weekly" },
      error: null,
    });
    const templatesBuilder = queryResult({
      data: [{ recurrence: "daily" }, { recurrence: "weekly" }],
      error: null,
    });
    const instancesBuilder = queryResult({ data: null, error: null });

    const client = {
      from: jest.fn((table: string) =>
        table === "child_profiles"
          ? childBuilder
          : table === "chore_templates"
            ? templatesBuilder
            : instancesBuilder,
      ),
    };

    const per = await repriceRecurringChores(client as any, "h-1", "c-1");

    expect(per).toBe(100);
    // Both the templates and their live instances get the new per-completion value.
    expect(templatesBuilder.update).toHaveBeenCalledWith({ reward_cents: 100 });
    expect(instancesBuilder.update).toHaveBeenCalledWith({ reward_cents: 100 });
    // Only un-paid instances are repriced — never approved/submitted work.
    expect(instancesBuilder.in).toHaveBeenCalledWith("status", [
      "assigned",
      "sent_back",
    ]);
  });

  it("prices to 0 when the kid has no budget", async () => {
    const client = {
      from: jest.fn((table: string) =>
        table === "child_profiles"
          ? queryResult({ data: { budget_cents: 0, cadence: "weekly" }, error: null })
          : queryResult({ data: [{ recurrence: "daily" }], error: null }),
      ),
    };

    const per = await repriceRecurringChores(client as any, "h-1", "c-1");
    expect(per).toBe(0);
  });
});
