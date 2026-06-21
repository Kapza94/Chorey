import { useRef, useState } from "react";
import { PanResponder, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useChoreyTheme } from "@/theme/use-chorey-theme";

/**
 * A finger-drawn signature canvas. Strokes are SVG path strings built from pan
 * gestures — no native signature dependency. `onChange` fires the moment the
 * first stroke lands (and again on Clear) so the caller can gate on a real
 * signature instead of a blank box. We don't surface the drawing itself: the
 * value here is the ritual of signing, not a stored image.
 */
export function SignaturePad({
  height = 170,
  onChange,
}: {
  height?: number;
  /** true once anything is drawn, false after Clear. Pass a stable callback. */
  onChange?: (hasInk: boolean) => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const [strokes, setStrokes] = useState<string[]>([]);
  const liveRef = useRef("");
  const hasInkRef = useRef(false);

  const markInked = () => {
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      onChange?.(true);
    }
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const { locationX: x, locationY: y } = event.nativeEvent;
        liveRef.current = `M${x.toFixed(1)},${y.toFixed(1)}`;
        setStrokes((prev) => [...prev, liveRef.current]);
      },
      onPanResponderMove: (event) => {
        const { locationX: x, locationY: y } = event.nativeEvent;
        liveRef.current += ` L${x.toFixed(1)},${y.toFixed(1)}`;
        setStrokes((prev) => {
          const next = prev.slice();
          next[next.length - 1] = liveRef.current;
          return next;
        });
        markInked();
      },
    }),
  ).current;

  const clear = () => {
    setStrokes([]);
    liveRef.current = "";
    hasInkRef.current = false;
    onChange?.(false);
  };

  const inked = strokes.length > 0;

  return (
    <View>
      <View
        {...responder.panHandlers}
        style={{
          height,
          borderRadius: radius.sm,
          backgroundColor: scheme.bgModal,
          borderColor: scheme.toy.border,
          borderWidth: 1.5,
          overflow: "hidden",
          justifyContent: "flex-end",
        }}
      >
        {/* Signature baseline + hint, hidden once they start drawing. */}
        {!inked ? (
          <View style={{ position: "absolute", left: 18, right: 18, bottom: 34 }}>
            <View style={{ height: 1.5, backgroundColor: palette.border.mid }} />
            <Text
              style={[
                typography.text.caption,
                { color: scheme.fgFaint, marginTop: 8, textAlign: "center" },
              ]}
            >
              Sign with your finger
            </Text>
          </View>
        ) : null}
        <Svg width="100%" height="100%">
          {strokes.map((d, index) => (
            <Path
              key={index}
              d={d}
              stroke={scheme.fg}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </View>
      {inked ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear signature"
          onPress={clear}
          style={{ alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 4, marginTop: 4 }}
        >
          <Text style={[typography.text.label, { color: scheme.fgMuted, fontSize: 13 }]}>
            Clear
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
