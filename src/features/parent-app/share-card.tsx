import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from "react-native";
import { Share2, X } from "lucide-react-native";

import { palette, buckets, choreyTheme } from "@/theme/chorey-theme";
import { formatMoney, type CurrencyCode } from "@/features/money/currency";
import {
  hasShareableWeek,
  shareCaptionFor,
  type ShareStats,
} from "@/features/parent-app/share-stats";
import type { ShareStatsActions } from "@/features/parent-app/share-actions";

const { toybox, typography } = choreyTheme;

/**
 * The brand mark, drawn inline so it snapshots crisply at any density: the
 * 40/40/20 trio as three dots, followed by the wordmark.
 */
function BrandMark() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {(["spend", "savings", "giving"] as const).map((bucket) => (
          <View
            key={bucket}
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              backgroundColor: buckets[bucket].ramp[400],
              borderColor: palette.fg[1],
              borderWidth: 1.5,
            }}
          />
        ))}
      </View>
      <Text
        style={{
          fontFamily: typography.family.display.extra,
          fontSize: 20,
          letterSpacing: -0.4,
          color: palette.fg[1],
        }}
      >
        Chorey
      </Text>
    </View>
  );
}

/** One segment of the 40/40/20 split bar. */
function SplitSegment({ bucket, flex }: { bucket: "spend" | "savings" | "giving"; flex: number }) {
  return <View style={{ flex, height: "100%", backgroundColor: buckets[bucket].ramp[400] }} />;
}

/**
 * The branded weekly stats card. Theme-independent on purpose — an exported
 * image should always read as the warm Chorey brand, not the parent's dark mode.
 * Carries only household-level aggregates (see `share-stats.ts`).
 */
export function ShareStatsCard({
  stats,
  currency,
}: {
  stats: ShareStats;
  currency: CurrencyCode;
}) {
  const ink = palette.fg[1];

  return (
    <View
      style={{
        width: 320,
        backgroundColor: palette.cream[3],
        borderColor: ink,
        borderWidth: toybox.borderWidth,
        borderRadius: 24,
        padding: 22,
        gap: 18,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <BrandMark />
        <Text
          style={[
            typography.text.overline,
            { color: palette.fg[3], fontSize: 11 },
          ]}
        >
          This week
        </Text>
      </View>

      {/* Hero: chores done */}
      <View>
        <Text
          style={{
            fontFamily: typography.family.display.extra,
            fontSize: 64,
            lineHeight: 64,
            letterSpacing: -1.5,
            color: ink,
            fontVariant: ["tabular-nums"],
          }}
        >
          {stats.choresDone}
        </Text>
        <Text
          style={{
            fontFamily: typography.family.display.bold,
            fontSize: 22,
            letterSpacing: -0.4,
            color: ink,
            marginTop: -2,
          }}
        >
          {stats.choresDone === 1 ? "chore done" : "chores done"} 🎉
        </Text>
      </View>

      {/* Earned + kids */}
      <View style={{ flexDirection: "row", gap: 24 }}>
        <View>
          <Text style={[typography.text.overline, { color: palette.fg[3], fontSize: 10 }]}>
            Earned
          </Text>
          <Text
            style={{
              fontFamily: typography.family.body.bold,
              fontSize: 20,
              color: buckets.spend.ramp[800],
              fontVariant: ["tabular-nums"],
              marginTop: 2,
            }}
          >
            {formatMoney(stats.earnedCents, currency)}
          </Text>
        </View>
        <View>
          <Text style={[typography.text.overline, { color: palette.fg[3], fontSize: 10 }]}>
            {stats.kidCount === 1 ? "Child" : "Children"}
          </Text>
          <Text
            style={{
              fontFamily: typography.family.body.bold,
              fontSize: 20,
              color: ink,
              fontVariant: ["tabular-nums"],
              marginTop: 2,
            }}
          >
            {stats.kidCount}
          </Text>
        </View>
      </View>

      {/* The 40/40/20 split — brand DNA */}
      <View style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: "row",
            height: 16,
            borderRadius: 999,
            overflow: "hidden",
            borderColor: ink,
            borderWidth: 1.5,
          }}
        >
          <SplitSegment bucket="spend" flex={buckets.spend.percent} />
          <SplitSegment bucket="savings" flex={buckets.savings.percent} />
          <SplitSegment bucket="giving" flex={buckets.giving.percent} />
        </View>
        <Text style={[typography.text.caption, { color: palette.fg[2] }]}>
          {buckets.spend.percent}% spend · {buckets.savings.percent}% save ·{" "}
          {buckets.giving.percent}% give
        </Text>
      </View>
    </View>
  );
}

/**
 * Preview-and-share sheet. Owns the snapshot target ref and hands it to the
 * injected `actions.shareCard`; the card itself stays a pure view.
 */
export function ShareStatsSheet({
  visible,
  stats,
  currency,
  actions,
  onClose,
}: {
  visible: boolean;
  stats: ShareStats;
  currency: CurrencyCode;
  actions: ShareStatsActions;
  onClose: () => void;
}) {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await actions.shareCard(cardRef, shareCaptionFor(stats, currency));
    } catch {
      Alert.alert("Couldn't share", "Something went wrong creating the image. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(42, 32, 24, 0.55)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        {/* Stop taps on the content from dismissing. */}
        <Pressable onPress={() => {}} style={{ alignItems: "center", gap: 20 }}>
          {/* Snapshot target: only the card, so the share image is just the card. */}
          <View ref={cardRef} collapsable={false} style={{ backgroundColor: "transparent" }}>
            <ShareStatsCard stats={stats} currency={currency} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.cream[4],
                borderColor: palette.fg[1],
                borderWidth: toybox.borderWidth,
              }}
            >
              <X size={22} color={palette.fg[1]} strokeWidth={2.4} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share this week"
              accessibilityState={{ disabled: sharing, busy: sharing }}
              disabled={sharing}
              onPress={onShare}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 26,
                height: 52,
                borderRadius: 999,
                backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
                borderColor: palette.fg[1],
                borderWidth: toybox.borderWidth,
              })}
            >
              {sharing ? (
                <ActivityIndicator color={palette.cream[4]} />
              ) : (
                <Share2 size={20} color={palette.cream[4]} strokeWidth={2.4} />
              )}
              <Text
                style={[typography.text.label, { fontSize: 16, color: palette.cream[4] }]}
              >
                {sharing ? "Sharing…" : "Share"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Whether to offer sharing at all this period. */
export { hasShareableWeek };
