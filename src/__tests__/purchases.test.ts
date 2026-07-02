import {
  annualDeal,
  CHOREY_ENTITLEMENT,
  entitlementFromCustomerInfo,
  formatStorePrice,
  mockPaywallOffers,
  toPlanOffers,
  type PlanOffer,
  type RcCustomerInfo,
  type RcOffering,
} from "@/features/entitlements/purchases";

const usd = (price: number) => ({
  priceString: `$${price.toFixed(2)}`,
  price,
  currencyCode: "USD",
});

describe("toPlanOffers", () => {
  it("maps a RevenueCat offering to monthly+annual offers with store prices, monthly first", () => {
    const offering: RcOffering = {
      availablePackages: [
        { identifier: "$rc_annual", packageType: "ANNUAL", product: usd(39.99) },
        { identifier: "$rc_monthly", packageType: "MONTHLY", product: usd(4.99) },
      ],
    };

    expect(toPlanOffers(offering)).toEqual([
      {
        plan: "monthly",
        priceString: "$4.99",
        priceAmount: 4.99,
        currencyCode: "USD",
        packageIdentifier: "$rc_monthly",
      },
      {
        plan: "annual",
        priceString: "$39.99",
        priceAmount: 39.99,
        currencyCode: "USD",
        packageIdentifier: "$rc_annual",
      },
    ]);
  });

  it("ignores package types we don't sell (lifetime, ...)", () => {
    const offering: RcOffering = {
      availablePackages: [
        { identifier: "l", packageType: "LIFETIME", product: usd(99.99) },
        { identifier: "m", packageType: "MONTHLY", product: usd(4.99) },
      ],
    };

    expect(toPlanOffers(offering)).toEqual([
      {
        plan: "monthly",
        priceString: "$4.99",
        priceAmount: 4.99,
        currencyCode: "USD",
        packageIdentifier: "m",
      },
    ]);
  });

  it("returns no offers when the offering is null (RevenueCat not configured yet)", () => {
    expect(toPlanOffers(null)).toEqual([]);
  });

  it("keeps the first package when a plan type appears twice", () => {
    const offering: RcOffering = {
      availablePackages: [
        { identifier: "m1", packageType: "MONTHLY", product: usd(4.99) },
        { identifier: "m2", packageType: "MONTHLY", product: usd(9.99) },
      ],
    };

    expect(toPlanOffers(offering)).toEqual([
      {
        plan: "monthly",
        priceString: "$4.99",
        priceAmount: 4.99,
        currencyCode: "USD",
        packageIdentifier: "m1",
      },
    ]);
  });
});

describe("annualDeal", () => {
  const offer = (plan: "monthly" | "annual", amount: number): PlanOffer => ({
    plan,
    priceString: `$${amount.toFixed(2)}`,
    priceAmount: amount,
    currencyCode: "USD",
    packageIdentifier: plan,
  });

  it("derives compare price, savings, and months free from the live prices", () => {
    // 12 × 4.99 = 59.88; annual 39.99 → save 19.89; 12 − 39.99/4.99 ≈ 4 months.
    expect(annualDeal(offer("monthly", 4.99), offer("annual", 39.99))).toEqual({
      comparePrice: "$59.88",
      savings: "$19.89",
      monthsFree: 4,
    });
  });

  it("returns null until both prices are loaded", () => {
    expect(annualDeal(undefined, offer("annual", 39.99))).toBeNull();
    expect(annualDeal(offer("monthly", 4.99), undefined)).toBeNull();
  });

  it("drops savings/months free when annual isn't actually cheaper", () => {
    const deal = annualDeal(offer("monthly", 4.99), offer("annual", 59.99));
    expect(deal?.savings).toBeNull();
    expect(deal?.monthsFree).toBeNull();
  });
});

describe("mockPaywallOffers", () => {
  it("builds monthly+annual USD offers from the env string", () => {
    expect(mockPaywallOffers("4.99,39.99")).toEqual([
      {
        plan: "monthly",
        priceString: "$4.99",
        priceAmount: 4.99,
        currencyCode: "USD",
        packageIdentifier: "mock_monthly",
      },
      {
        plan: "annual",
        priceString: "$39.99",
        priceAmount: 39.99,
        currencyCode: "USD",
        packageIdentifier: "mock_annual",
      },
    ]);
  });

  it("returns null when unset or malformed", () => {
    expect(mockPaywallOffers(undefined)).toBeNull();
    expect(mockPaywallOffers("")).toBeNull();
    expect(mockPaywallOffers("4.99")).toBeNull();
  });
});

describe("formatStorePrice", () => {
  it("formats in the reported store currency", () => {
    expect(formatStorePrice(59.88, "USD")).toBe("$59.88");
  });

  it("falls back to code + amount for a malformed currency code", () => {
    // Intl accepts any well-formed 3-letter code, so only a malformed one (here
    // 2 letters) throws and exercises the fallback path.
    expect(formatStorePrice(59.88, "US")).toBe("US 59.88");
  });
});

describe("entitlementFromCustomerInfo", () => {
  it("reports active with its expiry when the Chorey entitlement is present", () => {
    const info: RcCustomerInfo = {
      entitlements: {
        active: {
          [CHOREY_ENTITLEMENT]: { expirationDate: "2027-01-01T00:00:00Z" },
        },
      },
    };

    expect(entitlementFromCustomerInfo(info)).toEqual({
      isActive: true,
      expiresAt: "2027-01-01T00:00:00Z",
    });
  });

  it("reports inactive when the entitlement isn't active", () => {
    const info: RcCustomerInfo = { entitlements: { active: {} } };

    expect(entitlementFromCustomerInfo(info)).toEqual({
      isActive: false,
      expiresAt: null,
    });
  });

  it("treats a null customer info as inactive", () => {
    expect(entitlementFromCustomerInfo(null)).toEqual({
      isActive: false,
      expiresAt: null,
    });
  });
});
