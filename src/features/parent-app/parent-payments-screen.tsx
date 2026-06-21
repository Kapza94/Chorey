import { useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Check, Sparkles, Wallet } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { useKeyboardHeight } from "@/components/use-keyboard-height";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import { clampRewardInput, formatReward, parseRewardCents } from "@/features/chores/money";
import type { PayoutMethod } from "@/features/payments/payment-actions";
import type { SettlementPeriod } from "@/features/settlement/settlement-actions";
import { ParentHeader } from "@/features/parent-app/parent-primitives";

export type DuePayout = {
  id: string;
  name: string;
  tone: "allowance" | "savings" | "giving";
  /** gross all-time earnings (positive ledger events only). */
  earnedCents: number;
  /** net Spend balance — the only money a parent hands over. */
  spendCents: number;
  savingsCents: number;
  givingCents: number;
  choresDone: number;
  cadence: "weekly" | "monthly";
};

/**
 * What a parent hands over: the kid's net Spend balance. Savings stays saved
 * and Giving goes to their cause — neither is ever paid out in cash.
 */
export function owedCents(kid: { spendCents: number }) {
  return Math.max(0, kid.spendCents);
}

export type PayoutHistoryRow = {
  id: string;
  kidName: string;
  tone: "allowance" | "savings" | "giving";
  dateLabel: string;
  method: PayoutMethod;
  /** for `other` payouts: what the kid was actually given (e.g. "Gift"). */
  detail?: string | null;
  amountCents: number;
};

// No bank transfer for now — parents pay in cash or with something else.
const METHODS: { id: PayoutMethod; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "other", label: "Other" },
];

// Preset "other" payouts; the last option reveals a free-text field.
const OTHER_PRESETS = ["Gift", "Treat", "Toy", "Voucher"];
const OTHER_CUSTOM = "Something else";

function methodLabel(row: Pick<PayoutHistoryRow, "method" | "detail">) {
  if (row.method === "other") {
    return row.detail ? `Other · ${row.detail}` : "Other";
  }
  return METHODS.find((m) => m.id === row.method)?.label ?? "Cash";
}

type Props = {
  currency?: CurrencyCode;
  due?: DuePayout[];
  history?: PayoutHistoryRow[];
  thisMonthCents?: number;
  settlementPeriod?: SettlementPeriod | null;
  onMarkPaid?: (
    kidId: string,
    amountCents: number,
    method: PayoutMethod,
    detail?: string,
  ) => void;
  onMarkAllSettled?: () => void;
  headerRight?: ReactNode;
};

