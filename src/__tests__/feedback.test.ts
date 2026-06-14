import {
  MAX_FEEDBACK_LENGTH,
  createFeedbackActions,
  validateFeedbackMessage,
} from "@/features/feedback/feedback";

describe("validateFeedbackMessage", () => {
  it("trims surrounding whitespace", () => {
    expect(validateFeedbackMessage("  hello  ")).toEqual({ ok: true, message: "hello" });
  });

  it("rejects an empty or whitespace-only message", () => {
    expect(validateFeedbackMessage("   ").ok).toBe(false);
    expect(validateFeedbackMessage("").ok).toBe(false);
  });

  it("rejects a message over the max length", () => {
    const tooLong = "x".repeat(MAX_FEEDBACK_LENGTH + 1);
    expect(validateFeedbackMessage(tooLong).ok).toBe(false);
  });
});

describe("createFeedbackActions", () => {
  function stubClient() {
    const calls: { fn: string; args: Record<string, unknown> }[] = [];
    return {
      calls,
      rpc(fn: string, args: Record<string, unknown>) {
        calls.push({ fn, args });
        return Promise.resolve({ data: "row-id", error: null });
      },
    };
  }

  it("submits the trimmed message through the submit_app_feedback RPC", async () => {
    const client = stubClient();
    await createFeedbackActions(client).submit("feedback", "  Love it!  ", {
      householdId: "hh_1",
      platform: "ios",
      appVersion: "1.0.0",
    });

    expect(client.calls).toEqual([
      {
        fn: "submit_app_feedback",
        args: {
          input_kind: "feedback",
          input_message: "Love it!",
          input_household_id: "hh_1",
          input_platform: "ios",
          input_app_version: "1.0.0",
        },
      },
    ]);
  });

  it("defaults missing context to null", async () => {
    const client = stubClient();
    await createFeedbackActions(client).submit("contact", "Need help");
    expect(client.calls[0].args).toMatchObject({
      input_household_id: null,
      input_platform: null,
      input_app_version: null,
    });
  });

  it("never calls the RPC for an invalid message", async () => {
    const client = stubClient();
    await expect(createFeedbackActions(client).submit("feedback", "   ")).rejects.toThrow();
    expect(client.calls).toHaveLength(0);
  });

  it("surfaces an RPC error", async () => {
    const client = {
      rpc: () => Promise.resolve({ data: null, error: new Error("rpc boom") }),
    };
    await expect(
      createFeedbackActions(client).submit("contact", "hi"),
    ).rejects.toThrow("rpc boom");
  });
});
