import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { choreyTheme } from "@/theme/chorey-theme";

const buckets = [
  choreyTheme.buckets.spend,
  choreyTheme.buckets.savings,
  choreyTheme.buckets.giving,
];

export function WelcomeScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: choreyTheme.colors.cream2 }}
      contentContainerStyle={{
        padding: choreyTheme.spacing.xl,
        gap: choreyTheme.spacing.xxl,
      }}
    >
      <View style={{ gap: choreyTheme.spacing.xxl }}>
        <View
          style={{
            backgroundColor: choreyTheme.colors.surfaceWarm,
            borderColor: choreyTheme.colors.borderSoft,
            borderRadius: choreyTheme.radii.lg,
            borderWidth: 1,
            gap: choreyTheme.spacing.md,
            padding: choreyTheme.spacing.lg,
            ...choreyTheme.shadows.card,
          }}
        >
          <View
            style={{
              alignSelf: "flex-start",
              borderRadius: choreyTheme.radii.pill,
              borderColor: choreyTheme.colors.borderSoft,
              borderWidth: 1,
              paddingHorizontal: choreyTheme.spacing.md,
              paddingVertical: choreyTheme.spacing.sm,
              backgroundColor: choreyTheme.colors.surface,
            }}
          >
            <Text
              selectable
              style={{
                color: choreyTheme.colors.inkMuted,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              40 / 40 / 20
            </Text>
          </View>

          <Text
            selectable
            style={{
              color: choreyTheme.colors.ink1,
              fontSize: 48,
              fontWeight: "800",
              letterSpacing: 0,
            }}
          >
            Chorey
          </Text>

          <Text
            selectable
            style={{
              color: choreyTheme.colors.ink1,
              fontSize: 24,
              fontWeight: "700",
              lineHeight: 31,
              letterSpacing: 0,
            }}
          >
            Every chore teaches money habits.
          </Text>

          <Text
            selectable
            style={{
              color: choreyTheme.colors.inkMuted,
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            Kids earn through chores. Parents approve the work. Chorey splits
            every approved reward into Spend, Savings, and Giving.
          </Text>
        </View>

        <View
          style={{
            borderRadius: choreyTheme.radii.lg,
            backgroundColor: choreyTheme.colors.surface,
            borderColor: choreyTheme.colors.borderMedium,
            borderWidth: 1,
            padding: choreyTheme.spacing.lg,
            gap: choreyTheme.spacing.md,
            ...choreyTheme.shadows.card,
          }}
        >
          {buckets.map((bucket) => (
            <View
              key={bucket.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: choreyTheme.spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: choreyTheme.spacing.md,
                }}
              >
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: bucket.color,
                  }}
                />
                <Text
                  selectable
                  style={{
                    color: choreyTheme.colors.ink1,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {bucket.label}
                </Text>
              </View>

              <Text
                selectable
                style={{
                  color: choreyTheme.colors.ink2,
                  fontSize: 16,
                  fontVariant: ["tabular-nums"],
                  fontWeight: "700",
                }}
              >
                {bucket.percent}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: choreyTheme.spacing.md }}>
        <Link
          href="/parent/sign-in"
          asChild
        >
          <Pressable
            accessibilityLabel="Continue as parent"
            accessibilityRole="button"
            style={{
              alignItems: "center",
              backgroundColor: choreyTheme.colors.primary,
              borderColor: choreyTheme.colors.primaryPressed,
              borderRadius: choreyTheme.radii.pill,
              borderWidth: 1,
              paddingVertical: 16,
              ...choreyTheme.shadows.button,
            }}
          >
            <Text
              style={{
                color: choreyTheme.colors.cream1,
                fontSize: 16,
                fontWeight: "800",
              }}
            >
              Parent
            </Text>
          </Pressable>
        </Link>

        <Link
          href="/child/access"
          asChild
        >
          <Pressable
            accessibilityLabel="Continue as child"
            accessibilityRole="button"
            style={{
              alignItems: "center",
              backgroundColor: choreyTheme.colors.surface,
              borderRadius: choreyTheme.radii.pill,
              borderColor: choreyTheme.colors.borderMedium,
              borderWidth: 1,
              paddingVertical: 16,
            }}
          >
            <Text
              style={{
                color: choreyTheme.colors.ink1,
                fontSize: 16,
                fontWeight: "800",
              }}
            >
              Child
            </Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
