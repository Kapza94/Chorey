import "expo-sqlite/localStorage/install";

import {
  createChildSessionStore,
  type ChildSession,
} from "@/features/children/child-session";

// The same SQLite-backed localStorage the Supabase client uses for parent
// sessions; survives app restarts.
const store = createChildSessionStore(localStorage);

export function saveChildSession(session: ChildSession): void {
  store.save(session);
}

export function loadChildSession(): ChildSession | null {
  return store.load();
}

export function clearChildSession(): void {
  store.clear();
}
