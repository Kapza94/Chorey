import { useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

import { buckets as bucketTokens } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { ToyButton } from "@/components/toybox";

/** Deterministic PRNG so the confetti layout is stable (and testable). */
function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONFETTI_COLORS = [
  bucketTokens.spend.ramp[400],
  bucketTokens.savings.ramp[400],
  bucketTokens.giving.ramp[400],
  bucketTokens.spend.ramp[200],
  bucketTokens.savings.ramp[200],
];

type ConfettiPiece = {
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  round: boolean;
  color: string;
};

function confettiFor(level: number): ConfettiPiece[] {
  const rand = mulberry32(level * 7 + 3);
  return Array.from({ length: 18 }, (_, i) => ({
    left: `${4 + rand() * 88}%` as const,
    top: `${6 + rand() * 70}%` as const,
    size: 10 + rand() * 16,
    round: rand() > 0.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
}

/**
 * The level-up moment — a full-screen toybox celebration. Used by the kid app
 * (your own level) and the parent app (a kid just crossed a level on approve).
 */
export function LevelUpBurst({
  level,
  kidName,
  onDone,
}: {
  level: number;
  /** present on the parent side: whose level it is */
  kidName?: string;
  onDone?: () => void;
}) {
  const { scheme, typography, toybox, isDark } = useChoreyTheme();
  const savings = bucketTokens.savings.ramp;
  const [pop] = useState(() => new Animated.Value(0));
  const [drift] = useState(() => new Animated.Value(0));
  const confetti = confettiFor(level);

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
      { iterations: 4 },
    ).start();
  }, [pop, drift]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Dismiss celebration"
      onPress={onDone}
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: isDark ? "rgba(20, 17, 13, 0.92)" : "rgba(246, 239, 227, 0.96)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      {confetti.map((piece, index) => (
        <Animated.View
          key={index}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: piece.left,
            top: piece.top,
            width: piece.size,
            height: piece.size,
            borderRadius: piece.round ? 999 : 4,
            borderWidth: 2,
            borderColor: scheme.toy.border,
            backgroundColor: piece.color,
            transform: [
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, index % 2 === 0 ? 14 : -14],
                }),
              },
            ],
          }}
        />
      ))}

      <Animated.View
        style={{
          alignItems: "center",
          gap: 18,
          transform: [
            { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
          ],
          opacity: pop,
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? savings.tintDark : savings[200],
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            borderRadius: toybox.radius,
            paddingHorizontal: 34,
            paddingVertical: 22,
            transform: [{ rotate: toybox.stickerRotate }],
            ...scheme.toy.shadow,
          }}
        >
          <Text
            style={{
              fontFamily: typography.family.display.extra,
              fontSize: 52,
              letterSpacing: -1,
              color: isDark ? savings[200] : savings[800],
            }}
          >
            Level {level}!
          </Text>
        </View>
        <Text style={[typography.text.h2, { color: scheme.fg, textAlign: "center" }]}>
          {kidName ? `${kidName} leveled up.` : "You leveled up."}
        </Text>
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted }]}>
          Earned chore by chore — no shortcuts.
        </Text>
        <View style={{ width: 220, marginTop: 6 }}>
          <ToyButton onPress={onDone} accessibilityLabel="Keep going">
            Keep going
          </ToyButton>
        </View>
      </Animated.View>
    </Pressable>
  );
}
