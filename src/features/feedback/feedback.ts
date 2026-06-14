/**
 * In-app feedback + contact glue. Pure (no React Native imports) so it stays
 * unit-testable; the real Supabase client is wired in default-feedback-actions.
 * Messages are written through the `submit_app_feedback` RPC — the caller's id
 * and email are filled server-side, never trusted from here.
 */

/** 'feedback' = unsolicited thoughts; 'contact' = a request expecting a reply. */
export type FeedbackKind = "feedback" | "contact";

/** Matches the DB check constraint on app_feedback.message. */
export const MAX_FEEDBACK_LENGTH = 4000;

export type FeedbackValidation =
  | { ok: true; message: string }
  | { ok: false; error: string };

/** Trim and bounds-check a message before it leaves the device. */
export function validateFeedbackMessage(raw: string): FeedbackValidation {
  const message = raw.trim();
  if (message.length === 0) {
    return { ok: false, error: "Please write a message first." };
  }
  if (message.length > MAX_FEEDBACK_LENGTH) {
    return {
      ok: false,
      error: `That's a bit long — please keep it under ${MAX_FEEDBACK_LENGTH} characters.`,
    };
  }
  return { ok: true, message };
}

export type FeedbackContext = {
  householdId?: string | null;
  platform?: string;
  appVersion?: string;
};

type FeedbackClient = {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: Error | null }>;
};

export function createFeedbackActions(client: FeedbackClient) {
  return {
    /**
     * Send a message to the founder's inbox. Validates locally first (so an
     * empty note never hits the network), then defers to the RPC for the source
     * of truth. Throws on validation or RPC error so the form can surface it.
     */
    async submit(
      kind: FeedbackKind,
      message: string,
      context: FeedbackContext = {},
    ): Promise<void> {
      const validation = validateFeedbackMessage(message);
      if (!validation.ok) {
        throw new Error(validation.error);
      }

      const result = await client.rpc("submit_app_feedback", {
        input_kind: kind,
        input_message: validation.message,
        input_household_id: context.householdId ?? null,
        input_platform: context.platform ?? null,
        input_app_version: context.appVersion ?? null,
      });

      if (result.error) {
        throw result.error;
      }
    },
  };
}
