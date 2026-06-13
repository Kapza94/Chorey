import {
  CHOREY_ENTITLEMENT,
  entitlementFromCustomerInfo,
  toPlanOffers,
  type RcCustomerInfo,
  type RcOffering,
} from "@/features/entitlements/purchases";

describe("toPlanOffers", () => {
  it("maps a RevenueCat offering to monthly+yearly offers with store prices, monthly first", () => {
    const offering: RcOffering = {
      availablePackages: [
        {
          identifier: "$rc_annual",
          packageType: "ANNUAL",
          product: { priceString: "$39.99" },
        },
        {
          identifier: "$rc_monthly",
          packageType: "MONTHLY",
          product: { priceString: "$4.99" },
        },
      ],
    };

    expect(toPlanOffers(offering)).toEqual([
      { plan: "monthly", priceString: "$4.99", packageIdentifier: "$rc_monthly" },
      { plan: "yearly", priceString: "$39.99", packageIdentifier: "$rc_annual" },
    ]);
  });

  it("ignores package types we don't sell (weekly, lifetime, ...)", () => {
    const offering: RcOffering = {
      availablePackages: [
        { identifier: "w", packageType: "WEEKLY", product: { priceString: "$1.99" } },
        { identifier: "m", packageType: "MONTHLY", product: { priceString: "$4.99" } },
      ],
    };

    expect(toPlanOffers(offering)).toEqual([
      { plan: "monthly", priceString: "$4.99", packageIdentifier: "m" },
    ]);
  });

  it("returns no offers when the offering is null (RevenueCat not configured yet)", () => {
    expect(toPlanOffers(null)).toEqual([]);
  });

  it("keeps the first package when a plan type appears twice", () => {
    const offering: RcOffering = {
      availablePackages: [
        { identifier: "m1", packageType: "MONTHLY", product: { priceString: "$4.99" } },
        { identifier: "m2", packageType: "MONTHLY", product: { priceString: "$9.99" } },
      ],
    };

    expect(toPlanOffers(offering)).toEqual([
      { plan: "monthly", priceString: "$4.99", packageIdentifier: "m1" },
    ]);
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
