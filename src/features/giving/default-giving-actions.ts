import {
  createGivingActions,
  type GivingOption,
  type GivingSuggestion,
} from "@/features/giving/giving-actions";
import { supabase } from "@/lib/supabase";

export async function listGivingOptionsForChild(
  accessCode: string,
): Promise<GivingOption[]> {
  return createGivingActions(supabase).listChildGivingOptions(accessCode);
}

export async function suggestGivingOptionForChild(input: {
  accessCode: string;
  name: string;
}): Promise<GivingSuggestion> {
  return createGivingActions(supabase).suggestGivingOption(input);
}

export async function listGivingSuggestionsForHousehold(
  householdId: string,
): Promise<GivingSuggestion[]> {
  return createGivingActions(supabase).listHouseholdGivingSuggestions(householdId);
}

export async function approveGivingSuggestionForHousehold(input: {
  householdId: string;
  suggestionId: string;
}): Promise<GivingOption> {
  return createGivingActions(supabase).approveGivingSuggestion(input);
}
