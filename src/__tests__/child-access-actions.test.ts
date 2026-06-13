import {
  createChildAccessActions,
  generateAccessCode,
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
          currency: "RSD",
          paused: false,
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
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [
                { access_code: "123456", child_profile_id: "child-1" },
                { access_code: "654321", child_profile_id: "child-2" },
              ],
              error: null,
            }),
          })),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe("child access actions", () => {
  it("normalizes access codes: uppercase + strip whitespace (mirrors the DB)", () => {
    expect(normalizeAccessCode(" chorey-ab12cd34 ")).toBe("CHOREY-AB12CD34");
    expect(normalizeAccessCode("CHOREY-AB12CD34")).toBe("CHOREY-AB12CD34");
  });

  it("generates Chorey-XXXXXXXX codes with a guaranteed letter+digit mix", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateAccessCode();
      expect(code).toMatch(/^CHOREY-[A-Z0-9]{8}$/);
      const body = code.slice("CHOREY-".length);
      expect(body).toMatch(/[A-Z]/); // at least one letter
      expect(body).toMatch(/[0-9]/); // at least one digit
      // Unambiguous alphabet: never I, O, 0, or 1.
      expect(body).not.toMatch(/[IO01]/);
    }
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

  it("resolves a child (and the household currency) from an access code", async () => {
    const client = createClient();
    const actions = createChildAccessActions(client);

    const child = await actions.resolveAccessCode("123 456");

    expect(child).toEqual({
      accessCode: "123456",
      childProfileId: "child-1",
      childName: "Mina",
      householdId: "household-1",
      currency: "RSD",
      paused: false,
    });
    expect(client.rpc).toHaveBeenCalledWith("resolve_child_access_code", {
      input_access_code: "123456",
    });
  });

  it("falls back to USD when the household currency is unknown", async () => {
    const client = createClient();
    client.rpc.mockResolvedValue({
      data: [
        {
          access_code: "123456",
          child_profile_id: "child-1",
          child_name: "Mina",
          household_id: "household-1",
          currency: "XYZ",
        },
      ],
      error: null,
    });

    const child = await createChildAccessActions(client).resolveAccessCode("123456");
    expect(child.currency).toBe("USD");
  });

  it("lists a household's access codes for parents", async () => {
    const client = createClient();
    const actions = createChildAccessActions(client);

    const codes = await actions.listAccessCodesForHousehold("household-1");

    expect(codes).toEqual([
      { accessCode: "123456", childProfileId: "child-1" },
      { accessCode: "654321", childProfileId: "child-2" },
    ]);
  });
});
