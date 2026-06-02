import { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { Check, Flame, Lock, Sparkles } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  formatMoneyDelta,
  formatMoneyParts,
  type CurrencyCode,
} from "@/features/money/currency";
import { DEFAULT_SPLIT, splitCents, type Split } from "@/features/money/split";

export type KidChore = {
  id: string;
  name: string;
  valueCents: number;
  done: boolean;
  note?: string;
};

type Props = {
  name?: string;
  streakDays?: number;
  /** injectable for deterministic tests; defaults to now */
  today?: Date;
  split?: Split;
  currency?: CurrencyCode;
  chores?: KidChore[];
  onToggleChore?: (id: string) => void;
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function KidHomeScreen({
  name = "there",
  streakDays = 0,
  today = new Date(),
  split = DEFAULT_SPLIT,
  currency = DEFAULT_CURRENCY,
  chores = [],
  onToggleChore,
}: Props) {
  const theme = useChoreyTheme();
  const { scheme, typography, space, radius } = theme;

  const earnedCents = chores.reduce(
    (total, chore) => (chore.done ? total + chore.valueCents : total),
    0,
  );
  const earned = splitCents(earnedCents, split);
  const remaining = chores.filter((chore) => !chore.done).length;
  const balance = formatMoneyParts(earnedCents, currency);

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 120 }}
        style={{ flex: 1 }}
      >
        {/* Header — weekday + greeting + streak chip */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 22,
            paddingTop: space[3],
            paddingBottom: space[2],
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
              {WEEKDAYS[today.getDay()]}
            </Text>
            <Text
              style={[
                typography.text.h1,
                { color: scheme.fg, fontSize: 32, marginTop: 2 },
              ]}
            >
              Hey, {name}.
            </Text>
          </View>
          {streakDays > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: space[3],
                paddingVertical: 6,
                borderRadius: radius.pill,
                backgroundColor: scheme.tint.warning,
              }}
            >
              <Flame size={15} color={theme.palette.semantic.warning[600]} strokeWidth={2} />
              <Text
                style={[
                  typography.text.label,
                  { color: theme.palette.semantic.warning[600] },
                ]}
              >
                {streakDays}-day streak
              </Text>
            </View>
          ) : null}
        </View>

        {/* Hero balance card */}
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 10,
            backgroundColor: scheme.bgRaised,
            borderRadius: 26,
            paddingHorizontal: 22,
            paddingTop: 22,
            paddingBottom: 18,
            ...scheme.shadow.md,
          }}
        >
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
            This week so far
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
            <Text
              style={[
                typography.text.moneyHero,
                { color: scheme.fg, fontSize: 64 },
              ]}
            >
              {`${balance.sign}${balance.lead}`}
            </Text>
            {balance.fraction ? (
              <Text
                style={[
                  typography.text.moneyHero,
                  {
                    color: scheme.fgMuted,
                    fontSize: 30,
                    fontFamily: typography.family.display.semibold,
                  },
                ]}
              >
                {balance.fraction}
              </Text>
            ) : null}
          </View>

          <BucketTriple
            spendCents={earned.spendCents}
            savingsCents={earned.savingsCents}
            givingCents={earned.givingCents}
            currency={currency}
          />
        </View>

        {/* Today */}
        <View style={{ paddingHorizontal: 22, paddingTop: space[6], paddingBottom: space[2] }}>
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>Today</Text>
          <Text
            style={[
              typography.text.h1,
              { color: scheme.fg, fontSize: 26, marginTop: 2 },
            ]}
          >
            {remaining > 0 ? (
              <>
                {remaining} {remaining === 1 ? "chore" : "chores"}{" "}
                <Text style={{ color: scheme.fgMuted }}>to go</Text>
              </>
            ) : (
              "Done for today."
            )}
          </Text>
        </View>

        {/* Chore list */}
        <View
          style={{
            marginHorizontal: 18,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {chores.map((chore, index) => (
            <ChoreRow
              key={chore.id}
              chore={chore}
              currency={currency}
              isLast={index === chores.length - 1}
              onToggle={onToggleChore}
            />
          ))}
        </View>

        {/* Split info note */}
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 18,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: scheme.tint.info,
            borderRadius: radius.md,
            flexDirection: "row",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <Sparkles size={18} color={theme.palette.semantic.info[600]} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 13 }]}>
              Every dollar splits three ways.
            </Text>
            <Text
              style={[
                typography.text.caption,
                { color: scheme.fgMuted, marginTop: 2 },
              ]}
            >
              {split.spend}% to spend, {split.save}% saved up, {split.give}% to a
              charity you pick.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- primitives ---------- */

