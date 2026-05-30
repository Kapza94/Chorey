import { createHouseholdActions } from "@/features/household/household-actions";

function createClient() {
  return {
    from: jest.fn((table: string) => {
      if (table === "households") {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: "household-1", name: "Kapza home" },
                error: null,
              }),
            })),
          })),
        };
      }

      return {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}

describe("household creation actions", () => {
  it("creates a household and links the current parent as admin", async () => {
    const client = createClient();
    const actions = createHouseholdActions(client, "parent-1");

    const household = await actions.createHousehold({
      name: " Kapza home ",
      settlementFrequency: "monthly",
    });

    expect(household).toEqual({ id: "household-1", name: "Kapza home" });
    expect(client.from).toHaveBeenCalledWith("households");
    expect(client.from).toHaveBeenCalledWith("household_members");
  });

  it("uses weekly settlement by default", async () => {
    const client = createClient();
    const actions = createHouseholdActions(client, "parent-1");

    await actions.createHousehold({ name: "Kapza home" });

    const householdsTable = client.from.mock.results[0]?.value;
    expect(householdsTable.insert).toHaveBeenCalledWith({
      name: "Kapza home",
      settlement_frequency: "weekly",
    });
  });

  it("rejects an empty household name before writing", async () => {
    const client = createClient();
    const actions = createHouseholdActions(client, "parent-1");

    await expect(actions.createHousehold({ name: "   " })).rejects.toThrow(
      "Household name is required.",
    );
    expect(client.from).not.toHaveBeenCalled();
  });
});

