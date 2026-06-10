import {
  createChildChoreActions,
  type ChildChore,
} from "@/features/chores/child-chore-actions";
import { supabase } from "@/lib/supabase";

export async function listChoresForChild(accessCode: string): Promise<ChildChore[]> {
  return createChildChoreActions(supabase).listChores(accessCode);
}

export async function submitChoreForChild(input: {
  accessCode: string;
  choreId: string;
}): Promise<ChildChore> {
  return createChildChoreActions(supabase).submitChore(input);
}

export async function undoChoreSubmissionForChild(input: {
  accessCode: string;
  choreId: string;
}): Promise<ChildChore> {
  return createChildChoreActions(supabase).undoSubmission(input);
}
