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
