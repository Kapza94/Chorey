import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ChevronRight, Heart, Lock, LogOut, Target } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import { parseRewardCents } from "@/features/chores/money";

/** The kid's single savings goal — a name and a target to fill toward. */
export type KidSavingsGoal = { name: string; targetCents: number };

type Props = {
  name?: string;
  age?: number | null;
  currency?: CurrencyCode;
  savingsCents?: number;
  givingCents?: number;
  causeName?: string | null;
  savingsGoal?: KidSavingsGoal | null;
  onSetSavingsGoal?: (input: { name: string; targetCents: number }) => void;
  onSuggestCause?: (name: string) => void;
  onLogOut?: () => void;
};

export function KidYouScreen({
  name = "there",
  age,
  currency = DEFAULT_CURRENCY,
  savingsCents = 0,
  givingCents = 0,
  causeName,
  savingsGoal,
  onSetSavingsGoal,
  onSuggestCause,
  onLogOut,
}: Props) {
  const { scheme, typography, radius, bucketInk } = useChoreyTheme();
  const savings = bucketTokens.savings.ramp;
  const giving = bucketTokens.giving.ramp;
  const allowance = bucketTokens.spend.ramp;
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const [suggesting, setSuggesting] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);

  // Only wired actions ship on the kid surface — no dead buttons.
  const quickActions = [
    { label: "Suggest a cause", Icon: Heart, onPress: () => setSuggesting(true) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 120 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 12 }}>
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>Profile</Text>
          <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 32, marginTop: 2 }]}>
            You.
          </Text>
        </View>

        {/* Avatar row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 22,
            paddingBottom: 18,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: radius.pill,
              backgroundColor: allowance[200],
              borderColor: scheme.border,
              borderWidth: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: typography.family.display.semibold,
                fontSize: 26,
                color: allowance[800],
              }}
            >
              {initial}
            </Text>
          </View>
          <View>
            <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 17 }]}>{name}</Text>
            {typeof age === "number" ? (
              <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
                {age} years old
              </Text>
            ) : null}
          </View>
        </View>

        {/* Savings + Giving */}
        <View
          style={{
            marginHorizontal: 18,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {/* Savings (locked) */}
          <View
            style={{
              paddingHorizontal: 18,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: scheme.border,
            }}
          >
            <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
              Savings (locked)
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <Text style={[typography.text.moneyHero, { color: bucketInk("savings"), fontSize: 36 }]}>
                {formatMoney(savingsCents, currency)}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                  backgroundColor: scheme.tint.savings,
                }}
              >
                <Lock size={11} color={savings[600]} strokeWidth={2.4} />
                <Text style={[typography.text.caption, { color: savings[600], fontWeight: "700" }]}>
                  not spendable
                </Text>
              </View>
            </View>

            {/* Saving toward something beats saving toward nothing. */}
            {savingsGoal ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change savings goal"
                onPress={() => setEditingGoal(true)}
                style={{ marginTop: 12 }}
              >
                <View
                  style={{
                    height: 8,
                    flexDirection: "row",
                    borderRadius: radius.pill,
                    overflow: "hidden",
                    backgroundColor: scheme.bgSunken,
                  }}
                >
                  <View
                    style={{
                      flex: Math.min(savingsCents / savingsGoal.targetCents, 1),
                      backgroundColor: savings[400],
                    }}
                  />
                  <View
                    style={{
                      flex: Math.max(1 - savingsCents / savingsGoal.targetCents, 0),
                    }}
                  />
                </View>
                <Text style={[typography.text.caption, { color: scheme.fgMuted, marginTop: 6 }]}>
                  Saving for {savingsGoal.name} — {formatMoney(savingsCents, currency)} of{" "}
                  {formatMoney(savingsGoal.targetCents, currency)}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set a savings goal"
                onPress={() => setEditingGoal(true)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 12,
                  paddingVertical: 10,
                  borderRadius: radius.pill,
                  backgroundColor: pressed ? savings[200] : scheme.tint.savings,
                })}
              >
                <Target size={13} color={savings[600]} strokeWidth={2.4} />
                <Text style={[typography.text.label, { color: savings[600], fontSize: 13 }]}>
                  Set a savings goal
                </Text>
              </Pressable>
            )}
          </View>

          {/* Giving — a parent confirms the handoff at settlement, not the kid. */}
          <View style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
            <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>Giving</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <Text style={[typography.text.moneyHero, { color: bucketInk("giving"), fontSize: 36 }]}>
                {formatMoney(givingCents, currency)}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                  backgroundColor: scheme.tint.giving,
                }}
              >
                <Heart size={11} color={giving[600]} strokeWidth={2.4} />
                <Text style={[typography.text.caption, { color: giving[600], fontWeight: "700" }]}>
                  for your cause
                </Text>
              </View>
            </View>
            {causeName ? (
              <View
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: radius.sm,
                  backgroundColor: scheme.tint.giving,
                }}
              >
                <Text style={[typography.text.caption, { color: scheme.fg }]}>
                  <Text style={{ fontWeight: "700" }}>Giving goes to:</Text> {causeName}. You
                  hand it over together with a parent.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Quick actions */}
        <Text
          style={[
            typography.text.overline,
            { color: scheme.fgFaint, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 8 },
          ]}
        >
          Quick actions
        </Text>
        <View
          style={{
            marginHorizontal: 18,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: radius.md,
            overflow: "hidden",
          }}
        >
          {quickActions.map((action, index) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: index < quickActions.length - 1 ? 1 : 0,
                borderBottomColor: scheme.border,
              }}
            >
              <action.Icon size={18} color={scheme.fgMuted} strokeWidth={2} />
              <Text style={[typography.text.label, { flex: 1, color: scheme.fg }]}>
                {action.label}
              </Text>
              <ChevronRight size={16} color={scheme.fgFaint} strokeWidth={2} />
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={onLogOut}
          style={({ pressed }) => ({
            marginHorizontal: 18,
            marginTop: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: radius.md,
            backgroundColor: pressed ? scheme.bgSunken : scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
          })}
        >
          <LogOut size={17} color={scheme.fgMuted} strokeWidth={2.2} />
          <Text style={[typography.text.label, { color: scheme.fgMuted, fontSize: 15 }]}>
            Log out
          </Text>
        </Pressable>
      </ScrollView>

      <SuggestCauseSheet
        visible={suggesting}
        onClose={() => setSuggesting(false)}
        onConfirm={(causeName) => {
          onSuggestCause?.(causeName);
          setSuggesting(false);
        }}
      />
      <SavingsGoalSheet
        visible={editingGoal}
        currentGoal={savingsGoal ?? null}
        onClose={() => setEditingGoal(false)}
        onConfirm={(goal) => {
          onSetSavingsGoal?.(goal);
          setEditingGoal(false);
        }}
      />
    </View>
  );
}

