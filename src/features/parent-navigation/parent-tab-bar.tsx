import { Home, ListChecks, Settings, Users } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { choreyTheme } from "@/theme/chorey-theme";

export type ParentTab = "dashboard" | "chores" | "children" | "settings";

type Props = {
  currentTab: ParentTab;
  onOpenDashboard?: () => void;
  onOpenChores?: () => void;
  onOpenChildren?: () => void;
  onOpenSettings?: () => void;
};

const tabs = [
  { key: "dashboard", accessibilityName: "Dashboard tab", Icon: Home },
  { key: "chores", accessibilityName: "Chores tab", Icon: ListChecks },
  { key: "children", accessibilityName: "Children tab", Icon: Users },
  { key: "settings", accessibilityName: "Settings tab", Icon: Settings },
] as const;

export function ParentTabBar({
  currentTab,
  onOpenDashboard,
  onOpenChores,
  onOpenChildren,
  onOpenSettings,
}: Props) {
  const handlers = {
    children: onOpenChildren,
    chores: onOpenChores,
    dashboard: onOpenDashboard,
    settings: onOpenSettings,
  };

  return (
    <View
      accessibilityRole="tablist"
      testID="parent-tab-bar"
      style={{
        backgroundColor: "transparent",
        borderWidth: 0,
        flexDirection: "row",
        padding: 0,
      }}
    >
      {tabs.map((tab) => {
        const selected = tab.key === currentTab;
        const Icon = tab.Icon;

        return (
          <Pressable
            accessibilityLabel={
              selected ? `${tab.accessibilityName}, selected` : tab.accessibilityName
            }
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.key}
            onPress={handlers[tab.key]}
            testID={`${tab.key}-tab-button`}
            style={({ pressed }) => ({
              alignItems: "center",
              backgroundColor: "transparent",
              borderWidth: 0,
              flex: 1,
              height: 64,
              justifyContent: "center",
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Icon
              color={
                selected
                  ? choreyTheme.colors.primaryPressed
                  : choreyTheme.colors.inkMuted
              }
              size={32}
              strokeWidth={2}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
