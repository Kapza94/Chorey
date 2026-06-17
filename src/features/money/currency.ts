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

import { COUNTRY_CURRENCY, COUNTRIES } from "@/features/money/countries";

/**
 * Any ISO 4217 code. The four locales in `CURRENCIES` are hand-tuned; every
 * other currency is formatted from sensible defaults via `resolveCurrencyFormat`.
 */
export type CurrencyCode = string;

/** The locales whose formatting we've hand-set in `CURRENCIES`. */
export type TunedCurrencyCode = "USD" | "EUR" | "GBP" | "RSD";

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

/** Hand-tuned formats for the locales we've designed against. */
export const CURRENCIES: Record<TunedCurrencyCode, CurrencyFormat> = {
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

/**
 * ISO 4217 currencies with no minor unit — render whole numbers, no decimals.
 * (RSD is officially 2-decimal but Chorey shows it whole, kept in CURRENCIES.)
 */
const ZERO_DECIMAL_CURRENCIES = new Set<string>([
  "BIF", "CLP", "DJF", "GNF", "ISK", "JPY", "KMF", "KRW", "PYG",
  "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

/** ISO 4217 code → local glyph, taken from the bundled country dataset. */
const CURRENCY_SYMBOLS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const country of COUNTRIES) {
    if (!(country.cur in map)) {
      map[country.cur] = country.symbol;
    }
  }
  return map;
})();

const isTuned = (code: string): code is TunedCurrencyCode => code in CURRENCIES;

/**
 * Resolve a display format for any ISO 4217 code. Hand-tuned locales use their
 * exact format; everything else defaults to a leading symbol, 2 decimals, and
 * "," / "." separators (or 0 decimals for known no-minor-unit currencies).
 */
export function resolveCurrencyFormat(code: CurrencyCode): CurrencyFormat {
  if (isTuned(code)) {
    return CURRENCIES[code];
  }

  return {
    code,
    symbol: CURRENCY_SYMBOLS[code] ?? code,
    symbolPosition: "before",
    spaceBetweenSymbol: false,
    decimals: ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2,
    decimalSeparator: ".",
    groupSeparator: ",",
  };
}

/** True for any currency we can format — a tuned locale or a known ISO code. */
export function isKnownCurrency(code: string): boolean {
  return isTuned(code) || code in CURRENCY_SYMBOLS;
}

/** Resolve a currency from a country code, defaulting to USD for unknowns. */
export function currencyForCountry(countryCode: string | null | undefined): CurrencyCode {
  if (!countryCode) {
    return DEFAULT_CURRENCY;
  }

  return COUNTRY_CURRENCY[countryCode.trim().toUpperCase()] ?? DEFAULT_CURRENCY;
}

function resolveFormat(currency: CurrencyCode | CurrencyFormat): CurrencyFormat {
  return typeof currency === "string" ? resolveCurrencyFormat(currency) : currency;
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
