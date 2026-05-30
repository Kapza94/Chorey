import type {
  CreatedHousehold,
  CreateHouseholdInput,
} from "@/features/household/household-actions";

type SupabaseUserClient = {
  auth: {
    getUser(): Promise<{
      data: {
        user: { id: string } | null;
      };
      error: Error | null;
    }>;
  };
};

type HouseholdActionFactory = (parentUserId: string) => {
  createHousehold(input: CreateHouseholdInput): Promise<CreatedHousehold>;
};

export function createSignedInHouseholdAction(
  client: SupabaseUserClient,
  createActions: HouseholdActionFactory,
) {
  return async (input: CreateHouseholdInput): Promise<CreatedHousehold> => {
    const { data, error } = await client.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("A signed-in parent is required.");
    }

    return createActions(data.user.id).createHousehold(input);
  };
}
