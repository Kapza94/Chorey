import { createHouseholdReadActions } from "@/features/household/household-actions";

describe("createHouseholdReadActions.listHouseholdIds", () => {
  it("returns the signed-in parent's household ids oldest-first", async () => {
    const order = jest.fn().mockResolvedValue({
      data: [{ id: "h-old" }, { id: "h-new" }],
      error: null,
    });
    const select = jest.fn(() => ({ order }));
    const client = { from: jest.fn(() => ({ select })) };

    const ids = await createHouseholdReadActions(client as any).listHouseholdIds();

    expect(client.from).toHaveBeenCalledWith("households");
    expect(select).toHaveBeenCalledWith("id");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(ids).toEqual(["h-old", "h-new"]);
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
