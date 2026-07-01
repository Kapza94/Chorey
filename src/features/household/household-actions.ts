import {
  currencyForCountry,
  isKnownCurrency,
  type CurrencyCode,
} from "@/features/money/currency";
import {
  DEFAULT_SPLIT,
  isValidSplit,
  MIN_GIVE_PCT,
  type Split,
} from "@/features/money/split";

export type SettlementFrequency = "weekly" | "monthly";

type HouseholdClient = {
  from(table: string): any;
};

export type HouseholdSettings = {
  name: string;
  currency: CurrencyCode;
  /** what this parent's child calls them (Dad/Mom/…), or "Parent" if unset. */
  parentLabel: string;
  split: Split;
};

export type CreateHouseholdInput = {
  name: string;
  settlementFrequency?: SettlementFrequency;
  /** ISO country code captured at registration; sets the family currency. */
  country?: string;
  /** explicit override; defaults to the currency for `country`. */
  currency?: CurrencyCode;
  /** the family's spend/save/give percentages; defaults to the table 40/40/20. */
  split?: Split;
  /** IANA timezone (e.g. "America/New_York"); turns chore "due by" times into
   *  concrete instants. Defaults to the table's UTC when omitted. */
  timezone?: string;
};

export type CreatedHousehold = {
  id: string;
  name: string;
};

export function createHouseholdActions(
  client: HouseholdClient,
  parentUserId: string,
) {
  return {
    async createHousehold(input: CreateHouseholdInput) {
      const name = input.name.trim();

      if (!name) {
        throw new Error("Household name is required.");
      }

      const payload: Record<string, unknown> = {
        name,
        settlement_frequency: input.settlementFrequency ?? "weekly",
      };

      if (input.timezone) {
        payload.timezone = input.timezone;
      }

      // Only set locale columns when a country is supplied, so callers that
      // create a household without onboarding locale keep the table defaults.
      if (input.country) {
        payload.country = input.country;
        payload.currency = input.currency ?? currencyForCountry(input.country);
      }

      // Only set split columns when supplied, so non-onboarding callers keep
      // the table's 40/40/20 default.
      if (input.split) {
        payload.split_spend = input.split.spend;
        payload.split_save = input.split.save;
        payload.split_give = input.split.give;
      }

      const result = await client
        .from("households")
        .insert(payload)
        .select("id, name")
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Household was not created.");
      }

      const membership = await client.from("household_members").insert({
        household_id: result.data.id,
        user_id: parentUserId,
        role: "parent_admin",
      });

      if (membership.error) {
        throw membership.error;
      }

      return result.data as CreatedHousehold;
    },
  };
}

/** Read-only household settings (currency + split) for any household member. */
export function createHouseholdReadActions(client: HouseholdClient) {
  return {
    /** Household ids the signed-in parent belongs to (RLS-scoped), oldest first. */
    async listHouseholdIds(): Promise<string[]> {
      const result = await client
        .from("households")
        .select("id")
        .order("created_at", { ascending: true });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map((row: { id: string }) => row.id);
    },

    /**
     * Update a household's spend/save/give split. Parent admins only (RLS).
     * Validates the shape and the Giving floor before writing, so the UI gets a
     * clear error rather than a raw constraint violation.
     */
    async updateHouseholdSplit(householdId: string, split: Split): Promise<void> {
      if (!isValidSplit(split)) {
        throw new Error("Split percentages must be non-negative and sum to 100.");
      }
      if (split.give < MIN_GIVE_PCT) {
        throw new Error(`Giving must stay at least ${MIN_GIVE_PCT}%.`);
      }

      const result = await client
        .from("households")
        .update({
          split_spend: split.spend,
          split_save: split.save,
          split_give: split.give,
        })
        .eq("id", householdId);

      if (result.error) {
        throw result.error;
      }
    },

    /** Rename a household. Parent admins only (RLS). Rejects an empty name. */
    async updateHouseholdName(householdId: string, name: string): Promise<void> {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error("Family name is required.");
      }

      const result = await client
        .from("households")
        .update({ name: trimmed })
        .eq("id", householdId);

      if (result.error) {
        throw result.error;
      }
    },

    /** Change the household's display currency. Parent admins only (RLS). */
    async updateHouseholdCurrency(
      householdId: string,
      currency: CurrencyCode,
    ): Promise<void> {
      if (!isKnownCurrency(currency)) {
        throw new Error("Unknown currency.");
      }

      const result = await client
        .from("households")
        .update({ currency })
        .eq("id", householdId);

      if (result.error) {
        throw result.error;
      }
    },

    async getHouseholdSettings(householdId: string): Promise<HouseholdSettings> {
      const result = await client
        .from("households")
        .select("name, currency, split_spend, split_save, split_give")
        .eq("id", householdId)
        .single();

      if (result.error) {
        throw result.error;
      }

      const row = result.data;

      // The caller's own profile — RLS scopes profiles select to id = auth.uid(),
      // so this returns just their row. Used to label their wish notes.
      const profile = await client
        .from("profiles")
        .select("parent_label")
        .maybeSingle();
      const parentLabel =
        (profile?.data?.parent_label ?? "").trim() || "Parent";

      return {
        name: row?.name ?? "",
        currency: (row?.currency ?? "USD") as CurrencyCode,
        parentLabel,
        split: {
          spend: row?.split_spend ?? DEFAULT_SPLIT.spend,
          save: row?.split_save ?? DEFAULT_SPLIT.save,
          give: row?.split_give ?? DEFAULT_SPLIT.give,
        },
      };
    },
  };
}