export function ParentPaymentsScreen({
  currency = DEFAULT_CURRENCY,
  due = [],
  history = [],
  thisMonthCents = 0,
  settlementPeriod,
  onMarkPaid,
  onMarkAllSettled,
  headerRight,
}: Props) {
  const { scheme, typography, palette, radius, bucketInk, toybox } = useChoreyTheme();
  const [sheetKid, setSheetKid] = useState<DuePayout | null>(null);

  // Only kids who are still owed money show in "due"; the rest are paid up.
  const owing = due.filter((kid) => owedCents(kid) > 0);
  const dueTotal = owing.reduce((sum, kid) => sum + owedCents(kid), 0);
  // Nothing to settle until at least one child has actually earned something —
  // a zero-earnings period has no money to hand over, so settling is disabled.
  const hasEarnings = due.some((kid) => kid.earnedCents > 0);

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: 120 }}
        style={{ flex: 1 }}
      >
        <ParentHeader subtitle="Off-app payouts" title="Payments." action={headerRight} />

        {/* Explainer */}
        <View
          style={{
            marginHorizontal: 18,
            marginBottom: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: scheme.tint.info,
            borderRadius: radius.sm,
            flexDirection: "row",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Sparkles size={16} color={palette.semantic.info[600]} strokeWidth={2.2} />
          <Text style={[typography.text.caption, { flex: 1, color: scheme.fgMuted }]}>
            Only Spend leaves the app — Savings stays saved and Giving goes to their
            cause. Pay it out however you like; Chorey keeps the record.
          </Text>
        </View>

        {settlementPeriod ? (
          <SettlementCard
            period={settlementPeriod}
            hasEarnings={hasEarnings}
            onMarkAllSettled={onMarkAllSettled}
          />
        ) : null}

        <SectionLabel>Ready to pay out</SectionLabel>

        {owing.length === 0 ? (
          <View
            style={{
              marginHorizontal: 18,
              paddingHorizontal: 18,
              paddingVertical: 22,
              alignItems: "center",
              backgroundColor: scheme.bgModal,
              borderColor: scheme.toy.border,
              borderWidth: toybox.borderWidth,
              ...scheme.toy.shadowSm,
              borderRadius: 16,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.pill,
                backgroundColor: bucketTokens.giving.ramp[200],
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Check size={22} color={bucketTokens.giving.ramp[800]} strokeWidth={3} />
            </View>
            <Text style={[typography.text.h3, { color: scheme.fg }]}>All paid up.</Text>
            <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 2 }]}>
              Nothing owed this period.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10, paddingHorizontal: 18 }}>
            {owing.map((kid) => (
              <DueCard
                key={kid.id}
                kid={kid}
                currency={currency}
                onMarkPaid={() => setSheetKid(kid)}
              />
            ))}
          </View>
        )}

        {owing.length > 0 ? (
          <View
            style={{
              marginHorizontal: 18,
              marginTop: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: scheme.bgSunken,
              borderRadius: radius.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={[typography.text.bodySm, { color: scheme.fgMuted }]}>
              Total to pay out
            </Text>
            <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 22 }]}>
              {formatMoney(dueTotal, currency)}
            </Text>
          </View>
        ) : null}

        {/* History */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            paddingHorizontal: 22,
            paddingTop: 26,
            paddingBottom: 8,
          }}
        >
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
            Payout history
          </Text>
          <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
            {formatMoney(thisMonthCents, currency)} this month
          </Text>
        </View>

        <View
          style={{
            marginHorizontal: 18,
            backgroundColor: scheme.bgModal,
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            ...scheme.toy.shadowSm,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {history.map((row, index) => {
            const bucketKey = row.tone === "allowance" ? "spend" : row.tone;

            return (
              <View
                key={row.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  borderBottomWidth: index < history.length - 1 ? 1 : 0,
                  borderBottomColor: scheme.border,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: radius.pill,
                    backgroundColor: scheme.tint[row.tone === "allowance" ? "allowance" : row.tone],
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Wallet size={16} color={bucketInk(bucketKey)} strokeWidth={2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[typography.text.label, { color: scheme.fg }]}>{row.kidName}</Text>
                  <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
                    {row.dateLabel} · {methodLabel(row)}
                  </Text>
                </View>
                <Text style={[typography.text.money, { fontSize: 14, color: scheme.fg }]}>
                  {formatMoney(row.amountCents, currency)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <MarkPaidSheet
        kid={sheetKid}
        currency={currency}
        onClose={() => setSheetKid(null)}
        onConfirm={(amountCents, method, detail) => {
          if (sheetKid) {
            onMarkPaid?.(sheetKid.id, amountCents, method, detail);
          }
          setSheetKid(null);
        }}
      />
    </View>
  );

  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <Text
        style={[
          typography.text.overline,
          { color: scheme.fgFaint, paddingHorizontal: 22, paddingBottom: 8 },
        ]}
      >
        {children}
      </Text>
    );
  }
}

const PERIOD_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function periodDay(iso: string): string {
  const date = new Date(iso);
  return `${PERIOD_MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

function SettlementCard({
  period,
  hasEarnings,
  onMarkAllSettled,
}: {
  period: SettlementPeriod;
  hasEarnings: boolean;
  onMarkAllSettled?: () => void;
}) {
  const { scheme, typography, palette, radius, bucketInk, toybox } = useChoreyTheme();
  const buckets: { key: "spend" | "savings" | "giving"; label: string }[] = [
    { key: "spend", label: "Spend" },
    { key: "savings", label: "Save" },
    { key: "giving", label: "Give" },
  ];
  const allSettled = buckets.every(
    (bucket) => period.bucketStatuses[bucket.key] === "settled",
  );

  return (
    <View
      style={{
        marginHorizontal: 18,
        marginBottom: 16,
        padding: 16,
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        ...scheme.toy.shadowSm,
        borderRadius: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>
          {period.frequency === "monthly" ? "This month" : "This week"}
        </Text>
        <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
          {periodDay(period.startsOn)} – {periodDay(period.endsOn)}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        {buckets.map((bucket) => {
          const settled = period.bucketStatuses[bucket.key] === "settled";
          return (
            <View
              key={bucket.key}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                paddingVertical: 8,
                borderRadius: radius.sm,
                backgroundColor: settled ? scheme.tint.giving : scheme.bgSunken,
              }}
            >
              {settled ? (
                <Check size={13} color={bucketInk("giving")} strokeWidth={3} />
              ) : null}
              <Text
                style={[
                  typography.text.label,
                  { color: settled ? bucketInk("giving") : scheme.fgMuted, fontSize: 12 },
                ]}
              >
                {bucket.label}
              </Text>
            </View>
          );
        })}
      </View>

      {!hasEarnings ? (
        <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 12 }]}>
          Nothing to settle yet — no earnings this period.
        </Text>
      ) : allSettled ? (
        <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 12 }]}>
          Period settled
        </Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark all settled"
          onPress={onMarkAllSettled}
          style={({ pressed }) => ({
            marginTop: 12,
            alignItems: "center",
            paddingVertical: 11,
            borderRadius: radius.pill,
            backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
          })}
        >
          <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 14 }]}>
            Mark all settled
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function DueCard({
  kid,
  currency,
  onMarkPaid,
}: {
  kid: DuePayout;
  currency: CurrencyCode;
  onMarkPaid: () => void;
}) {
  const { scheme, typography, palette, radius, toybox } = useChoreyTheme();
  const tone = bucketTokens[kid.tone === "allowance" ? "spend" : kid.tone].ramp;
  const allowance = bucketTokens.spend.ramp;
  const savings = bucketTokens.savings.ramp;
  const giving = bucketTokens.giving.ramp;

  return (
    <View
      style={{
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        ...scheme.toy.shadowSm,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.pill,
            backgroundColor: tone[200],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: typography.family.display.bold,
              fontSize: 19,
              color: tone[800],
            }}
          >
            {kid.name.trim().charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>{kid.name}</Text>
          <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
            {formatMoney(kid.earnedCents, currency)} earned all-time
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 26 }]}>
            {formatMoney(owedCents(kid), currency)}
          </Text>
          <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 2 }]}>
            Spend to hand over
          </Text>
        </View>
      </View>

      {/* split mini */}
      <View
        style={{
          flexDirection: "row",
          gap: 14,
          paddingBottom: 12,
          marginBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: scheme.border,
        }}
      >
        <SplitDot color={allowance[400]} label="spend" value={formatMoney(kid.spendCents, currency)} />
        <SplitDot color={savings[400]} label="save" value={formatMoney(kid.savingsCents, currency)} />
        <SplitDot color={giving[400]} label="give" value={formatMoney(kid.givingCents, currency)} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mark ${kid.name} as paid`}
        onPress={onMarkPaid}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 12,
          borderRadius: radius.pill,
          backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
        })}
      >
        <Wallet size={16} color={palette.cream[4]} strokeWidth={2} />
        <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 14 }]}>
          Mark as paid
        </Text>
      </Pressable>
    </View>
  );
}

