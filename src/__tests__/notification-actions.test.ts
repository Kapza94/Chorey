import { createChildNotificationActions } from "@/features/notifications/notification-actions";

describe("child notification actions", () => {
  it("registers a token against the access code via the RPC", async () => {
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });

    await createChildNotificationActions({ rpc }).registerToken({
      accessCode: "12 34 56",
      token: "ExponentPushToken[abc]",
      platform: "ios",
    });

    expect(rpc).toHaveBeenCalledWith("register_child_push_token", {
      input_access_code: "12 34 56",
      input_token: "ExponentPushToken[abc]",
      input_platform: "ios",
    });
  });

  it("defaults platform to null when omitted", async () => {
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });

    await createChildNotificationActions({ rpc }).registerToken({
      accessCode: "123456",
      token: "ExponentPushToken[xyz]",
    });

    expect(rpc).toHaveBeenCalledWith(
      "register_child_push_token",
      expect.objectContaining({ input_platform: null }),
    );
  });

  it("throws when the RPC errors", async () => {
    const rpc = jest
      .fn()
      .mockResolvedValue({ data: null, error: new Error("Unknown access code.") });

    await expect(
      createChildNotificationActions({ rpc }).registerToken({
        accessCode: "000000",
        token: "ExponentPushToken[bad]",
      }),
    ).rejects.toThrow("Unknown access code.");
  });
});
