import { useEffect, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { Check, Clock, Lock, Sparkles } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import { ToyProgressBar, ToySticker } from "@/components/toybox";
import { MAX_LEVEL, levelProgress, pointsForChore } from "@/features/game/leveling";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  formatMoneyDelta,
  formatMoneyParts,
  type CurrencyCode,
} from "@/features/money/currency";
import { DEFAULT_SPLIT, type Split } from "@/features/money/split";

/**
 * A chore's state from the kid's point of view:
 * - todo: not started (or sent back)
 * - waiting: marked done, waiting for a parent to approve (no money yet)
 * - approved: approved — counted in the kid's real balances
 */
export type KidChoreState = "todo" | "waiting" | "approved";

export type KidChore = {
  id: string;
  name: string;
  valueCents: number;
  state: KidChoreState;
  note?: string;
};

type Props = {
  name?: string;
  /** injectable for deterministic tests; defaults to now */
  today?: Date;
  split?: Split;
  currency?: CurrencyCode;
  chores?: KidChore[];
  /** real, approved balances from the ledger (what "this week so far" shows). */
  spendCents?: number;
  savingsCents?: number;
  givingCents?: number;
  /** lifetime game points (every approved chore earns some) */
  totalPoints?: number;
  onOpenChore?: (id: string) => void;
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
  today = new Date(),
  split = DEFAULT_SPLIT,
  currency = DEFAULT_CURRENCY,
  chores = [],
  spendCents = 0,
  savingsCents = 0,
  givingCents = 0,
  totalPoints = 0,
  onOpenChore,
}: Props) {
  const theme = useChoreyTheme();
  const { scheme, typography, space, radius, toybox } = theme;
  const game = levelProgress(totalPoints);

  // The hero shows real, approved balances (matches You + Wishlist).
  const earnedCents = spendCents + savingsCents + givingCents;
  const balance = formatMoneyParts(earnedCents, currency);

  // Chores marked done but not yet approved — money is "waiting", not earned.
  const waiting = chores.filter((chore) => chore.state === "waiting");
  const pendingCents = waiting.reduce((total, chore) => total + chore.valueCents, 0);
  const remaining = chores.filter((chore) => chore.state === "todo").length;

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
              style={{
                fontFamily: typography.family.display.extra,
                fontSize: 34,
                letterSpacing: -0.8,
                color: scheme.fg,
                marginTop: 2,
              }}
            >
              Hey, {name}.
            </Text>
          </View>
        </View>

        {/* Level + XP toward the next one */}
        <View style={{ marginHorizontal: 18, marginTop: 6, gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <ToySticker label={`Level ${game.level}`} tone="savings" straight />
            <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
              {game.level >= MAX_LEVEL
                ? "Top level — legend."
                : `${game.intoLevel} / ${game.neededForNext} to level ${game.level + 1}`}
            </Text>
          </View>
          <ToyProgressBar ratio={game.ratio} tone="savings" height={12} />
        </View>

        {/* Hero balance card */}
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 14,
            backgroundColor: scheme.bgModal,
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            borderRadius: radius.lg,
            paddingHorizontal: 22,
            paddingTop: 22,
            paddingBottom: 18,
            ...scheme.toy.shadow,
          }}
        >
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
            Your money
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
            spendCents={spendCents}
            savingsCents={savingsCents}
            givingCents={givingCents}
            currency={currency}
          />
        </View>

        {/* Waiting for a parent to approve */}
        {pendingCents > 0 ? (
          <View
            style={{
              marginHorizontal: 18,
              marginTop: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: scheme.tint.warning,
              borderColor: scheme.toy.border,
              borderWidth: toybox.borderWidth,
              borderRadius: radius.md,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              ...scheme.toy.shadowSm,
            }}
          >
            <Clock size={20} color={theme.palette.semantic.warning[600]} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 13 }]}>
                {formatMoney(pendingCents, currency)} waiting to be approved
              </Text>
              <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
                {waiting.length} {waiting.length === 1 ? "chore is" : "chores are"} done — a parent
                approves before it counts.
              </Text>
            </View>
          </View>
        ) : null}

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
            backgroundColor: scheme.bgModal,
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            borderRadius: toybox.radius,
            overflow: "hidden",
            ...scheme.toy.shadow,
          }}
        >
          {chores.length === 0 ? (
            <View style={{ alignItems: "center", paddingHorizontal: 18, paddingVertical: 22 }}>
              <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>
                Nothing on your list today.
              </Text>
              <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 2 }]}>
                New chores from your parents show up here.
              </Text>
            </View>
          ) : (
            chores.map((chore, index) => (
              <ChoreRow
                key={chore.id}
                chore={chore}
                currency={currency}
                isLast={index === chores.length - 1}
                onOpen={onOpenChore}
              />
            ))
          )}
        </View>

        {/* Split info note */}
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 18,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: scheme.tint.info,
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            borderRadius: radius.md,
            flexDirection: "row",
            gap: 12,
            alignItems: "flex-start",
            ...scheme.toy.shadowSm,
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
              cause you pick.
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
  const { scheme, typography, toybox, isDark, bucketInk } = useChoreyTheme();
  const ink = bucketInk(bucket);
  const ramp = bucketTokens[bucket].ramp;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? ramp.tintDark : ramp[200],
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 2,
        ...scheme.toy.shadowSm,
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
  onOpen,
}: {
  chore: KidChore;
  currency: CurrencyCode;
  isLast: boolean;
  onOpen?: (id: string) => void;
}) {
  const { scheme, typography, palette, bucketInk } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;

  const approved = chore.state === "approved";
  const waiting = chore.state === "waiting";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={chore.name}
      onPress={() => onOpen?.(chore.id)}
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
      {waiting ? (
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: scheme.tint.warning,
          }}
        >
          <Clock size={15} color={palette.semantic.warning[600]} strokeWidth={2.4} />
        </View>
      ) : (
        <SpringCheckbox done={approved} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            typography.text.label,
            {
              fontSize: 15,
              color: approved ? scheme.fgFaint : scheme.fg,
              textDecorationLine: approved ? "line-through" : "none",
            },
          ]}
        >
          {chore.name}
        </Text>
        {waiting ? (
          <Text style={[typography.text.caption, { color: palette.semantic.warning[600], marginTop: 1 }]}>
            Waiting for a parent
          </Text>
        ) : chore.note ? (
          <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
            {chore.note}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 1 }}>
        <Text
          style={[
            typography.text.money,
            { fontSize: 15, color: approved ? giving[600] : scheme.fgMuted },
          ]}
        >
          {approved
            ? formatMoneyDelta(chore.valueCents, currency)
            : formatMoney(chore.valueCents, currency)}
        </Text>
        <Text style={[typography.text.caption, { fontSize: 11, color: bucketInk("savings") }]}>
          +{pointsForChore(chore.valueCents)} pts
        </Text>
      </View>
    </Pressable>
  );
}

/** 26×26 checkbox that springs (small bounce) when it flips to done. */
function SpringCheckbox({ done }: { done: boolean }) {
  const { scheme, toybox } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  // Lazy-init the Animated.Value once (no ref read during render).
  const [scale] = useState(() => new Animated.Value(done ? 1 : 0.9));

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
        borderWidth: toybox.borderWidth,
        borderColor: scheme.toy.border,
      }}
    >
      {done ? <Check size={16} color={giving[800]} strokeWidth={3} /> : null}
    </Animated.View>
  );
}
