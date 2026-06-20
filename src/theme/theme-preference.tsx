import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * The user's appearance choice. "system" follows the OS light/dark setting;
 * "light" / "dark" pin the app regardless of the OS.
 */
export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "chorey.theme-preference";

/**
 * Synchronous device storage installed app-wide by `expo-sqlite/localStorage`
 * (see `src/lib/supabase.ts`). Guarded so a missing global never crashes the
 * theme — it just falls back to following the system.
 */
function readStored(): ThemePreference {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
  } catch {
    // ignore — storage unavailable, fall back to system
  }
  return "system";
}

function writeStored(value: ThemePreference) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, value);
  } catch {
    // ignore — best-effort persistence
  }
}

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

// Default value so components (and tests) that render without the provider keep
// working — they simply follow the system until a provider supplies a choice.
const ThemePreferenceContext = createContext<ThemePreferenceContextValue>({
  preference: "system",
  setPreference: () => {},
});

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStored);

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({
      preference,
      setPreference: (next) => {
        setPreferenceState(next);
        writeStored(next);
      },
    }),
    [preference],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  return useContext(ThemePreferenceContext);
}
