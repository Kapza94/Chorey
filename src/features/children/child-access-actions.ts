import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/features/money/currency";

type ChildAccessClient = {
  from(table: string): any;
  rpc?(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

export type ChildAccessCode = {
  accessCode: string;
  childProfileId: string;
  householdId: string;
};

export type ResolvedChildAccess = ChildAccessCode & {
  childName: string;
  /** The household's display currency — kids see money the way parents set it up. */
  currency: CurrencyCode;
};

export function normalizeAccessCode(value: string) {
  return value.replace(/\D/g, "");
}

function createSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createChildAccessActions(client: ChildAccessClient) {
  return {
    async createAccessCode(input: {
      childProfileId: string;
      householdId: string;
    }): Promise<ChildAccessCode> {
      const result = await client
        .from("child_access_codes")
        .insert({
          access_code: createSixDigitCode(),
          child_profile_id: input.childProfileId,
          household_id: input.householdId,
        })
        .select("access_code, child_profile_id, household_id")
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Child access code was not created.");
      }

      return {
        accessCode: result.data.access_code,
        childProfileId: result.data.child_profile_id,
        householdId: result.data.household_id,
      };
    },

    /** All sign-in codes in a household, so parents can recover a lost one. */
    async listAccessCodesForHousehold(
      householdId: string,
    ): Promise<{ accessCode: string; childProfileId: string }[]> {
      const result = await client
        .from("child_access_codes")
        .select("access_code, child_profile_id")
        .eq("household_id", householdId);

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map((row: any) => ({
        accessCode: row.access_code,
        childProfileId: row.child_profile_id,
      }));
    },

    async resolveAccessCode(code: string): Promise<ResolvedChildAccess> {
      const accessCode = normalizeAccessCode(code);

      if (!accessCode) {
        throw new Error("Access code is required.");
      }

      if (!client.rpc) {
        throw new Error("Child access lookup is unavailable.");
      }

      const result = await client.rpc("resolve_child_access_code", {
        input_access_code: accessCode,
      });

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Access code was not found.");
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;

      if (!row) {
        throw new Error("Access code was not found.");
      }

      const currency =
        typeof row.currency === "string" && row.currency in CURRENCIES
          ? (row.currency as CurrencyCode)
          : DEFAULT_CURRENCY;

      return {
        accessCode: row.access_code,
        childProfileId: row.child_profile_id,
        childName: row.child_name ?? "Child",
        householdId: row.household_id,
        currency,
      };
    },
  };
}
