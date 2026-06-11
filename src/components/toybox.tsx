import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { buckets as bucketTokens, type ChoreyBucket } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

/**
 * Toybox primitives — the tile language from the redesign.
 * Every surface is an outlined tile on a solid offset shadow; pressing a
 * button drops it onto its shadow. Screens compose these instead of
 * hand-rolling card styles.
 */

/** An outlined tile. `tone` fills it with a bucket's soft color. */
export function ToyCard({
  children,
  tone,
  style,
}: {
  children: React.ReactNode;
  tone?: ChoreyBucket;
  style?: StyleProp<ViewStyle>;
}) {
  const { scheme, toybox, isDark } = useChoreyTheme();
  const ramp = tone ? bucketTokens[tone].ramp : null;
  return (
    <View
      style={[
        {
          backgroundColor: ramp ? (isDark ? ramp.tintDark : ramp[200]) : scheme.bgModal,
          borderColor: scheme.toy.border,
          borderWidth: toybox.borderWidth,
          borderRadius: toybox.radius,
          padding: 16,
          ...scheme.toy.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A sticker badge — outlined chip, slightly off-axis. */
export function ToySticker({
  label,
  tone = "warning",
  straight = false,
}: {
  label: string;
  tone?: ChoreyBucket | "warning";
  straight?: boolean;
}) {
  const { scheme, typography, palette, toybox, isDark, bucketInk } = useChoreyTheme();
  const isWarning = tone === "warning";
  const bg = isWarning
    ? scheme.tint.warning
    : isDark
      ? bucketTokens[tone].ramp.tintDark
      : bucketTokens[tone].ramp[200];
  const ink = isWarning ? palette.semantic.warning[600] : bucketInk(tone);
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: bg,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        transform: straight ? undefined : [{ rotate: toybox.stickerRotate }],
        ...scheme.toy.shadowSm,
      }}
    >
      <Text style={[typography.text.label, { fontSize: 12, color: ink }]}>{label}</Text>
    </View>
  );
}

/** Primary action — a tile that physically presses down onto its shadow. */
export function ToyButton({
  children,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { scheme, typography, palette, radius, toybox } = useChoreyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      onPress={() => {
        if (!disabled) onPress?.();
      }}
      style={({ pressed }) => ({
        width: "100%",
        paddingVertical: 14,
        alignItems: "center",
        backgroundColor: disabled
          ? scheme.bgSunken
          : pressed
            ? palette.accent[800]
            : palette.accent[600],
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        borderRadius: radius.pill,
        ...(pressed && !disabled
          ? { transform: [{ translateY: toybox.offset }] }
          : scheme.toy.shadow),
      })}
    >
      <Text
        style={[
          typography.text.label,
          { fontSize: 16, color: disabled ? scheme.fgDisabled : palette.cream[4] },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

/** Squircle initial avatar in a kid's tone. */
export function ToyAvatar({
  name,
  tone = "spend",
  size = 44,
}: {
  name: string;
  tone?: ChoreyBucket;
  size?: number;
}) {
  const { scheme, typography, toybox, isDark, bucketInk } = useChoreyTheme();
  const ramp = bucketTokens[tone].ramp;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: toybox.squircle,
        backgroundColor: isDark ? ramp.tintDark : ramp[200],
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: typography.family.display.semibold,
          fontSize: size * 0.45,
          color: bucketInk(tone),
        }}
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </Text>
    </View>
  );
}

/** Outlined progress bar (XP, budgets, goals). Ratio is clamped to 0..1. */
export function ToyProgressBar({
  ratio,
  tone = "spend",
  height = 14,
}: {
  ratio: number;
  tone?: ChoreyBucket;
  height?: number;
}) {
  const { scheme, radius, toybox } = useChoreyTheme();
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(clamped * 100), min: 0, max: 100 }}
      style={{
        height,
        backgroundColor: scheme.bgSunken,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        borderRadius: radius.pill,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: "100%",
          backgroundColor: bucketTokens[tone].ramp[400],
        }}
      />
    </View>
  );
}
