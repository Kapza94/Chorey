import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { ChevronRight, CreditCard, KeyRound, LogOut, Share2 } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  resolveCurrencyFormat,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/features/money/currency";
import {
  DEFAULT_SPLIT,
  MIN_GIVE_PCT,
  SPLIT_STEP,
  type Split,
} from "@/features/money/split";
import type { SettlementFrequency } from "@/features/household/household-actions";
import { ParentHeader, type ParentKid } from "@/features/parent-app/parent-primitives";

const BUDGET_STEP_CENTS = 500;
const BUDGET_MIN_CENTS = 500;

/** A kid's device sign-in code, joined to the kid for display. */
export type KidAccessCode = { kidId: string; accessCode: string };

type Props = {
  currency?: CurrencyCode;
  split?: Split;
  kids?: ParentKid[];
  accessCodes?: KidAccessCode[];
  /** one-line status, e.g. "Free trial · ends Jun 25, 2026" */
  subscriptionLabel?: string;
  onManageSubscription?: () => void;
  onChangeBudget?: (kidId: string, budgetCents: number) => void;
  onChangeCadence?: (kidId: string, cadence: SettlementFrequency) => void;
  onChangeSplit?: (split: Split) => void;
  onLogOut?: () => void;
  headerRight?: ReactNode;
};

