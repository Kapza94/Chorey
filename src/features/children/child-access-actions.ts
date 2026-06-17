import {
  DEFAULT_CURRENCY,
  isKnownCurrency,
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
  /** True when the household subscription lapsed; the kid app shows a neutral pause. */
  paused: boolean;
};

/** Mirror of the DB `normalize_access_code`: uppercase + strip whitespace. */
export function normalizeAccessCode(value: string) {
  return value.replace(/\s/g, "").toUpperCase();
}

// Unambiguous alphabet (no I/O/0/1) so a code is easy to read aloud and type.
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_DIGITS = "23456789";
const CODE_CHARS = CODE_LETTERS + CODE_DIGITS;

/** `CHOREY-XXXXXXXX` — 8 alphanumerics, always a mix of letters and digits. */
export function generateAccessCode() {
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  // Seed one letter + one digit so the code is never all-numeric/all-alpha.
  const chars = [pick(CODE_LETTERS), pick(CODE_DIGITS)];
  while (chars.length < 8) {
    chars.push(pick(CODE_CHARS));
  }
  // Shuffle so the seeded letter/digit aren't pinned to the first two slots.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return `CHOREY-${chars.join("")}`;
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
          access_code: generateAccessCode(),
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

      const currency: CurrencyCode =
        typeof row.currency === "string" && isKnownCurrency(row.currency)
          ? row.currency
          : DEFAULT_CURRENCY;

      return {
        accessCode: row.access_code,
        childProfileId: row.child_profile_id,
        childName: row.child_name ?? "Child",
        householdId: row.household_id,
        currency,
        paused: row.paused === true,
      };
    },
  };
}
