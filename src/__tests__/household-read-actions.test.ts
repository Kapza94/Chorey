import { createHouseholdReadActions } from "@/features/household/household-actions";

describe("createHouseholdReadActions.listHouseholdIds", () => {
  // Most recently JOINED household wins: a co-parent who accepts a family
  // invite must land in that family, not a household they created earlier.
  it("returns the signed-in parent's household ids newest-membership-first", async () => {
    const order = jest.fn().mockResolvedValue({
      data: [{ household_id: "h-joined" }, { household_id: "h-own" }],
      error: null,
    });
    const select = jest.fn(() => ({ order }));
    const client = { from: jest.fn(() => ({ select })) };

    const ids = await createHouseholdReadActions(client as any).listHouseholdIds();

    expect(client.from).toHaveBeenCalledWith("household_members");
    expect(select).toHaveBeenCalledWith("household_id, created_at");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(ids).toEqual(["h-joined", "h-own"]);
  });

  it("returns an empty list when the parent has no household", async () => {
    const order = jest.fn().mockResolvedValue({ data: [], error: null });
    const select = jest.fn(() => ({ order }));
    const client = { from: jest.fn(() => ({ select })) };

    const ids = await createHouseholdReadActions(client as any).listHouseholdIds();

    expect(ids).toEqual([]);
  });
});

describe("createHouseholdReadActions.updateHouseholdName", () => {
  it("trims and writes the new name to the household row", async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq }));
    const client = { from: jest.fn(() => ({ update })) };

    await createHouseholdReadActions(client as any).updateHouseholdName(
      "h-1",
      "  The Riveras  ",
    );

    expect(client.from).toHaveBeenCalledWith("households");
    expect(update).toHaveBeenCalledWith({ name: "The Riveras" });
    expect(eq).toHaveBeenCalledWith("id", "h-1");
  });

  it("rejects an empty name without writing", async () => {
    const update = jest.fn();
    const client = { from: jest.fn(() => ({ update })) };

    await expect(
      createHouseholdReadActions(client as any).updateHouseholdName("h-1", "   "),
    ).rejects.toThrow(/required/i);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("createHouseholdReadActions.updateHouseholdCurrency", () => {
  it("writes a known currency to the household row", async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq }));
    const client = { from: jest.fn(() => ({ update })) };

    await createHouseholdReadActions(client as any).updateHouseholdCurrency(
      "h-1",
      "RSD",
    );

    expect(update).toHaveBeenCalledWith({ currency: "RSD" });
    expect(eq).toHaveBeenCalledWith("id", "h-1");
  });

  it("rejects an unknown currency without writing", async () => {
    const update = jest.fn();
    const client = { from: jest.fn(() => ({ update })) };

    await expect(
      createHouseholdReadActions(client as any).updateHouseholdCurrency(
        "h-1",
        "ZZZ",
      ),
    ).rejects.toThrow(/unknown/i);
    expect(update).not.toHaveBeenCalled();
  });
});
