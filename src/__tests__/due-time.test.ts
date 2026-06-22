import {
  DEFAULT_DUE_TIME,
  describeOneOffDue,
  dueAtFromTime,
  formatDueTime,
} from "@/features/chores/due-time";

describe("formatDueTime", () => {
  it("renders 24h times as friendly 12h labels", () => {
    expect(formatDueTime("16:00")).toBe("4:00 PM");
    expect(formatDueTime("08:00")).toBe("8:00 AM");
    expect(formatDueTime("00:00")).toBe("12:00 AM");
    expect(formatDueTime("12:00")).toBe("12:00 PM");
    expect(formatDueTime("17:30")).toBe("5:30 PM");
  });

  it("returns null for no deadline", () => {
    expect(formatDueTime(null)).toBeNull();
    expect(formatDueTime("")).toBeNull();
  });

  it("uses 4 PM as the default", () => {
    expect(formatDueTime(DEFAULT_DUE_TIME)).toBe("4:00 PM");
  });
});

describe("dueAtFromTime", () => {
  it("resolves to today at the chosen time when it's still ahead", () => {
    const now = new Date("2026-06-22T09:00:00");
    expect(dueAtFromTime("16:00", now)).toBe(new Date("2026-06-22T16:00:00").toISOString());
  });

  it("rolls to tomorrow when the time has already passed today", () => {
    const now = new Date("2026-06-22T18:00:00");
    expect(dueAtFromTime("16:00", now)).toBe(new Date("2026-06-23T16:00:00").toISOString());
  });

  it("returns null for Anytime", () => {
    expect(dueAtFromTime(null)).toBeNull();
  });
});

describe("describeOneOffDue", () => {
  it("says 'today' when the time is still ahead", () => {
    const now = new Date("2026-06-22T09:00:00");
    expect(describeOneOffDue("16:00", now)).toBe("Due today, 4:00 PM");
  });

  it("says 'tomorrow' when the time already passed today", () => {
    const now = new Date("2026-06-22T18:00:00");
    expect(describeOneOffDue("16:00", now)).toBe("Due tomorrow, 4:00 PM");
  });

  it("is null for Anytime", () => {
    expect(describeOneOffDue(null)).toBeNull();
  });
});
