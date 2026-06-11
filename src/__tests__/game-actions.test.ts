import { createChildGameActions } from "@/features/game/game-actions";

describe("createChildGameActions", () => {
  it("maps the RPC row to camelCase stats", async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [{ total_points: 72, approved_count: 3 }],
      error: null,
    });

    const stats = await createChildGameActions({ rpc }).getGameStats("987654");

    expect(rpc).toHaveBeenCalledWith("get_child_game_stats", {
      input_access_code: "987654",
    });
    expect(stats).toEqual({ totalPoints: 72, approvedCount: 3 });
  });

  it("returns zero stats when the RPC yields no row", async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [], error: null });

    const stats = await createChildGameActions({ rpc }).getGameStats("000000");

    expect(stats).toEqual({ totalPoints: 0, approvedCount: 0 });
  });

  it("throws when the RPC reports an error", async () => {
    const rpc = jest.fn().mockResolvedValue({ data: null, error: new Error("nope") });

    await expect(createChildGameActions({ rpc }).getGameStats("987654")).rejects.toThrow(
      "nope",
    );
  });
});
