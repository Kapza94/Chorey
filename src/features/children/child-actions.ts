type ChildClient = {
  from(table: string): any;
};

export type CreateChildInput = {
  displayName: string;
};

export type CreatedChild = {
  id: string;
  displayName: string;
  householdId: string;
};

export function createChildActions(client: ChildClient, householdId: string) {
  return {
    async createChild(input: CreateChildInput): Promise<CreatedChild> {
      const displayName = input.displayName.trim();

      if (!displayName) {
        throw new Error("Child name is required.");
      }

      const result = await client
        .from("child_profiles")
        .insert({
          household_id: householdId,
          display_name: displayName,
        })
        .select("id, display_name, household_id")
        .single();

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error("Child profile was not created.");
      }

      return {
        id: result.data.id,
        displayName: result.data.display_name,
        householdId: result.data.household_id,
      };
    },
  };
}
