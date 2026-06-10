import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/features/money/currency";

/**
 * The kid's device session. A child signs in once with their access code;
 * after that the device remembers them across restarts — a seven-year-old
 * should never need to re-type a 6-digit code because the app was killed.
 */
export type ChildSession = {
  accessCode: string;
  childName: string;
  childProfileId: string;
  householdId: string;
  currency: CurrencyCode;
};

export type ChildSessionStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const STORAGE_KEY = "chorey.child-session";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function createChildSessionStore(storage: ChildSessionStorage) {
  return {
    save(session: ChildSession): void {
      storage.setItem(STORAGE_KEY, JSON.stringify(session));
    },

    load(): ChildSession | null {
      const raw = storage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      try {
        const parsed: unknown = JSON.parse(raw);

        if (typeof parsed !== "object" || parsed === null) {
          return null;
        }

        const record = parsed as Record<string, unknown>;
        const accessCode = asString(record.accessCode);

        if (!accessCode) {
          return null;
        }

        const currency = asString(record.currency);

        return {
          accessCode,
          childName: asString(record.childName),
          childProfileId: asString(record.childProfileId),
          householdId: asString(record.householdId),
          currency: currency in CURRENCIES ? (currency as CurrencyCode) : DEFAULT_CURRENCY,
        };
      } catch {
        return null;
      }
    },

    clear(): void {
      storage.removeItem(STORAGE_KEY);
    },
  };
}
