export type ChildGameStats = {
  /** lifetime points across every approved chore */
  totalPoints: number;
  /** how many chores have ever been approved */
  approvedCount: number;
};

type ChildGameClient = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: unknown;
    error: Error | null;
  }>;
};

const emptyStats: ChildGameStats = { totalPoints: 0, approvedCount: 0 };

export function createChildGameActions(client: ChildGameClient) {
  return {
    async getGameStats(accessCode: string): Promise<ChildGameStats> {
      const result = await client.rpc("get_child_game_stats", {
        input_access_code: accessCode,
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!row || typeof row !== "object") {
        return emptyStats;
      }

      const stats = row as { total_points?: number; approved_count?: number };
      return {
        totalPoints: stats.total_points ?? 0,
        approvedCount: stats.approved_count ?? 0,
      };
    },
  };
}

export type ChildGameActions = ReturnType<typeof createChildGameActions>;