function SplitDot({ color, label, value }: { color: string; label: string; value: string }) {
  const { scheme, typography } = useChoreyTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ width: 7, height: 7, borderRadius: 9, backgroundColor: color }} />
      <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
        <Text style={{ fontWeight: "700", color: scheme.fg }}>{value}</Text> {label}
      </Text>
    </View>
  );
}

function MarkPaidSheet({
  kid,
  currency,
  onClose,
  onConfirm,
}: {
  kid: DuePayout | null;
  currency: CurrencyCode;
  onClose: () => void;
  onConfirm: (amountCents: number, method: PayoutMethod, detail?: string) => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const keyboardHeight = useKeyboardHeight();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PayoutMethod>("cash");
  const [otherChoice, setOtherChoice] = useState<string>(OTHER_PRESETS[0]);
  const [otherText, setOtherText] = useState("");

  // Reset the form whenever a new kid opens the sheet. Default to what's owed.
  const visible = kid != null;
  const amountValue = amount || (kid ? formatReward(owedCents(kid)) : "");

  let amountCents = 0;
  try {
    amountCents = parseRewardCents(amountValue);
  } catch {
    amountCents = 0;
  }

  // A payout comes out of the kid's Spend bucket, so it can't exceed it.
  const capCents = kid ? owedCents(kid) : 0;
  const overCap = amountCents > capCents;
  const canConfirm = amountCents > 0 && !overCap;

  // For an `other` payout, the detail is the preset label, or the free text the
  // parent typed under "Something else".
  const detail =
    method === "other"
      ? otherChoice === OTHER_CUSTOM
        ? otherText.trim() || undefined
        : otherChoice
      : undefined;

  const resetForm = () => {
    setAmount("");
    setMethod("cash");
    setOtherChoice(OTHER_PRESETS[0]);
    setOtherText("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={() => {
          resetForm();
          onClose();
        }}
        style={{ flex: 1, backgroundColor: "rgba(42, 32, 24, 0.32)" }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: keyboardHeight,
          backgroundColor: scheme.bgModal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 22,
          paddingTop: 14,
          paddingBottom: 30,
          ...scheme.shadow.lg,
        }}
      >
        {/* Tapping the grabber dismisses — with the number pad up the backdrop
            scrolls off-screen, so this is the reliable way out. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => {
            resetForm();
            onClose();
          }}
          hitSlop={12}
          style={{
            width: 38,
            height: 4,
            borderRadius: radius.pill,
            backgroundColor: palette.border.strong,
            alignSelf: "center",
            marginBottom: 16,
          }}
        />
        <Text style={[typography.text.h2, { color: scheme.fg, fontSize: 24, marginBottom: 4 }]}>
          Pay {kid?.name}.
        </Text>
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginBottom: 18 }]}>
          Confirm once you&apos;ve handed over the money. This only records it — no transfer
          happens in the app.
        </Text>

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 7 }]}>
          Amount
        </Text>
        <View style={{ marginBottom: 16, justifyContent: "center" }}>
          <TextInput
            accessibilityLabel="Payout amount"
            keyboardType="decimal-pad"
            value={amountValue}
            onChangeText={(raw) => setAmount(clampRewardInput(raw))}
            style={{
              backgroundColor: scheme.bgPage,
              borderColor: palette.border.mid,
              borderWidth: 1.5,
              borderRadius: radius.sm,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontFamily: typography.family.body.bold,
              fontSize: 18,
              color: scheme.fg,
            }}
          />
        </View>
        {overCap && kid ? (
          <Text
            style={[
              typography.text.caption,
              { color: palette.semantic.danger[600], marginTop: -10, marginBottom: 14 },
            ]}
          >
            That&apos;s more than {kid.name}&apos;s {formatMoney(capCents, currency)} Spend
            balance.
          </Text>
        ) : null}

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 7 }]}>
          How you paid
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: method === "other" ? 14 : 22 }}>
          {METHODS.map((option) => {
            const selected = option.id === method;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected }}
                onPress={() => setMethod(option.id)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  paddingHorizontal: 6,
                  borderRadius: radius.sm,
                  alignItems: "center",
                  backgroundColor: selected ? bucketTokens.spend.ramp[200] : scheme.bgPage,
                  borderWidth: 1.5,
                  borderColor: selected ? bucketTokens.spend.ramp[400] : palette.border.mid,
                }}
              >
                <Text
                  style={[
                    typography.text.label,
                    { color: selected ? bucketTokens.spend.ramp[800] : scheme.fgMuted, fontSize: 13 },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {method === "other" ? (
          <View style={{ marginBottom: 22 }}>
            <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 7 }]}>
              What did you give?
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[...OTHER_PRESETS, OTHER_CUSTOM].map((preset) => {
                const selected = preset === otherChoice;
                return (
                  <Pressable
                    key={preset}
                    accessibilityRole="button"
                    accessibilityLabel={preset}
                    accessibilityState={{ selected }}
                    onPress={() => setOtherChoice(preset)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: radius.sm,
                      backgroundColor: selected ? bucketTokens.spend.ramp[200] : scheme.bgPage,
                      borderWidth: 1.5,
                      borderColor: selected ? bucketTokens.spend.ramp[400] : palette.border.mid,
                    }}
                  >
                    <Text
                      style={[
                        typography.text.label,
                        {
                          color: selected ? bucketTokens.spend.ramp[800] : scheme.fgMuted,
                          fontSize: 13,
                        },
                      ]}
                    >
                      {preset}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {otherChoice === OTHER_CUSTOM ? (
              <TextInput
                accessibilityLabel="What did you give?"
                value={otherText}
                onChangeText={setOtherText}
                placeholder="e.g. Lego set"
                placeholderTextColor={scheme.fgFaint}
                style={{
                  marginTop: 10,
                  backgroundColor: scheme.bgPage,
                  borderColor: palette.border.mid,
                  borderWidth: 1.5,
                  borderRadius: radius.sm,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  fontFamily: typography.family.body.regular,
                  fontSize: 15,
                  color: scheme.fg,
                }}
              />
            ) : null}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Confirm payout"
          accessibilityState={{ disabled: !canConfirm }}
          onPress={() => {
            if (!canConfirm) {
              return;
            }
            onConfirm(amountCents, method, detail);
            resetForm();
          }}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 15,
            borderRadius: radius.pill,
            backgroundColor: pressed && canConfirm ? palette.accent[800] : palette.accent[600],
            opacity: canConfirm ? 1 : 0.5,
          })}
        >
          <Check size={17} color={palette.cream[4]} strokeWidth={3} />
          <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 16 }]}>
            Mark {formatMoney(amountCents, currency)} paid
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
