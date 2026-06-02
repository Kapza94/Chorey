import { Pressable, Text, View } from "react-native";
import { Heart, Home, User } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";

export type KidTab = "home" | "wish" | "you";

/**
 * The kid bottom tab bar: Home / Wishlist / You. Active tab uses the peach
 * accent. Owned by the Kid app shell, not the individual screens.
 */
export function KidTabBar({
  active,
  onChange,
}: {
  active: KidTab;
  onChange?: (tab: KidTab) => void;
}) {
  const { scheme, typography, palette } = useChoreyTheme();
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
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 28,
        backgroundColor: scheme.bgPage,
        borderTopWidth: 1,
        borderTopColor: scheme.border,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const color = isActive ? palette.accent[600] : scheme.fgFaint;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
            onPress={() => onChange?.(tab.id)}
            style={{ alignItems: "center", gap: 3, paddingHorizontal: 14, paddingVertical: 4 }}
          >
            <tab.Icon size={22} color={color} strokeWidth={isActive ? 2.4 : 2} />
            <Text style={[typography.text.caption, { color, fontWeight: "700" }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
