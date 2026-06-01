type RpcClient = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

export type GivingOption = {
  id: string;
  name: string;
};

export type GivingSuggestion = {
  childName?: string;
  id: string;
  name: string;
  status: "pending" | "approved" | "declined";
};

function mapOption(row: any): GivingOption {
  return {
    id: row.id,
    name: row.name,
  };
}

function mapSuggestion(row: any): GivingSuggestion {
  return {
    childName: row.child_name,
    id: row.id,
    name: row.name,
    status: row.status,
  };
}

export function createGivingActions(client: RpcClient) {
  return {
    async suggestGivingOption(input: {
      accessCode: string;
      name: string;
    }): Promise<GivingSuggestion> {
      const result = await client.rpc("suggest_giving_option", {
        input_access_code: input.accessCode,
        input_name: input.name.trim(),
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;

      if (!row) {
        throw new Error("Giving suggestion was not created.");
      }

      return mapSuggestion(row);
    },

    async listChildGivingOptions(accessCode: string): Promise<GivingOption[]> {
      const result = await client.rpc("list_child_giving_options", {
        input_access_code: accessCode,
      });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map(mapOption);
    },

    async approveGivingSuggestion(input: {
      householdId: string;
      suggestionId: string;
    }): Promise<GivingOption> {
      const result = await client.rpc("approve_giving_suggestion", {
        input_household_id: input.householdId,
        input_suggestion_id: input.suggestionId,
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;

      if (!row) {
        throw new Error("Giving suggestion was not approved.");
      }

      return mapOption(row);
    },

    async listHouseholdGivingSuggestions(
      householdId: string,
    ): Promise<GivingSuggestion[]> {
      const result = await client.rpc("list_household_giving_suggestions", {
        input_household_id: householdId,
      });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map(mapSuggestion);
    },
  };
}