function SavingsGoalSheet({
  visible,
  currentGoal,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  currentGoal: KidSavingsGoal | null;
  onClose: () => void;
  onConfirm: (goal: { name: string; targetCents: number }) => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const savings = bucketTokens.savings.ramp;
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");

  const nameValue = name || currentGoal?.name || "";

  let targetCents = 0;
  try {
    targetCents = parseRewardCents(cost);
  } catch {
    targetCents = 0;
  }
  const canSave = nameValue.trim().length > 0 && targetCents > 0;

  const reset = () => {
    setName("");
    setCost("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={() => {
          reset();
          onClose();
        }}
        style={{ flex: 1, backgroundColor: "rgba(42, 32, 24, 0.32)" }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: scheme.bgModal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 22,
          paddingTop: 14,
          paddingBottom: 30,
          ...scheme.shadow.lg,
        }}
      >
        <View
          style={{
            width: 38,
            height: 4,
            borderRadius: radius.pill,
            backgroundColor: palette.border.strong,
            alignSelf: "center",
            marginBottom: 16,
          }}
        />
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, marginBottom: 6 }]}>
          {currentGoal ? "Change your goal." : "Save up for something."}
        </Text>
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginBottom: 16 }]}>
          Your Savings fills up toward it, chore by chore.
        </Text>

        <TextInput
          accessibilityLabel="Goal name"
          value={nameValue}
          onChangeText={setName}
          placeholder="e.g. New bike"
          placeholderTextColor={scheme.fgFaint}
          style={{
            backgroundColor: scheme.bgPage,
            borderColor: palette.border.mid,
            borderWidth: 1,
            borderRadius: radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 11,
            fontFamily: typography.family.body.regular,
            fontSize: 15,
            color: scheme.fg,
            marginBottom: 10,
          }}
        />
        <TextInput
          accessibilityLabel="Goal cost"
          keyboardType="decimal-pad"
          value={cost}
          onChangeText={setCost}
          placeholder="60.00"
          placeholderTextColor={scheme.fgFaint}
          style={{
            backgroundColor: scheme.bgPage,
            borderColor: palette.border.mid,
            borderWidth: 1,
            borderRadius: radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 11,
            fontFamily: typography.family.body.regular,
            fontSize: 15,
            color: scheme.fg,
            marginBottom: 20,
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save goal"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={() => {
            onConfirm({ name: nameValue.trim(), targetCents });
            reset();
          }}
          style={({ pressed }) => ({
            alignItems: "center",
            paddingVertical: 14,
            borderRadius: radius.pill,
            backgroundColor: canSave
              ? pressed
                ? savings[400]
                : savings[200]
              : scheme.bgSunken,
            opacity: canSave ? 1 : 0.6,
          })}
        >
          <Text
            style={[
              typography.text.label,
              { color: canSave ? savings[800] : scheme.fgFaint, fontSize: 15 },
            ]}
          >
            {currentGoal ? "Update goal" : "Start saving"}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function SuggestCauseSheet({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const [name, setName] = useState("");
  const canSave = name.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={() => {
          setName("");
          onClose();
        }}
        style={{ flex: 1, backgroundColor: "rgba(42, 32, 24, 0.32)" }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: scheme.bgModal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 22,
          paddingTop: 14,
          paddingBottom: 30,
          ...scheme.shadow.lg,
        }}
      >
        <View
          style={{
            width: 38,
            height: 4,
            borderRadius: radius.pill,
            backgroundColor: palette.border.strong,
            alignSelf: "center",
            marginBottom: 16,
          }}
        />
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, marginBottom: 6 }]}>
          Suggest a cause.
        </Text>
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginBottom: 16 }]}>
          A parent approves it before you can give to it.
        </Text>

        <TextInput
          accessibilityLabel="Cause name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Animal shelter"
          placeholderTextColor={scheme.fgFaint}
          style={{
            backgroundColor: scheme.bgPage,
            borderColor: palette.border.mid,
            borderWidth: 1,
            borderRadius: radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 11,
            fontFamily: typography.family.body.regular,
            fontSize: 15,
            color: scheme.fg,
            marginBottom: 20,
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send suggestion"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={() => {
            onConfirm(name.trim());
            setName("");
          }}
          style={({ pressed }) => ({
            alignItems: "center",
            paddingVertical: 14,
            borderRadius: radius.pill,
            backgroundColor: canSave
              ? pressed
                ? giving[400]
                : giving[200]
              : scheme.bgSunken,
            opacity: canSave ? 1 : 0.6,
          })}
        >
          <Text
            style={[
              typography.text.label,
              { color: canSave ? giving[800] : scheme.fgFaint, fontSize: 15 },
            ]}
          >
            Send to a parent
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
