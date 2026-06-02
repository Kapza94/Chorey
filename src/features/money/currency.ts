/**
 * Locale-aware money formatting.
 *
 * Currency is chosen by the family's country at registration (see
 * `currencyForCountry`). Amounts are stored everywhere as integer **cents**
 * (1/100 of the major unit); the formatter renders them per-locale.
 *
 * Design reference (handoff README):
 *   - Serbia  → RSD `1.500 дин`  (0 decimals, grouped with ".", symbol AFTER)
 *   - US      → USD `$25.00`     (2 decimals, symbol before)
 *   - Eurozone→ EUR `€25,00`     (2 decimals, "," decimal separator, symbol before)
 *
 * This replaces the hard-coded `$` / `toFixed(2)` in the prototype.
 */

export type CurrencyCode = "USD" | "EUR" | "GBP" | "RSD";

export type CurrencyFormat = {
  code: CurrencyCode;
  symbol: string;
  /** where the symbol sits relative to the number */
  symbolPosition: "before" | "after";
  /** whether to put a space between the number and the symbol */
  spaceBetweenSymbol: boolean;
  /** number of fractional digits to show (0 for RSD, 2 for USD/EUR/GBP) */
  decimals: number;
  decimalSeparator: string;
  groupSeparator: string;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyFormat> = {
  USD: {
    code: "USD",
    symbol: "$",
    symbolPosition: "before",
    spaceBetweenSymbol: false,
    decimals: 2,
    decimalSeparator: ".",
    groupSeparator: ",",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    symbolPosition: "before",
    spaceBetweenSymbol: false,
    decimals: 2,
    decimalSeparator: ",",
    groupSeparator: ".",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    symbolPosition: "before",
    spaceBetweenSymbol: false,
    decimals: 2,
    decimalSeparator: ".",
    groupSeparator: ",",
  },
  RSD: {
    code: "RSD",
    symbol: "дин",
    symbolPosition: "after",
    spaceBetweenSymbol: true,
    decimals: 0,
    decimalSeparator: ",",
    groupSeparator: ".",
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

/** ISO 3166-1 alpha-2 country code → currency. Eurozone members map to EUR. */
const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  US: "USD",
  RS: "RSD", // Serbia
  GB: "GBP",
  // Eurozone (the subset most relevant to onboarding; extend as needed)
  AT: "EUR",
  BE: "EUR",
  DE: "EUR",
  ES: "EUR",
  FI: "EUR",
  FR: "EUR",
  GR: "EUR",
  IE: "EUR",
  IT: "EUR",
  NL: "EUR",
  PT: "EUR",
  SI: "EUR",
  SK: "EUR",
  HR: "EUR", // Croatia (adopted EUR 2023)
};

/** Resolve a currency from a country code, defaulting to USD for unknowns. */
export function currencyForCountry(countryCode: string | null | undefined): CurrencyCode {
  if (!countryCode) {
    return DEFAULT_CURRENCY;
  }

  return COUNTRY_TO_CURRENCY[countryCode.trim().toUpperCase()] ?? DEFAULT_CURRENCY;
}

function resolveFormat(currency: CurrencyCode | CurrencyFormat): CurrencyFormat {
  return typeof currency === "string" ? CURRENCIES[currency] : currency;
}

/** Group the integer part with the locale's thousands separator. */
function groupInteger(digits: string, groupSeparator: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
}

export type MoneyParts = {
  /** "-" for negatives, else "" */
  sign: string;
  /** symbol + grouped integer (e.g. "$12", "1.500") */
  lead: string;
  /** decimal separator + digits, plus a trailing symbol for "after" currencies
   *  (e.g. ".00", ",00", " дин"). Empty when there is nothing to render small. */
  fraction: string;
};

/**
 * Break a cents amount into the pieces a hero balance renders at two sizes:
 * a large `lead` (symbol + whole units) and a smaller `fraction` (cents and/or
 * a trailing symbol). `sign` carries the minus for negatives.
 */
export function formatMoneyParts(
  cents: number,
  currency: CurrencyCode | CurrencyFormat = DEFAULT_CURRENCY,
): MoneyParts {
  const fmt = resolveFormat(currency);
  const sign = cents < 0 ? "-" : "";
  const absCents = Math.abs(cents);

  // Convert cents → major units at the currency's precision.
  const factor = 10 ** fmt.decimals;
  const scaled = Math.round((absCents / 100) * factor);
  const integerPart = Math.floor(scaled / factor);
  const fractionPart = scaled - integerPart * factor;

  const grouped = groupInteger(String(integerPart), fmt.groupSeparator);
  const gap = fmt.spaceBetweenSymbol ? " " : "";

  const lead =
    fmt.symbolPosition === "before" ? `${fmt.symbol}${gap}${grouped}` : grouped;

  const decimals =
    fmt.decimals > 0
      ? fmt.decimalSeparator + String(fractionPart).padStart(fmt.decimals, "0")
      : "";
  const trailingSymbol =
    fmt.symbolPosition === "after" ? `${gap}${fmt.symbol}` : "";

  return { sign, lead, fraction: decimals + trailingSymbol };
}

/**
 * Format an integer cents amount for the given currency.
 *
 *   formatMoney(2500, "USD")  → "$25.00"
 *   formatMoney(2500, "EUR")  → "€25,00"
 *   formatMoney(150000, "RSD")→ "1.500 дин"
 *
 * For 0-decimal currencies (RSD) the sub-major remainder is rounded to the
 * nearest whole major unit.
 */
export function formatMoney(
  cents: number,
  currency: CurrencyCode | CurrencyFormat = DEFAULT_CURRENCY,
): string {
  const { sign, lead, fraction } = formatMoneyParts(cents, currency);

  return `${sign}${lead}${fraction}`;
}

/**
 * Format a signed delta with an explicit leading sign, e.g. earnings on the
 * kid Home screen turn into "+$2.50" when a chore is checked off.
 */
export function formatMoneyDelta(
  cents: number,
  currency: CurrencyCode | CurrencyFormat = DEFAULT_CURRENCY,
): string {
  if (cents <= 0) {
    return formatMoney(cents, currency);
  }

  return `+${formatMoney(cents, currency)}`;
}
