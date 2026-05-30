import {
  createChildAccessActions,
  normalizeAccessCode,
} from "@/features/children/child-access-actions";

function createClient() {
  return {
    rpc: jest.fn().mockResolvedValue({
      data: [
        {
          access_code: "123456",
          child_profile_id: "child-1",
          child_name: "Mina",
          household_id: "household-1",
        },
      ],
      error: null,
    }),
    from: jest.fn((table: string) => {
      if (table === "child_access_codes") {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  access_code: "123456",
                  child_profile_id: "child-1",
                  household_id: "household-1",
                },
                error: null,
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe("child access actions", () => {
  it("normalizes access codes to digits only", () => {
    expect(normalizeAccessCode(" 123 456 ")).toBe("123456");
  });

  it("creates a child access code", async () => {
    const client = createClient();
    const actions = createChildAccessActions(client);

    const access = await actions.createAccessCode({
      childProfileId: "child-1",
      householdId: "household-1",
    });

    expect(access).toEqual({
      accessCode: "123456",
      childProfileId: "child-1",
      householdId: "household-1",
    });
    expect(client.from).toHaveBeenCalledWith("child_access_codes");
  });

  it("resolves a child from an access code", async () => {
    const client = createClient();
    const actions = createChildAccessActions(client);

    const child = await actions.resolveAccessCode("123 456");

    expect(child).toEqual({
      accessCode: "123456",
      childProfileId: "child-1",
      childName: "Mina",
      householdId: "household-1",
    });
    expect(client.rpc).toHaveBeenCalledWith("resolve_child_access_code", {
      input_access_code: "123456",
    });
  });
});
