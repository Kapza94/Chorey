/** Turn a raw Supabase/GoTrue auth error into a message a parent can act on.
 *
 *  The PKCE flow state expires when the provider login takes too long — common
 *  on a simulator with no saved Google session, where signing in can take
 *  minutes. GoTrue then returns the opaque "invalid flow state" /
 *  `flow_state_not_found`, which must never reach the user as-is. */
export function authErrorMessage(
  error: unknown,
  fallback = "Couldn't sign in. Try again.",
): string {
  const raw = error instanceof Error ? error.message : "";
  if (/flow[_ ]state/i.test(raw)) {
    return "That took too long. Please try signing in again.";
  }
  return raw || fallback;
}
