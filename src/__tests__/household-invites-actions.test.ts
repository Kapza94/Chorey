import { createHouseholdInviteActions } from "@/features/household/household-invite-actions";

describe("household invite actions", () => {
  it("creates a co-parent invite and builds a share link", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          id: "invite-1",
          email: null,
          role: "parent_admin",
          status: "pending",
          expires_at: "2026-07-07T12:00:00Z",
          created_at: "2026-06-30T12:00:00Z",
          invite_token: "raw-token",
        },
        error: null,
      }),
    };

    await expect(
      createHouseholdInviteActions(client).createInvite({
        householdId: "household-1",
      }),
    ).resolves.toEqual({
      id: "invite-1",
      email: null,
      role: "parent_admin",
      status: "pending",
      expiresAt: "2026-07-07T12:00:00Z",
      createdAt: "2026-06-30T12:00:00Z",
      inviteCode: "raw-token",
      inviteUrl: "chorey://parent/invite?token=raw-token",
    });

    expect(client.rpc).toHaveBeenCalledWith("create_household_invite", {
      input_household_id: "household-1",
    });
  });

  it("lists and cancels pending household invites", async () => {
    const client = {
      rpc: jest
        .fn()
        .mockResolvedValueOnce({
          data: [
            {
              id: "invite-1",
              email: "step@example.com",
              role: "parent_admin",
              status: "pending",
              expires_at: "2026-07-07T12:00:00Z",
              created_at: "2026-06-30T12:00:00Z",
            },
          ],
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null }),
    };

    await expect(
      createHouseholdInviteActions(client).listInvites("household-1"),
    ).resolves.toEqual([
      {
        id: "invite-1",
        email: "step@example.com",
        role: "parent_admin",
        status: "pending",
        expiresAt: "2026-07-07T12:00:00Z",
        createdAt: "2026-06-30T12:00:00Z",
      },
    ]);

    await createHouseholdInviteActions(client).cancelInvite({
      householdId: "household-1",
      inviteId: "invite-1",
    });

    expect(client.rpc).toHaveBeenNthCalledWith(1, "list_household_invites", {
      input_household_id: "household-1",
    });
    expect(client.rpc).toHaveBeenNthCalledWith(2, "cancel_household_invite", {
      input_household_id: "household-1",
      input_invite_id: "invite-1",
    });
  });

  it("accepts an invite and returns the joined household", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: { household_id: "household-1" },
        error: null,
      }),
    };

    await expect(
      createHouseholdInviteActions(client).acceptInvite(" raw-token "),
    ).resolves.toEqual({ householdId: "household-1" });

    expect(client.rpc).toHaveBeenCalledWith("accept_household_invite", {
      input_token: "raw-token",
    });
  });
});
