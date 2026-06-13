type RpcClient = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

/**
 * Child-side notification actions. A child is not a Supabase-authenticated
 * user, so token registration goes through a security-definer RPC keyed by
 * the access code. Pure + injectable so it tests without the real client.
 */
export function createChildNotificationActions(client: RpcClient) {
  return {
    async registerToken(input: {
      accessCode: string;
      token: string;
      platform?: string | null;
    }): Promise<void> {
      const result = await client.rpc("register_child_push_token", {
        input_access_code: input.accessCode,
        input_token: input.token,
        input_platform: input.platform ?? null,
      });

      if (result.error) {
        throw result.error;
      }
    },
  };
}
