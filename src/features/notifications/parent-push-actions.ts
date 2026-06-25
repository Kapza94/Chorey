/**
 * Parent-side push: nudge a child's devices when the parent assigns a new
 * chore, so it pops up without the kid reopening the app. Pure + injectable
 * (a Supabase-shaped client + fetch) so it unit-tests without the real client.
 *
 * The parent is allowed to read their household's child push tokens (see the
 * "household members read child push tokens" RLS policy), and Expo's push
 * endpoint is public — so the whole thing runs straight from the parent's
 * device, no edge function or DB trigger needed. Best-effort: a child with no
 * registered device, or a failed send, never blocks creating the chore.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type TokenClient = {
  from(table: string): {
    select(columns: string): {
      eq(
        column: string,
        value: string,
      ): PromiseLike<{ data: { token: string }[] | null; error: unknown }>;
    };
  };
};

type FetchLike = (
  input: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<unknown>;

export function createParentPushActions(client: TokenClient, fetchImpl: FetchLike) {
  return {
    /** Push a "new chore" nudge to every device the child has registered. */
    async notifyChildOfChore(input: {
      childProfileId: string;
      title: string;
    }): Promise<void> {
      try {
        const { data, error } = await client
          .from("push_tokens")
          .select("token")
          .eq("child_profile_id", input.childProfileId);

        if (error || !data || data.length === 0) {
          return;
        }

        const messages = data.map((row) => ({
          to: row.token,
          sound: "default" as const,
          title: "New chore for you",
          body: `${input.title} — tap to see it.`,
          data: { type: "chore_assigned" as const },
        }));

        await fetchImpl(EXPO_PUSH_URL, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(messages),
        });
      } catch {
        // Push is a bonus; never let it surface as a failed chore creation.
      }
    },
  };
}
