import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ChevronRight, Plus } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import { parseRewardCents } from "@/features/chores/money";
import type { Recurrence } from "@/features/chores/recurrence";
import { DEFAULT_SPLIT, splitCents, type Split } from "@/features/money/split";
import { ParentHeader, type ParentKid } from "@/features/parent-app/parent-primitives";

export type ChoreLibraryItem = {
  id: string;
  name: string;
  valueCents: number;
  freq: string;
  assignedTo: string;
};

export type ChoreAssignee = { id: string; name: string };

type Props = {
  currency?: CurrencyCode;
  split?: Split;
  kids?: ParentKid[];
  chores?: ChoreLibraryItem[];
  assignees?: ChoreAssignee[];
  onAddChore?: (input: {
    name: string;
    rewardCents: number;
    assigneeId: string;
    recurrence?: Recurrence;
  }) => void;
};

export function ParentChoresScreen({
  currency = DEFAULT_CURRENCY,
  split = DEFAULT_SPLIT,
  kids = [],
  chores = [],
  assignees = [],
  onAddChore,
}: Props) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} style={{ flex: 1 }}>
        <ParentHeader
          subtitle="Library"
          title="Chores."
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New chore"
              onPress={() => setShowAdd(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: radius.pill,
                backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
              })}
            >
              <Plus size={14} color={palette.cream[4]} strokeWidth={2.6} />
              <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 13 }]}>
                New
              </Text>
            </Pressable>
          }
        />

        {/* Assigned-vs-cap per kid */}
        {kids.length > 0 ? (
          <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 18, paddingBottom: 14 }}>
            {kids.map((kid) => (
              <AssignedVsCap key={kid.id} kid={kid} currency={currency} />
            ))}
          </View>
        ) : null}

        {/* Library */}
        <View
          style={{
            marginHorizontal: 18,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {chores.map((chore, index) => (
            <View
              key={chore.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: index < chores.length - 1 ? 1 : 0,
                borderBottomColor: scheme.border,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>
                  {chore.name}
                </Text>
                <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 2 }]}>
                  {chore.freq} · {chore.assignedTo}
                </Text>
              </View>
              <Text style={[typography.text.money, { fontSize: 15, color: scheme.fg }]}>
                {formatMoney(chore.valueCents, currency)}
              </Text>
              <ChevronRight size={16} color={scheme.fgFaint} strokeWidth={2} />
            </View>
          ))}
        </View>
      </ScrollView>

      <AddChoreSheet
        visible={showAdd}
        currency={currency}
        split={split}
        assignees={assignees}
        onClose={() => setShowAdd(false)}
        onConfirm={(input) => {
          onAddChore?.(input);
          setShowAdd(false);
        }}
      />
    </View>
  );
}

function AssignedVsCap({ kid, currency }: { kid: ParentKid; currency: CurrencyCode }) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const tone = bucketTokens[kid.tone === "allowance" ? "spend" : kid.tone].ramp;
  const over = kid.assignedCents > kid.budgetCents;
  const pct =
    kid.budgetCents > 0
      ? Math.min(100, Math.round((kid.assignedCents / kid.budgetCents) * 100))
      : 0;
  const leftCents = Math.max(0, kid.budgetCents - kid.assignedCents);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: scheme.bgRaised,
        borderColor: scheme.border,
        borderWidth: 1,
        borderRadius: radius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[typography.text.label, { color: scheme.fg }]}>{kid.name}</Text>
        <Text
          style={[
            typography.text.caption,
            { color: over ? palette.semantic.warning[600] : scheme.fgFaint, fontWeight: "700" },
          ]}
        >
          {over ? "over cap" : `${formatMoney(leftCents, currency)} left`}
        </Text>
      </View>
      <Text style={[typography.text.caption, { color: scheme.fgMuted, marginTop: 4, marginBottom: 7 }]}>
        <Text style={{ color: scheme.fg, fontWeight: "700" }}>
          {formatMoney(kid.assignedCents, currency)}
        </Text>{" "}
        of {formatMoney(kid.budgetCents, currency)}/{kid.cadence === "monthly" ? "mo" : "wk"}
      </Text>
      <View
        style={{
          height: 6,
          backgroundColor: scheme.bgSunken,
          borderRadius: radius.pill,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: radius.pill,
            backgroundColor: over ? palette.semantic.warning[600] : tone[400],
          }}
        />
      </View>
    </View>
  );
}

