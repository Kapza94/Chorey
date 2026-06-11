import { useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import { splitRewardCents } from "@/features/chores/money";
import { KidHomeScreen } from "@/features/kid-home/kid-home-screen";
import { DEFAULT_CURRENCY, formatMoney } from "@/features/money/currency";
import { OBPrimary, OBSecondary, OBShell, OBTitle } from "@/features/onboarding/onboarding-kit";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

/* ---------- demo data ---------- */

// The tour runs before a country is chosen, so amounts show in the default
// currency — the same convention the "big idea" explainer uses.
export const DEMO_KID_NAME = "Mia";
export const DEMO_CHORE = { name: "Feed the dog", valueCents: 200 };

const DEMO_SPLIT = splitRewardCents(DEMO_CHORE.valueCents);

const DEMO_BUCKETS = [
  { tone: "spend", label: "Spend", cents: DEMO_SPLIT.spendCents },
  { tone: "savings", label: "Save", cents: DEMO_SPLIT.savingsCents },
  { tone: "giving", label: "Give", cents: DEMO_SPLIT.givingCents },
] as const;

const DEMO_KID_CHORES = [
  { id: "demo-dog", name: DEMO_CHORE.name, valueCents: DEMO_CHORE.valueCents, state: "approved" as const },
  { id: "demo-bed", name: "Make the bed", valueCents: 100, state: "todo" as const },
  { id: "demo-plants", name: "Water the plants", valueCents: 100, state: "todo" as const },
];

/* ---------- tour moment 1: approve a chore, watch the split ---------- */

export function OBDemoApprove({
  onNext,
  onSkip,
  onBack,
}: {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const { scheme, typography, palette } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const [approved, setApproved] = useState(false);

  return (
    <OBShell
      onBack={onBack}
      footer={
        <>
          <OBPrimary
            onPress={() => {
              if (approved) onNext();
            }}
            disabled={!approved}
          >
            Continue
          </OBPrimary>
          <OBSecondary onPress={onSkip}>Skip the tour</OBSecondary>
        </>
      }
    >
      <OBTitle
        title="Try it — approve Mia's chore."
        subtitle="Mia just finished a chore. Approving it is the whole parent job — one tap."
      />

      <View
        style={{
          backgroundColor: scheme.bgRaised,
          borderColor: scheme.border,
          borderWidth: 1.5,
          borderRadius: 18,
          padding: 16,
          gap: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: bucketTokens.savings.ramp[200],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: typography.family.display.bold,
                fontSize: 18,
                color: bucketTokens.savings.ramp[800],
              }}
            >
              {DEMO_KID_NAME[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 17 }]}>
              {DEMO_CHORE.name}
            </Text>
            <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 2 }]}>
              {`${DEMO_KID_NAME} · ${formatMoney(DEMO_CHORE.valueCents, DEFAULT_CURRENCY)}`}
            </Text>
          </View>
          {approved ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: giving[200],
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Check size={13} color={giving[800]} strokeWidth={3} />
              <Text style={[typography.text.label, { fontSize: 12, color: giving[800] }]}>
                Approved
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: scheme.bgSunken,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={[typography.text.label, { fontSize: 12, color: scheme.fgMuted }]}>
                Done · waiting
              </Text>
            </View>
          )}
        </View>

        {!approved ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Approve ${DEMO_CHORE.name}`}
            onPress={() => setApproved(true)}
            style={({ pressed }) => ({
              width: "100%",
              paddingVertical: 13,
              borderRadius: 999,
              alignItems: "center",
              backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
              transform: [{ scale: pressed ? 0.975 : 1 }],
            })}
          >
            <Text style={[typography.text.label, { fontSize: 15, color: palette.cream[4] }]}>
              Approve
            </Text>
          </Pressable>
        ) : null}
      </View>

      {approved ? (
        <View style={{ marginTop: 24 }}>
          {DEMO_BUCKETS.map((bucket, index) => (
            <DemoBucketBar
              key={bucket.label}
              tone={bucket.tone}
              label={bucket.label}
              cents={bucket.cents}
              totalCents={DEMO_CHORE.valueCents}
              delay={index * 180}
            />
          ))}
          <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 4 }]}>
            That split is fixed — 40% Spend, 40% Save, 20% Give. Every chore, every time.
          </Text>
        </View>
      ) : null}
    </OBShell>
  );
}

function DemoBucketBar({
  tone,
  label,
  cents,
  totalCents,
  delay,
}: {
  tone: "spend" | "savings" | "giving";
  label: string;
  cents: number;
  totalCents: number;
  delay: number;
}) {
  const { scheme, typography, bucketInk } = useChoreyTheme();
  const ramp = bucketTokens[tone].ramp;
  // Lazy-init the Animated.Value once (no ref read during render).
  const [grow] = useState(() => new Animated.Value(0));
  const pct = Math.round((cents / totalCents) * 100);

  useEffect(() => {
    const animation = Animated.timing(grow, {
      toValue: 1,
      duration: 550,
      delay,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [grow, delay]);

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontFamily: typography.family.display.bold,
              fontSize: 18,
              color: bucketInk(tone),
            }}
          >
            {pct}%
          </Text>
          <Text style={[typography.text.label, { fontSize: 14, color: scheme.fg }]}>{label}</Text>
        </View>
        <Text style={[typography.text.money, { color: ramp[600] }]}>
          {`+${formatMoney(cents, DEFAULT_CURRENCY)}`}
        </Text>
      </View>
      <View
        style={{
          height: 12,
          backgroundColor: scheme.bgSunken,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            width: grow.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${pct}%`] }),
            height: "100%",
            backgroundColor: ramp[400],
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}

/* ---------- tour moment 2: the kid's side, on the real kid screen ---------- */

export function OBDemoKid({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { scheme } = useChoreyTheme();

  return (
    <OBShell
      onBack={onBack}
      footer={<OBPrimary onPress={onNext}>Continue</OBPrimary>}
    >
      <OBTitle
        title="Here's what Mia sees."
        subtitle="Her own app — today's chores, her three buckets, and goals to save for. Kids join with a code; no email, no billing."
      />
      <View
        pointerEvents="none"
        style={{
          height: 420,
          borderRadius: 28,
          borderColor: scheme.border,
          borderWidth: 2,
          overflow: "hidden",
          backgroundColor: scheme.bgPage,
        }}
      >
        <KidHomeScreen
          name={DEMO_KID_NAME}
          chores={DEMO_KID_CHORES}
          spendCents={DEMO_SPLIT.spendCents}
          savingsCents={DEMO_SPLIT.savingsCents}
          givingCents={DEMO_SPLIT.givingCents}
        />
      </View>
    </OBShell>
  );
}
