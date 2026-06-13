import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";

import { buckets as bucketTokens } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

/**
 * The parent-side level-up notice — a quiet toast, not a celebration. It slides
 * in, holds for a beat, and clears itself after ~2.4s (or sooner if replaced).
 * The kid still gets the full-screen burst; the parent just gets a heads-up.
 */
export function LevelUpToast({
  level,
  kidName,
  onDone,
}: {
  level: number;
  kidName: string;
  onDone?: () => void;
}) {
  const { scheme, typography, radius } = useChoreyTheme();
  const savings = bucketTokens.savings.ramp;
  // Lazy-init the Animated.Value once (no ref read during render).
  const [anim] = useState(() => new Animated.Value(0));
  // Keep the latest onDone without restarting the dismiss timer each render.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    const hold = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => onDoneRef.current?.());
    }, 2400);

    return () => clearTimeout(hold);
  }, [anim, level, kidName]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 64,
        left: 18,
        right: 18,
        alignItems: "center",
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-12, 0],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: radius.pill,
          backgroundColor: scheme.bgModal,
          borderColor: scheme.toy.border,
          borderWidth: 1.5,
          ...scheme.toy.shadowSm,
        }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: radius.pill,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: savings[200],
          }}
        >
          <Text
            style={{
              fontFamily: typography.family.display.bold,
              fontSize: 13,
              color: savings[800],
            }}
          >
            {level}
          </Text>
        </View>
        <Text style={[typography.text.label, { color: scheme.fg, fontSize: 14 }]}>
          {kidName} reached Level {level}
        </Text>
      </View>
    </Animated.View>
  );
}
