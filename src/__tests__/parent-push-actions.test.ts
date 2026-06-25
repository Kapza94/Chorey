import { createParentPushActions } from "@/features/notifications/parent-push-actions";

function clientWithTokens(tokens: string[]) {
  return {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: tokens.map((token) => ({ token })), error: null }),
      }),
    }),
  };
}

describe("createParentPushActions.notifyChildOfChore", () => {
  it("posts an Expo message per registered device token", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({});
    await createParentPushActions(
      clientWithTokens(["ExpoTok[a]", "ExpoTok[b]"]) as never,
      fetchImpl as never,
    ).notifyChildOfChore({ childProfileId: "kid-1", title: "Dishes" });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://exp.host/--/api/v2/push/send");
    const body = JSON.parse(init.body);
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({
      to: "ExpoTok[a]",
      title: "New chore for you",
      data: { type: "chore_assigned" },
    });
    expect(body[0].body).toContain("Dishes");
  });

  it("sends nothing when the child has no registered device", async () => {
    const fetchImpl = jest.fn();
    await createParentPushActions(clientWithTokens([]) as never, fetchImpl as never)
      .notifyChildOfChore({ childProfileId: "kid-1", title: "Dishes" });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("never throws when the token read fails (chore creation must not break)", async () => {
    const client = {
      from: () => ({
        select: () => ({ eq: async () => ({ data: null, error: new Error("nope") }) }),
      }),
    };
    const fetchImpl = jest.fn();

    await expect(
      createParentPushActions(client as never, fetchImpl as never).notifyChildOfChore({
        childProfileId: "kid-1",
        title: "Dishes",
      }),
    ).resolves.toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
