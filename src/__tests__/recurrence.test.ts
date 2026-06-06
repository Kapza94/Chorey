import { periodKey, periodStart, type Recurrence } from "@/features/chores/recurrence";

const at = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

describe("periodKey", () => {
  it("keys a daily recurrence by the exact UTC day", () => {
    expect(periodKey("daily", at("2026-06-05"))).toBe("2026-06-05");
    expect(periodKey("daily", at("2026-06-06"))).toBe("2026-06-06");
  });

  it("keys a monthly recurrence by the first of the month", () => {
    expect(periodKey("monthly", at("2026-06-05"))).toBe("2026-06-01");
    expect(periodKey("monthly", at("2026-06-30"))).toBe("2026-06-01");
    expect(periodKey("monthly", at("2026-07-01"))).toBe("2026-07-01");
  });

  it("keys a weekly recurrence by the Monday of the week", () => {
    // The key must always land on a Monday.
    const key = periodKey("weekly", at("2026-06-05"));
    expect(new Date(`${key}T00:00:00.000Z`).getUTCDay()).toBe(1);

    // Dates within one Mon–Sun week share a key.
    const monday = periodKey("weekly", at("2026-06-01"));
    expect(periodKey("weekly", at("2026-06-07"))).toBe(monday); // same week (Sunday)
    // The next week differs.
    expect(periodKey("weekly", at("2026-06-08"))).not.toBe(monday);
  });
});

describe("periodStart", () => {
  it("returns a Date at UTC midnight of the period start", () => {
    const start = periodStart("monthly" as Recurrence, at("2026-06-15"));
    expect(start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });
});
