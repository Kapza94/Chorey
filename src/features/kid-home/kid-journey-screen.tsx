import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { X } from "lucide-react-native";

import { buckets as bucketTokens, type ChoreyBucket } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { ToySticker } from "@/components/toybox";
import { MAX_LEVEL } from "@/features/game/leveling";
import {
  drivePath,
  mapHeight,
  nodePosition,
  roadDots,
} from "@/features/game/journey-geometry";

const MILESTONES: Record<number, string> = {
  10: "routine!",
  25: "quarter way",
  50: "halfway hero",
  75: "almost there",
  100: "LEGEND",
};

const NODE_TONES: ChoreyBucket[] = ["spend", "savings", "giving"];

/**
 * The level road — a serpentine map from level 1 (bottom) to 100 (top).
 * The kid's car parks at their level; when they open the map after leveling
 * up, it drives from where it last parked to the new level and stops there.
 */
export function KidJourneyScreen({
  visible,
  level,
  fromLevel,
  onArrived,
  onClose,
}: {
  visible: boolean;
  /** current level — where the car ends up */
  level: number;
  /** where the car starts; below `level` makes it drive */
  fromLevel?: number;
  /** the drive finished — persist the new parking spot */
  onArrived?: () => void;
  onClose?: () => void;
}) {
  const { scheme, typography, toybox, isDark, bucketInk } = useChoreyTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const start = fromLevel && fromLevel >= 1 ? Math.min(fromLevel, level) : level;
  const startPos = nodePosition(start, width);
  const [carXY] = useState(() => new Animated.ValueXY(startPos));
  const [carTilt] = useState(() => new Animated.Value(0));

  // All road dots + nodes are static; compute once per width.
  const road = useMemo(() => {
    const dots = [];
    for (let l = 1; l < MAX_LEVEL; l++) dots.push(...roadDots(l, width));
    return dots;
  }, [width]);

  useEffect(() => {
    if (!visible) return;

    // Land the viewport on the destination, then let the car do its thing.
    const target = nodePosition(level, width);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(target.y - 360, 0), animated: false });
    });

    if (start >= level) return;
    const waypoints = drivePath(start, level, width).slice(1);
    const hops = waypoints.flatMap((point, i) => [
      Animated.parallel([
        Animated.timing(carXY, {
          toValue: point,
          duration: 420,
          useNativeDriver: false,
        }),
        Animated.timing(carTilt, {
          toValue: i % 2 === 0 ? 1 : -1,
          duration: 420,
          useNativeDriver: false,
        }),
      ]),
    ]);
    Animated.sequence([
      Animated.delay(500),
      ...hops,
      Animated.spring(carTilt, { toValue: 0, friction: 4, useNativeDriver: false }),
    ]).start(({ finished }) => {
      if (finished) onArrived?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
        {/* header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 64,
            paddingBottom: 14,
          }}
        >
          <View>
            <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
              the level road
            </Text>
            <Text
              style={{
                fontFamily: typography.family.display.extra,
                fontSize: 30,
                letterSpacing: -0.7,
                color: scheme.fg,
              }}
            >
              Level {level} of {MAX_LEVEL}.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close the level road"
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              backgroundColor: scheme.bgModal,
              borderColor: scheme.toy.border,
              borderWidth: toybox.borderWidth,
              alignItems: "center",
              justifyContent: "center",
              ...scheme.toy.shadowSm,
            }}
          >
            <X size={18} color={scheme.fg} strokeWidth={2.4} />
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }}>
          <View style={{ height: mapHeight(), width: "100%" }}>
            {/* dotted road */}
            {road.map((dot, i) => (
              <View
                key={`d${i}`}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: dot.x - 4,
                  top: dot.y - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isDark ? "#3B342B" : "#E3D5BC",
                }}
              />
            ))}

            {/* level nodes */}
            {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => {
              const pos = nodePosition(l, width);
              const reached = l <= level;
              const tone = NODE_TONES[l % 3];
              const ramp = bucketTokens[tone].ramp;
              const milestone = MILESTONES[l];
              const big = Boolean(milestone);
              const size = big ? 58 : 40;
              return (
                <View
                  key={l}
                  style={{
                    position: "absolute",
                    left: pos.x - size / 2,
                    top: pos.y - size / 2,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: size,
                      height: size,
                      borderRadius: size / 2.6,
                      backgroundColor: reached
                        ? isDark
                          ? ramp.tintDark
                          : ramp[200]
                        : scheme.bgModal,
                      borderColor: scheme.toy.border,
                      borderWidth: toybox.borderWidth,
                      alignItems: "center",
                      justifyContent: "center",
                      ...(reached ? scheme.toy.shadowSm : {}),
                    }}
                  >
                    <Text
                      style={[
                        typography.text.money,
                        {
                          fontSize: big ? 18 : 13,
                          color: reached ? bucketInk(tone) : scheme.fgDisabled,
                        },
                      ]}
                    >
                      {l}
                    </Text>
                  </View>
                  {milestone ? (
                    <View style={{ marginTop: 6 }}>
                      <ToySticker label={milestone} tone={tone} />
                    </View>
                  ) : null}
                </View>
              );
            })}

            {/* the car */}
            <Animated.View
              testID="journey-car"
              pointerEvents="none"
              style={{
                position: "absolute",
                left: -34,
                top: -44,
                transform: [
                  { translateX: carXY.x },
                  { translateY: carXY.y },
                  {
                    rotate: carTilt.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ["-8deg", "8deg"],
                    }),
                  },
                ],
              }}
            >
              <ToyCar />
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** A tiny toybox car, built from views — no assets, themes with the palette. */
function ToyCar() {
  const { scheme, toybox } = useChoreyTheme();
  const peach = bucketTokens.spend.ramp;
  const lilac = bucketTokens.savings.ramp;
  return (
    <View style={{ width: 68, alignItems: "center" }}>
      {/* cabin */}
      <View
        style={{
          width: 34,
          height: 18,
          backgroundColor: lilac[200],
          borderColor: scheme.toy.border,
          borderWidth: toybox.borderWidth,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          marginBottom: -2,
        }}
      />
      {/* body */}
      <View
        style={{
          width: 68,
          height: 24,
          backgroundColor: peach[400],
          borderColor: scheme.toy.border,
          borderWidth: toybox.borderWidth,
          borderRadius: 12,
          ...scheme.toy.shadowSm,
        }}
      />
      {/* wheels */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: 52,
          marginTop: -8,
        }}
      >
        {[0, 1].map((w) => (
          <View
            key={w}
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: scheme.toy.border,
              borderColor: scheme.bgPage,
              borderWidth: 2,
            }}
          />
        ))}
      </View>
    </View>
  );
}
