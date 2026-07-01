import { authErrorMessage } from "@/features/auth/auth-error";

describe("authErrorMessage", () => {
  it("turns an expired PKCE flow state into a retry message", () => {
    expect(
      authErrorMessage(new Error("invalid flow state, no valid flow state found")),
    ).toBe("That took too long. Please try signing in again.");
    expect(authErrorMessage(new Error("flow_state_not_found"))).toBe(
      "That took too long. Please try signing in again.",
    );
  });

  it("passes through other real error messages", () => {
    expect(authErrorMessage(new Error("Network request failed"))).toBe(
      "Network request failed",
    );
  });

  it("uses the fallback for non-Error / empty inputs", () => {
    expect(authErrorMessage(undefined)).toBe("Couldn't sign in. Try again.");
    expect(authErrorMessage("nope", "Could not sign in.")).toBe(
      "Could not sign in.",
    );
  });
});
