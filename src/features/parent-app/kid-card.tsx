import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens, type ChoreyBucket } from "@/theme/chorey-theme";
import { ToyAvatar, ToyProgressBar, ToySticker } from "@/components/toybox";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  formatMoneyDelta,
  type CurrencyCode,
} from "@/features/money/currency";
import type { ParentKid } from "@/features/parent-app/parent-primitives";

export function KidCard({
  kid,
  currency = DEFAULT_CURRENCY,
  onTap,
}: {
  kid: ParentKid;
  currency?: CurrencyCode;
  onTap?: () => void;
}) {
  const { scheme, typography, palette, toybox, motion } = useChoreyTheme();
  const tone: ChoreyBucket = kid.tone === "allowance" ? "spend" : kid.tone;

  const cadenceWord = kid.cadence === "monthly" ? "month" : "week";
  const cadenceAdj = kid.cadence === "monthly" ? "monthly" : "weekly";
  const budgetRatio = kid.budgetCents > 0 ? kid.earnedCents / kid.budgetCents : 0;
  const over = kid.assignedCents > kid.budgetCents;
  const extraCents = kid.assignedCents - kid.budgetCents;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kid.name} details`}
      onPress={onTap}
      style={({ pressed }) => ({
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        borderRadius: toybox.radius,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
        gap: 13,
        transform: [{ scale: pressed ? motion.pressScale : 1 }],
        ...(pressed ? scheme.toy.shadowSm : scheme.toy.shadow),
      })}
    >
      {/* Identity row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <ToyAvatar name={kid.name} tone={tone} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 16 }]}>
            {kid.name}
          </Text>
          <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
            {typeof kid.age === "number" ? `${kid.age} years · ` : ""}
            {kid.choresDone} of {kid.choresTotal} chores done
          </Text>
        </View>
        <ChevronRight size={18} color={scheme.fgFaint} strokeWidth={2} />
      </View>

      {/* Earned this period */}
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text
          style={{
            fontFamily: typography.family.display.bold,
            fontSize: 34,
            letterSpacing: -0.7,
            color: scheme.fg,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatMoney(kid.earnedCents, currency)}
        </Text>
        <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
          this {cadenceWord}
        </Text>
      </View>

      {/* The buckets are furniture, not an 8px bar. */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <BucketTile bucket="spend" label="Spend" cents={kid.allowanceCents} currency={currency} />
        <BucketTile bucket="savings" label="Save" cents={kid.savingsCents} currency={currency} />
        <BucketTile bucket="giving" label="Give" cents={kid.givingCents} currency={currency} />
      </View>

      {/* Budget cap meter */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
            <Text style={{ color: scheme.fg, fontWeight: "700" }}>
              {formatMoney(kid.earnedCents, currency)}
            </Text>{" "}
            of {formatMoney(kid.budgetCents, currency)} {cadenceAdj} budget
          </Text>
          {over ? (
            <Text
              style={[
                typography.text.caption,
                { color: palette.semantic.warning[600], fontWeight: "700" },
              ]}
            >
              {formatMoneyDelta(extraCents, currency)} extra
            </Text>
          ) : null}
        </View>
        <ToyProgressBar
          ratio={budgetRatio}
          tone={budgetRatio >= 1 ? "giving" : "spend"}
          height={12}
        />
      </View>

      {kid.pendingApprovals > 0 ? (
        <ToySticker
          label={`${kid.pendingApprovals} ${kid.pendingApprovals === 1 ? "chore" : "chores"} need your OK`}
        />
      ) : null}
    </Pressable>
  );
}

function BucketTile({
  bucket,
  label,
  cents,
  currency,
}: {
  bucket: ChoreyBucket;
  label: string;
  cents: number;
  currency: CurrencyCode;
}) {
  const { scheme, typography, toybox, isDark, bucketInk } = useChoreyTheme();
  const ramp = bucketTokens[bucket].ramp;
  const ink = bucketInk(bucket);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: 1,
        backgroundColor: isDark ? ramp.tintDark : ramp[200],
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        borderRadius: 12,
        paddingVertical: 9,
        paddingHorizontal: 6,
        ...scheme.toy.shadowSm,
      }}
    >
      <Text style={[typography.text.money, { fontSize: 14, color: ink }]}>
        {formatMoney(cents, currency)}
      </Text>
      <Text style={[typography.text.caption, { fontSize: 11, fontWeight: "700", color: ink }]}>
        {label}
      </Text>
    </View>
  );
}
