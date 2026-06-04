import { currencyForCountry, type CurrencyCode } from "@/features/money/currency";
import type { Split } from "@/features/money/split";

export type SettlementFrequency = "weekly" | "monthly";

type HouseholdClient = {
  from(table: string): any;
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