export function ParentSettingsScreen({
  currency = DEFAULT_CURRENCY,
  split = DEFAULT_SPLIT,
  kids = [],
  accessCodes = [],
  subscriptionLabel,
  onManageSubscription,
  onChangeBudget,
  onChangeCadence,
  onChangeSplit,
  onLogOut,
  headerRight,
}: Props) {
  const { scheme, typography, palette, radius, toybox } = useChoreyTheme();

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
        <ParentHeader subtitle="Account" title="Settings." action={headerRight} />

        <View style={{ paddingHorizontal: 18 }}>
          {/* Budget per kid */}
          <Text
            style={[
              typography.text.overline,
              { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
            ]}
          >
            Budget per child
          </Text>
          <View style={{ gap: 10, marginBottom: 20 }}>
            {kids.map((kid) => (
              <BudgetCard
                key={kid.id}
                kid={kid}
                currency={currency}
                onChangeBudget={onChangeBudget}
                onChangeCadence={onChangeCadence}
              />
            ))}
            <Text
              style={[
                typography.text.caption,
                { color: scheme.fgFaint, paddingHorizontal: 4 },
              ]}
            >
              Chores add up toward the budget. You can still assign extra chores beyond it —
              anything over just keeps earning.
            </Text>
          </View>

          {/* The split */}
          <Text
            style={[
              typography.text.overline,
              { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
            ]}
          >
            The split
          </Text>
          <SplitEditor split={split} onChange={onChangeSplit} />

          {/* Subscription — one household plan; parents manage it here. */}
          {subscriptionLabel ? (
            <>
              <Text
                style={[
                  typography.text.overline,
                  { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
                ]}
              >
                Subscription
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Manage subscription"
                onPress={onManageSubscription}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: pressed ? scheme.bgSunken : scheme.bgModal,
                  borderColor: scheme.toy.border,
                  borderWidth: toybox.borderWidth,
                  ...(pressed ? null : scheme.toy.shadowSm),
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 20,
                })}
              >
                <CreditCard size={17} color={scheme.fgMuted} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.text.label, { color: scheme.fg }]}>
                    Chorey Family
                  </Text>
                  <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
                    {subscriptionLabel}
                  </Text>
                </View>
                <ChevronRight size={16} color={scheme.fgFaint} strokeWidth={2} />
              </Pressable>
            </>
          ) : null}

          {/* Kid sign-in codes — parents will lose these; keep them findable. */}
          <Text
            style={[
              typography.text.overline,
              { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
            ]}
          >
            Child sign-in codes
          </Text>
          <View
            style={{
              backgroundColor: scheme.bgModal,
              borderColor: scheme.toy.border,
              borderWidth: toybox.borderWidth,
              ...scheme.toy.shadowSm,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {accessCodes.length === 0 ? (
              <Text
                style={[
                  typography.text.caption,
                  { color: scheme.fgFaint, paddingHorizontal: 16, paddingVertical: 14 },
                ]}
              >
                Codes appear here once a child has one.
              </Text>
            ) : (
              accessCodes.map((entry, index) => {
                const kid = kids.find((candidate) => candidate.id === entry.kidId);

                return (
                  <View
                    key={entry.kidId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: index < accessCodes.length - 1 ? 1 : 0,
                      borderBottomColor: scheme.border,
                    }}
                  >
                    <KeyRound size={16} color={scheme.fgMuted} strokeWidth={2} />
                    <Text style={[typography.text.label, { flex: 1, color: scheme.fg }]}>
                      {kid?.name ?? "Child"}
                    </Text>
                    <Text
                      selectable
                      style={[
                        typography.text.money,
                        { color: scheme.fg, fontSize: 16, letterSpacing: 2 },
                      ]}
                    >
                      {entry.accessCode}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Share ${kid?.name ?? "child"}'s code`}
                      hitSlop={8}
                      onPress={() =>
                        Share.share({
                          message: `${kid?.name ?? "Your child"}'s Chorey join code: ${entry.accessCode}\n\nOpen Chorey, tap "Join as a child", and enter this code.`,
                        })
                      }
                      style={({ pressed }) => ({
                        width: 34,
                        height: 34,
                        borderRadius: 999,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: pressed ? scheme.bgSunken : "transparent",
                      })}
                    >
                      <Share2 size={16} color={scheme.fgMuted} strokeWidth={2} />
                    </Pressable>
                  </View>
                );
              })
            )}
            <Text
              style={[
                typography.text.caption,
                {
                  color: scheme.fgFaint,
                  paddingHorizontal: 16,
                  paddingBottom: 12,
                  paddingTop: accessCodes.length === 0 ? 0 : 10,
                },
              ]}
            >
              Children use their code to sign in on their own device.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={onLogOut}
            style={({ pressed }) => ({
              marginTop: 22,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 14,
              borderRadius: radius.md,
              backgroundColor: pressed ? scheme.bgSunken : scheme.bgModal,
              borderColor: scheme.toy.border,
              borderWidth: toybox.borderWidth,
              ...(pressed ? null : scheme.toy.shadowSm),
            })}
          >
            <LogOut size={17} color={palette.semantic.danger[600]} strokeWidth={2.2} />
            <Text
              style={[
                typography.text.label,
                { color: palette.semantic.danger[600], fontSize: 15 },
              ]}
            >
              Log out
            </Text>
          </Pressable>

          <Text
            style={{
              textAlign: "center",
              marginTop: 20,
              fontFamily: typography.family.display.medium,
              fontSize: 14,
              color: scheme.fgFaint,
            }}
          >
            chorey · v0.1
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function BudgetCard({
  kid,
  currency,
  onChangeBudget,
  onChangeCadence,
}: {
  kid: ParentKid;
  currency: CurrencyCode;
  onChangeBudget?: (kidId: string, budgetCents: number) => void;
  onChangeCadence?: (kidId: string, cadence: SettlementFrequency) => void;
}) {
  const { scheme, typography, radius, toybox } = useChoreyTheme();
  const tone = bucketTokens[kid.tone === "allowance" ? "spend" : kid.tone].ramp;
  const [budgetCents, setBudgetCents] = useState(kid.budgetCents);
  const [cadence, setCadence] = useState<SettlementFrequency>(kid.cadence);

  const setBudget = (nextCents: number) => {
    const clamped = Math.max(BUDGET_MIN_CENTS, nextCents);
    setBudgetCents(clamped);
    onChangeBudget?.(kid.id, clamped);
  };

  const step = (direction: 1 | -1) =>
    setBudget(budgetCents + direction * BUDGET_STEP_CENTS);

  const pickCadence = (next: SettlementFrequency) => {
    setCadence(next);
    onChangeCadence?.(kid.id, next);
  };

  return (
    <View
      style={{
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        ...scheme.toy.shadowSm,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.pill,
            backgroundColor: tone[200],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: typography.family.display.bold, fontSize: 16, color: tone[800] }}>
            {kid.name.trim().charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <Text style={[typography.text.h3, { flex: 1, color: scheme.fg, fontSize: 15 }]}>
          {kid.name}
        </Text>
        {/* cadence toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: scheme.bgSunken,
            borderRadius: radius.pill,
            padding: 3,
          }}
        >
          {(["weekly", "monthly"] as const).map((option) => {
            const selected = cadence === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={`${kid.name} ${option}`}
                accessibilityState={{ selected }}
                onPress={() => pickCadence(option)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor: selected ? scheme.bgModal : "transparent",
                  borderWidth: selected ? toybox.borderWidth : 0,
                  borderColor: scheme.toy.border,
                  ...(selected ? scheme.toy.shadowSm : null),
                }}
              >
                <Text
                  style={[
                    typography.text.caption,
                    {
                      color: selected ? scheme.fg : scheme.fgFaint,
                      fontWeight: "700",
                      textTransform: "capitalize",
                    },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View>
          <Text style={[typography.text.overline, { color: scheme.fgFaint, fontSize: 10 }]}>
            Budget cap
          </Text>
          <BudgetCapField
            cents={budgetCents}
            currency={currency}
            cadence={cadence}
            accent={tone[400]}
            onChange={setBudget}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <CapButton label="Decrease budget" symbol="−" onPress={() => step(-1)} />
          <CapButton label="Increase budget" symbol="+" onPress={() => step(1)} />
        </View>
      </View>
    </View>
  );
}

// Tappable budget cap: type a custom amount (whole major units) instead of only
// stepping ±5 — essential for low-value currencies like RSD. Stores back as cents.
function BudgetCapField({
  cents,
  currency,
  cadence,
  accent,
  onChange,
}: {
  cents: number;
  currency: CurrencyCode;
  cadence: SettlementFrequency;
  accent: string;
  onChange: (nextCents: number) => void;
}) {
  const { scheme, typography } = useChoreyTheme();
  const fmt = resolveCurrencyFormat(currency);
  const major = Math.round(cents / 100);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(major));

  const text = editing ? draft : String(major);
  const commit = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    onChange(Number.isFinite(parsed) && parsed > 0 ? parsed * 100 : cents);
  };

  const symbolGap = fmt.spaceBetweenSymbol ? " " : "";

  // Number row uses a tight, shared line-height on both the symbol and the input
  // so they sit on a common centre line — without this the input inherits h1's
  // ~50px lineHeight and the symbol floats above the digits.
  const NUM_SIZE = 26;
  const NUM_LH = 30;
  const numStyle = {
    color: scheme.fg,
    fontFamily: typography.text.h1.fontFamily,
    fontSize: NUM_SIZE,
    lineHeight: NUM_LH,
    includeFontPadding: false as const,
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
      {fmt.symbolPosition === "before" ? (
        <Text style={numStyle}>
          {fmt.symbol}
          {symbolGap}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel="Budget amount"
        value={text}
        onFocus={() => {
          setDraft(String(major));
          setEditing(true);
        }}
        onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        style={{
          ...numStyle,
          height: NUM_LH + 4,
          textAlignVertical: "center",
          paddingVertical: 0,
          paddingHorizontal: 0,
          // Room for every digit plus the caret — too tight and "90" clips to "9".
          minWidth: 32,
          width: Math.max(32, text.length * 18 + 10),
          borderBottomWidth: 2,
          borderBottomColor: accent,
        }}
      />
      {fmt.symbolPosition === "after" ? (
        <Text style={numStyle}>
          {symbolGap}
          {fmt.symbol}
        </Text>
      ) : null}
      <Text style={[typography.text.bodySm, { color: scheme.fgFaint }]}>
        / {cadence === "monthly" ? "mo" : "wk"}
      </Text>
    </View>
  );
}

function CapButton({
  label,
  symbol,
  onPress,
}: {
  label: string;
  symbol: string;
  onPress: () => void;
}) {
  const { scheme, palette, radius } = useChoreyTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 34,
        height: 34,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: palette.border.mid,
        backgroundColor: scheme.bgPage,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700", color: scheme.fg, lineHeight: 22 }}>
        {symbol}
      </Text>
    </Pressable>
  );
}

// Editable split: Spend and Giving step ±5; Savings is the auto-balanced
// remainder; Giving can't drop below MIN_GIVE_PCT. Controlled by the `split`
// prop — `onChange` updates it upstream (and persists). 40/40/20 is the default
// every household starts on.
function SplitEditor({
  split,
  onChange,
}: {
  split: Split;
  onChange?: (next: Split) => void;
}) {
  const { scheme, typography, radius, toybox } = useChoreyTheme();
  const editable = !!onChange;

  const clampPct = (value: number, max: number) => Math.max(0, Math.min(max, value));

  const stepSpend = (delta: number) => {
    const spend = clampPct(split.spend + delta, 100 - split.give);
    onChange?.({ spend, give: split.give, save: 100 - spend - split.give });
  };
  const stepGive = (delta: number) => {
    const give = Math.max(MIN_GIVE_PCT, Math.min(100 - split.spend, split.give + delta));
    onChange?.({ spend: split.spend, give, save: 100 - split.spend - give });
  };

  return (
    <View
      style={{
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        ...scheme.toy.shadowSm,
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 16,
        marginBottom: 16,
      }}
    >
      <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>How earnings split</Text>
      <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, marginTop: 4 }]}>
        {split.spend} / {split.save} / {split.give}
      </Text>
      <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginTop: 4 }]}>
        We recommend 40 / 40 / 20. Nudge Spend and Giving — Savings balances the rest.
        Giving always stays at least {MIN_GIVE_PCT}%.
      </Text>

      <View
        style={{
          flexDirection: "row",
          height: 14,
          borderRadius: radius.pill,
          overflow: "hidden",
          gap: 2,
          marginTop: 14,
        }}
      >
        <View style={{ flex: split.spend, backgroundColor: bucketTokens.spend.ramp[400] }} />
        <View style={{ flex: split.save, backgroundColor: bucketTokens.savings.ramp[400] }} />
        <View style={{ flex: split.give, backgroundColor: bucketTokens.giving.ramp[400] }} />
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
        <SplitColumn
          tone="spend"
          label="Spend"
          value={split.spend}
          onStep={editable ? stepSpend : undefined}
        />
        <SplitColumn tone="savings" label="Save" value={split.save} hint="auto" />
        <SplitColumn
          tone="giving"
          label="Give"
          value={split.give}
          onStep={editable ? stepGive : undefined}
        />
      </View>
    </View>
  );
}

function SplitColumn({
  tone,
  label,
  value,
  hint,
  onStep,
}: {
  tone: "spend" | "savings" | "giving";
  label: string;
  value: number;
  hint?: string;
  onStep?: (delta: number) => void;
}) {
  const { typography, scheme, bucketInk } = useChoreyTheme();
  const tintKey = tone === "spend" ? "allowance" : tone;
  const ink = bucketInk(tone);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: scheme.tint[tintKey],
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <Text style={[typography.text.overline, { color: ink, fontSize: 10 }]}>{label}</Text>
      <Text
        style={{
          fontFamily: typography.family.display.semibold,
          fontSize: 22,
          color: ink,
          marginTop: 2,
        }}
      >
        {value}
        <Text style={{ fontSize: 12 }}>%</Text>
      </Text>
      {onStep ? (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          <SplitStep label={`Decrease ${label}`} symbol="−" ink={ink} onPress={() => onStep(-SPLIT_STEP)} />
          <SplitStep label={`Increase ${label}`} symbol="+" ink={ink} onPress={() => onStep(SPLIT_STEP)} />
        </View>
      ) : hint ? (
        <Text style={[typography.text.caption, { color: ink, opacity: 0.7, marginTop: 8 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

function SplitStep({
  label,
  symbol,
  ink,
  onPress,
}: {
  label: string;
  symbol: string;
  ink: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flex: 1,
        height: 28,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: ink,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "800", color: ink, lineHeight: 18 }}>{symbol}</Text>
    </Pressable>
  );
}
