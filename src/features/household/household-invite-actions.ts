type RpcClient = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

export type HouseholdInviteStatus = "pending" | "accepted" | "cancelled" | "expired";

export type HouseholdInvite = {
  id: string;
  email: string;
  role: "parent_admin";
  status: HouseholdInviteStatus;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string | null;
  cancelledAt?: string | null;
  /** Human-typeable family code (FAM-XXXXXXXX) — returned once at creation. */
  inviteCode?: string;
  inviteUrl?: string;
};

export type AcceptedHouseholdInvite = {
  householdId: string;
};

const INVITE_LINK_BASE = "chorey://parent/invite";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function inviteUrl(token?: string | null) {
  return token ? `${INVITE_LINK_BASE}?token=${encodeURIComponent(token)}` : undefined;
}

function mapInvite(row: any): HouseholdInvite {
  const invite: HouseholdInvite = {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };

  if (row.accepted_at) {
    invite.acceptedAt = row.accepted_at;
  }
  if (row.cancelled_at) {
    invite.cancelledAt = row.cancelled_at;
  }

  if (row.invite_token) {
    invite.inviteCode = row.invite_token;
  }
  const url = inviteUrl(row.invite_token);
  if (url) {
    invite.inviteUrl = url;
  }

  return invite;
}

export function createHouseholdInviteActions(client: RpcClient) {
  return {
    async createInvite(input: {
      householdId: string;
      email: string;
    }): Promise<HouseholdInvite> {
      const email = normalizeEmail(input.email);
      if (!email) {
        throw new Error("Email is required.");
      }

      const result = await client.rpc("create_household_invite", {
        input_household_id: input.householdId,
        input_email: email,
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!row) {
        throw new Error("Invite was not created.");
      }

      return mapInvite(row);
    },

    async listInvites(householdId: string): Promise<HouseholdInvite[]> {
      const result = await client.rpc("list_household_invites", {
        input_household_id: householdId,
      });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map(mapInvite);
    },

    async cancelInvite(input: {
      householdId: string;
      inviteId: string;
    }): Promise<void> {
      const result = await client.rpc("cancel_household_invite", {
        input_household_id: input.householdId,
        input_invite_id: input.inviteId,
      });

      if (result.error) {
        throw result.error;
      }
    },

    async acceptInvite(token: string): Promise<AcceptedHouseholdInvite> {
      const result = await client.rpc("accept_household_invite", {
        input_token: token.trim(),
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!row?.household_id) {
        throw new Error("Invite was not accepted.");
      }

      return { householdId: row.household_id };
    },
  };
}
