/**
 * Remembers the last level this device celebrated for a kid, so the level-up
 * burst fires exactly once per gained level. Uses the same SQLite-backed
 * localStorage the sessions use (installed by the session modules); degrades
 * to a no-op where storage is unavailable (tests, fresh environments).
 */

const key = (kidId: string) => `chorey.lastSeenLevel.${kidId}`;

export function getLastSeenLevel(kidId: string): number {
  try {
    const raw = globalThis.localStorage?.getItem(key(kidId));
    const level = Number(raw);
    return Number.isFinite(level) && level > 0 ? level : 0;
  } catch {
    return 0;
  }
}

export function setLastSeenLevel(kidId: string, level: number): void {
  try {
    globalThis.localStorage?.setItem(key(kidId), String(level));
  } catch {
    // Storage unavailable — celebrating again later is the worst case.
  }
}

/* Where the journey-map car last parked — drives forward on the next visit. */

const drivenKey = (kidId: string) => `chorey.lastDrivenLevel.${kidId}`;

export function getLastDrivenLevel(kidId: string): number {
  try {
    const raw = globalThis.localStorage?.getItem(drivenKey(kidId));
    const level = Number(raw);
    return Number.isFinite(level) && level > 0 ? level : 0;
  } catch {
    return 0;
  }
}

export function setLastDrivenLevel(kidId: string, level: number): void {
  try {
    globalThis.localStorage?.setItem(drivenKey(kidId), String(level));
  } catch {
    // Storage unavailable — the car re-drives next time. Kids won't mind.
  }
}