function BucketTriple({
  spendCents,
  savingsCents,
  givingCents,
  currency,
}: {
  spendCents: number;
  savingsCents: number;
  givingCents: number;
  currency: CurrencyCode;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
      <BucketCard bucket="spend" label="Spend" cents={spendCents} currency={currency} />
      <BucketCard bucket="savings" label="Save" cents={savingsCents} currency={currency} locked />
      <BucketCard bucket="giving" label="Give" cents={givingCents} currency={currency} />
    </View>
  );
}

function BucketCard({
  bucket,
  label,
  cents,
  currency,
  locked,
}: {
  bucket: "spend" | "savings" | "giving";
  label: string;
  cents: number;
  currency: CurrencyCode;
  locked?: boolean;
}) {
  const { scheme, typography, bucketInk } = useChoreyTheme();
  const ink = bucketInk(bucket);
  const tintKey = bucket === "spend" ? "allowance" : bucket === "savings" ? "savings" : "giving";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: scheme.tint[tintKey],
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {locked ? <Lock size={11} color={ink} strokeWidth={2.4} /> : null}
        <Text
          style={[
            typography.text.overline,
            { color: ink, fontSize: 10, letterSpacing: 0.6 },
          ]}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[
          typography.text.money,
          { color: ink, fontSize: 19 },
        ]}
      >
        {formatMoney(cents, currency)}
      </Text>
    </View>
  );
}

function ChoreRow({
  chore,
  currency,
  isLast,
  onToggle,
}: {
  chore: KidChore;
  currency: CurrencyCode;
  isLast: boolean;
  onToggle?: (id: string) => void;
}) {
  const { scheme, typography } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: chore.done }}
      accessibilityLabel={chore.name}
      onPress={() => onToggle?.(chore.id)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: scheme.border,
      }}
    >
      <SpringCheckbox done={chore.done} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            typography.text.label,
            {
              fontSize: 15,
              color: chore.done ? scheme.fgFaint : scheme.fg,
              textDecorationLine: chore.done ? "line-through" : "none",
            },
          ]}
        >
          {chore.name}
        </Text>
        {chore.note ? (
          <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
            {chore.note}
          </Text>
        ) : null}
      </View>
      <Text
        style={[
          typography.text.money,
          { fontSize: 15, color: chore.done ? giving[600] : scheme.fg },
        ]}
      >
        {chore.done ? formatMoneyDelta(chore.valueCents, currency) : formatMoney(chore.valueCents, currency)}
      </Text>
    </Pressable>
  );
}

/** 26×26 checkbox that springs (small bounce) when it flips to done. */
function SpringCheckbox({ done }: { done: boolean }) {
  const { scheme, palette } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const scale = useRef(new Animated.Value(done ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: done ? 1 : 0.9,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [done, scale]);

  return (
    <Animated.View
      style={{
        width: 26,
        height: 26,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale }],
        backgroundColor: done ? giving[400] : scheme.bgPage,
        borderWidth: done ? 0 : 1.5,
        borderColor: palette.border.strong,
      }}
    >
      {done ? <Check size={16} color={giving[800]} strokeWidth={3} /> : null}
    </Animated.View>
  );
}
