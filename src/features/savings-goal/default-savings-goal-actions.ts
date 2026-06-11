import {
  createSavingsGoalActions,
  type SavingsGoal,
} from "@/features/savings-goal/savings-goal-actions";
import { supabase } from "@/lib/supabase";

export async function getSavingsGoalForChild(
  accessCode: string,
): Promise<SavingsGoal | null> {
  return createSavingsGoalActions(supabase).getGoalForChild(accessCode);
}

export async function setSavingsGoalForChild(input: {
  accessCode: string;
  name: string;
  targetCents: number;
}): Promise<SavingsGoal> {
  return createSavingsGoalActions(supabase).setGoalForChild(input);
}
