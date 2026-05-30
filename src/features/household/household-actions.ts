export type SettlementFrequency = "weekly" | "monthly";

type HouseholdClient = {
  from(table: string): any;
};

export type CreateHouseholdInput = {
  name: string;
  settlementFrequency?: SettlementFrequency;
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

      const result = await client
        .from("households")
        .insert({
          name,
          settlement_frequency: input.settlementFrequency ?? "weekly",
        })
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
