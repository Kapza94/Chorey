import { Pressable, Text, View } from "react-native";
import { Heart, Home, User } from "lucide-react-native";

import { buckets as bucketTokens } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

export type KidTab = "home" | "wish" | "you";

/**
 * The kid bottom tab bar — a floating toybox pill dock. The active tab is a
 * filled, outlined chip. Owned by the Kid app shell, not the screens.
 */
export function KidTabBar({
  active,
  onChange,
}: {
  active: KidTab;
  onChange?: (tab: KidTab) => void;
}) {
  const { scheme, typography, toybox, radius, isDark } = useChoreyTheme();
  const savings = bucketTokens.savings.ramp;
  const tabs: { id: KidTab; label: string; Icon: typeof Home }[] = [
    { id: "home", label: "Home", Icon: Home },
    { id: "wish", label: "Wishlist", Icon: Heart },
    { id: "you", label: "You", Icon: User },
  ];

  return (
    <View
      testID="kid-tab-bar"
      style={{
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 24,
        flexDirection: "row",
        gap: 6,
        padding: 6,
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        borderRadius: radius.pill,
        ...scheme.toy.shadow,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const color = isActive ? (isDark ? savings[200] : savings[800]) : scheme.fgFaint;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
            onPress={() => onChange?.(tab.id)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 9,
              borderRadius: radius.pill,
              backgroundColor: isActive
                ? isDark
                  ? savings.tintDark
                  : savings[200]
                : "transparent",
              borderWidth: isActive ? toybox.borderWidth : 0,
              borderColor: scheme.toy.border,
            }}
          >
            <tab.Icon size={18} color={color} strokeWidth={isActive ? 2.4 : 2} />
            <Text style={[typography.text.caption, { color, fontWeight: "700" }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