function AddChoreSheet({
  visible,
  currency,
  split,
  assignees,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  currency: CurrencyCode;
  split: Split;
  assignees: ChoreAssignee[];
  onClose: () => void;
  onConfirm: (input: {
    name: string;
    rewardCents: number;
    assigneeId: string;
    recurrence?: Recurrence;
  }) => void;
}) {
  const { scheme, typography, palette, radius, bucketInk } = useChoreyTheme();
  const [name, setName] = useState("");
  const [value, setValue] = useState("2.00");
  const [showAllAssignees, setShowAllAssignees] = useState(false);
  const [assigneeId, setAssigneeId] = useState(assignees[0]?.id ?? "all");
  const [repeat, setRepeat] = useState<"one-off" | Recurrence>("one-off");

  // "Everyone" only makes sense with more than one kid. Names are capped at
  // three behind a More toggle so the panel stays calm with a big family.
  const showEveryone = assignees.length > 1;
  const visibleKids = showAllAssignees ? assignees : assignees.slice(0, 3);
  const hasMoreKids = assignees.length > 3 && !showAllAssignees;

  let rewardCents = 0;
  try {
    rewardCents = parseRewardCents(value);
  } catch {
    rewardCents = 0;
  }
  const preview = splitCents(rewardCents, split);

  const reset = () => {
    setName("");
    setValue("2.00");
    setAssigneeId(assignees[0]?.id ?? "all");
    setShowAllAssignees(false);
    setRepeat("one-off");
  };

  const REPEAT_OPTIONS: { id: "one-off" | Recurrence; label: string }[] = [
    { id: "one-off", label: "One-off" },
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
  ];

  const renderChip = (option: ChoreAssignee) => {
    const selected = option.id === assigneeId;
    return (
      <Pressable
        key={option.id}
        accessibilityRole="button"
        accessibilityLabel={`Assign to ${option.name}`}
        accessibilityState={{ selected }}
        onPress={() => setAssigneeId(option.id)}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: radius.sm,
          backgroundColor: selected ? bucketTokens.spend.ramp[200] : scheme.bgPage,
          borderWidth: 1.5,
          borderColor: selected ? bucketTokens.spend.ramp[400] : palette.border.mid,
        }}
      >
        <Text
          style={[
            typography.text.label,
            { color: selected ? bucketTokens.spend.ramp[800] : scheme.fgMuted, fontSize: 13 },
          ]}
        >
          {option.name}
        </Text>
      </Pressable>
    );
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
            marginBottom: 14,
          }}
        />
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, marginBottom: 16 }]}>
          New chore.
        </Text>

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          Name
        </Text>
        <TextInput
          accessibilityLabel="Chore name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Make the bed"
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
            marginBottom: 14,
          }}
        />

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          Reward
        </Text>
        <TextInput
          accessibilityLabel="Chore reward"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
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
            marginBottom: 14,
          }}
        />

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          Assign to
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {visibleKids.map(renderChip)}
          {hasMoreKids ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show more kids"
              onPress={() => setShowAllAssignees(true)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: radius.sm,
                backgroundColor: scheme.bgPage,
                borderWidth: 1.5,
                borderColor: palette.border.mid,
              }}
            >
              <Text style={[typography.text.label, { color: scheme.fgMuted, fontSize: 13 }]}>
                More…
              </Text>
            </Pressable>
          ) : null}
          {showEveryone ? renderChip({ id: "all", name: "Everyone" }) : null}
        </View>

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          Repeat
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {REPEAT_OPTIONS.map((option) => {
            const selected = option.id === repeat;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={`Repeat ${option.label}`}
                accessibilityState={{ selected }}
                onPress={() => setRepeat(option.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: radius.sm,
                  backgroundColor: selected ? bucketTokens.spend.ramp[200] : scheme.bgPage,
                  borderWidth: 1.5,
                  borderColor: selected ? bucketTokens.spend.ramp[400] : palette.border.mid,
                }}
              >
                <Text
                  style={[
                    typography.text.label,
                    { color: selected ? bucketTokens.spend.ramp[800] : scheme.fgMuted, fontSize: 13 },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Live split preview */}
        <View
          style={{
            backgroundColor: scheme.bgSunken,
            borderRadius: radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 16,
          }}
        >
          <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 8 }]}>
            How {formatMoney(rewardCents, currency)} splits
          </Text>
          <View style={{ flexDirection: "row", height: 8, borderRadius: radius.pill, overflow: "hidden", gap: 2 }}>
            <View style={{ flex: split.spend, backgroundColor: bucketTokens.spend.ramp[400] }} />
            <View style={{ flex: split.save, backgroundColor: bucketTokens.savings.ramp[400] }} />
            <View style={{ flex: split.give, backgroundColor: bucketTokens.giving.ramp[400] }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
              <Text style={{ color: bucketInk("spend"), fontWeight: "700" }}>
                {formatMoney(preview.spendCents, currency)}
              </Text>{" "}
              spend
            </Text>
            <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
              <Text style={{ color: bucketInk("savings"), fontWeight: "700" }}>
                {formatMoney(preview.savingsCents, currency)}
              </Text>{" "}
              save
            </Text>
            <Text style={[typography.text.caption, { color: scheme.fgMuted }]}>
              <Text style={{ color: bucketInk("giving"), fontWeight: "700" }}>
                {formatMoney(preview.givingCents, currency)}
              </Text>{" "}
              give
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add chore"
          onPress={() => {
            onConfirm({
              name: name.trim(),
              rewardCents,
              assigneeId,
              recurrence: repeat === "one-off" ? undefined : repeat,
            });
            reset();
          }}
          style={({ pressed }) => ({
            alignItems: "center",
            paddingVertical: 14,
            borderRadius: radius.pill,
            backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
          })}
        >
          <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 15 }]}>
            Add chore
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
