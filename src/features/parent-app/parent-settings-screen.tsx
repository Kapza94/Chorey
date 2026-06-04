import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/features/money/currency";
import { DEFAULT_SPLIT, type Split } from "@/features/money/split";
import type { SettlementFrequency } from "@/features/household/household-actions";
import { ParentHeader, type ParentKid } from "@/features/parent-app/parent-primitives";

const BUDGET_STEP_CENTS = 500;
const BUDGET_MIN_CENTS = 500;

type GeneralRow = { label: string; meta: string };

type Props = {
  currency?: CurrencyCode;
  split?: Split;
  kids?: ParentKid[];
  generalRows?: GeneralRow[];
  onChangeBudget?: (kidId: string, budgetCents: number) => void;
  onChangeCadence?: (kidId: string, cadence: SettlementFrequency) => void;
  onEditSplits?: () => void;
};

const DEFAULT_GENERAL: GeneralRow[] = [
  { label: "Charities kids can give to", meta: "3 picked" },
  { label: "Pay-out day", meta: "Sunday" },
  { label: "Notifications", meta: "On" },
  { label: "Dark mode", meta: "Auto" },
];

export function ParentSettingsScreen({
  currency = DEFAULT_CURRENCY,
  split = DEFAULT_SPLIT,
  kids = [],
  generalRows = DEFAULT_GENERAL,
  onChangeBudget,
  onChangeCadence,
  onEditSplits,
}: Props) {
  const { scheme, typography, palette, radius } = useChoreyTheme();

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} style={{ flex: 1 }}>
        <ParentHeader subtitle="Account" title="Settings." />

        <View style={{ paddingHorizontal: 18 }}>
          {/* Budget per kid */}
          <Text
            style={[
              typography.text.overline,
              { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
            ]}
          >
            Budget per kid
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
          <View
            style={{
              backgroundColor: scheme.bgRaised,
              borderColor: scheme.border,
              borderWidth: 1,
              borderRadius: 18,
              paddingHorizontal: 18,
              paddingTop: 18,
              paddingBottom: 16,
              marginBottom: 16,
            }}
          >
            <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
              How earnings split
            </Text>
            <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, marginTop: 4 }]}>
              {split.spend} / {split.save} / {split.give}
            </Text>
            <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginTop: 4 }]}>
              Every dollar your kids earn splits into three buckets. The default teaches them
              spend, save and give in balance.
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
              <SplitPill tone="spend" label="Spend" value={split.spend} />
              <SplitPill tone="savings" label="Save" value={split.save} />
              <SplitPill tone="giving" label="Give" value={split.give} />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit per-kid splits"
              onPress={onEditSplits}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: palette.border.mid,
                backgroundColor: scheme.bgPage,
                alignItems: "center",
              }}
            >
              <Text style={[typography.text.label, { color: scheme.fg }]}>
                Edit per-kid splits
              </Text>
            </Pressable>
          </View>

          {/* General settings */}
          <View
            style={{
              backgroundColor: scheme.bgRaised,
              borderColor: scheme.border,
              borderWidth: 1,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {generalRows.map((row, index) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: index < generalRows.length - 1 ? 1 : 0,
                  borderBottomColor: scheme.border,
                }}
              >
                <Text style={[typography.text.label, { flex: 1, color: scheme.fg }]}>
                  {row.label}
                </Text>
                <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>{row.meta}</Text>
                <ChevronRight size={14} color={scheme.fgFaint} strokeWidth={2} />
              </View>
            ))}
          </View>

          <Text
            style={{
              textAlign: "center",
              marginTop: 24,
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
  const { scheme, typography, palette, radius } = useChoreyTheme();
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
        backgroundColor: scheme.bgRaised,
        borderColor: scheme.border,
        borderWidth: 1,
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
                  ...(selected ? scheme.shadow.xs : null),
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
  const fmt = CURRENCIES[currency];
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

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 2 }}>
      {fmt.symbolPosition === "before" ? (
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 26 }]}>
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
          ...typography.text.h1,
          color: scheme.fg,
          fontSize: 26,
          paddingVertical: 0,
          paddingHorizontal: 0,
          minWidth: 28,
          width: Math.max(28, text.length * 16),
          borderBottomWidth: 2,
          borderBottomColor: accent,
        }}
      />
      {fmt.symbolPosition === "after" ? (
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 26 }]}>
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

function SplitPill({
  tone,
  label,
  value,
}: {
  tone: "spend" | "savings" | "giving";
  label: string;
  value: number;
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
    </View>
  );
}
