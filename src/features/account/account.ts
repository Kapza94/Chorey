/**
 * Account-level actions. Pure (no React Native / Supabase imports) so it stays
 * unit-testable; default-account-actions wires the real client.
 */

type AccountClient = {
  rpc(
    fn: string,
    args?: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: Error | null }>;
};

export function createAccountActions(client: AccountClient) {
  return {
    /**
     * Permanently delete the signed-in parent's account. The RPC removes the
     * auth user, which cascades the household and all its data. Throws on error
     * so the confirm UI can surface it; on success the caller signs out.
     */
    async deleteAccount(): Promise<void> {
      const result = await client.rpc("delete_my_account", {});
      if (result.error) {
        throw result.error;
      }
    },
  };
}
