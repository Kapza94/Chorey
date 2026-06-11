import { createChildGameActions, type ChildGameStats } from "@/features/game/game-actions";
import { supabase } from "@/lib/supabase";

export async function getGameStatsForChild(accessCode: string): Promise<ChildGameStats> {
  return createChildGameActions(supabase).getGameStats(accessCode);
}
