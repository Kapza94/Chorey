import {
  currencyForCountry,
  formatMoney,
  formatMoneyDelta,
} from "@/features/money/currency";

describe("currency formatting", () => {
  it("formats USD with a leading symbol and 2 decimals", () => {
    expect(formatMoney(2500, "USD")).toBe("$25.00");
    expect(formatMoney(0, "USD")).toBe("$0.00");
    expect(formatMoney(123456, "USD")).toBe("$1,234.56");
  });

  it("formats EUR with a comma decimal separator", () => {
    expect(formatMoney(2500, "EUR")).toBe("€25,00");
    expect(formatMoney(123456, "EUR")).toBe("€1.234,56");
  });

  it("formats RSD with 0 decimals and the ISO code, not 'din'", () => {
    // 1500 dinars stored as 150000 cents
    expect(formatMoney(150000, "RSD")).toBe("RSD 1.500");
    expect(formatMoney(2500, "RSD")).toBe("RSD 25");
  });

  it("rounds sub-major remainders for 0-decimal currencies", () => {
    expect(formatMoney(150050, "RSD")).toBe("RSD 1.501"); // 1500.50 → 1501
  });

  it("renders untuned currencies with their ISO code, not a local glyph", () => {
    expect(formatMoney(10000, "ZAR")).toBe("ZAR 100.00");
    expect(formatMoney(150000, "JPY")).toBe("JPY 1,500"); // 0-decimal
  });

  it("renders negatives with a leading minus", () => {
    expect(formatMoney(-2500, "USD")).toBe("-$25.00");
  });

  it("adds an explicit + for positive deltas", () => {
    expect(formatMoneyDelta(250, "USD")).toBe("+$2.50");
    expect(formatMoneyDelta(0, "USD")).toBe("$0.00");
    expect(formatMoneyDelta(-250, "USD")).toBe("-$2.50");
  });

  it("resolves currency from country, defaulting to USD", () => {
    expect(currencyForCountry("RS")).toBe("RSD");
    expect(currencyForCountry("us")).toBe("USD");
    expect(currencyForCountry("DE")).toBe("EUR");
    expect(currencyForCountry("ZZ")).toBe("USD");
    expect(currencyForCountry(null)).toBe("USD");
  });
});
