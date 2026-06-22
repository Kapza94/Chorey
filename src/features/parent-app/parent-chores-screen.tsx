import { useState, type ReactNode } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { useKeyboardHeight } from "@/components/use-keyboard-height";
import { Check, ChevronRight, Clock, Lock, Plus, Trash2, Undo2 } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import { clampRewardInput, parseRewardCents } from "@/features/chores/money";
import type { Recurrence } from "@/features/chores/recurrence";
import type { ChoreStatus } from "@/features/chores/chore-actions";
import {
  DEFAULT_DUE_TIME,
  DUE_TIME_PRESETS,
  describeOneOffDue,
  formatDueAtTime,
  type DueTime,
} from "@/features/chores/due-time";
import { DEFAULT_SPLIT, splitCents, type Split } from "@/features/money/split";
import { ParentHeader, type ParentKid } from "@/features/parent-app/parent-primitives";
import { fieldStyle } from "@/components/field-style";

export type ChoreLibraryItem = {
  id: string;
  name: string;
  valueCents: number;
  freq: string;
  assignedTo: string;
};

/** A live chore instance for the Chores-tab board (To do / Needs you / Done). */
export type ChoreBoardItem = {
  id: string;
  title: string;
  childName: string;
  rewardCents: number;
  tone: ParentKid["tone"];
  status: ChoreStatus;
  /** how often this chore repeats; null/undefined for a one-off. */
  recurrence?: Recurrence | null;
  /** an overdue recurring chore the child still hasn't done. */
  late?: boolean;
  /** ISO instant this chore is due by, if a deadline was set. */
  dueAt?: string | null;
  sentBackReason?: string | null;
};

export type ChoreAssignee = { id: string; name: string };

/** Which repeat cadence the Chores board is filtered to. */
type RecurFilter = "all" | Recurrence | "one-off";

const RECUR_TABS: { id: RecurFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "one-off", label: "Once" },
];

type Props = {
  currency?: CurrencyCode;
  split?: Split;
  kids?: ParentKid[];
  chores?: ChoreLibraryItem[];
  /** live chore instances grouped into the To do / Needs you / Done board. */
  board?: ChoreBoardItem[];
  assignees?: ChoreAssignee[];
  /** when true, recurring options are paused (the household is lapsed). */
  recurringLocked?: boolean;
  onAddChore?: (input: {
    name: string;
    rewardCents: number;
    assigneeId: string;
    recurrence?: Recurrence;
    dueTime?: DueTime;
  }) => void;
  onApproveChore?: (choreId: string) => void;
  onSendBackChore?: (choreId: string, reason: string) => void;
  onDeleteChore?: (choreId: string) => void;
  headerRight?: ReactNode;
};

export function ParentChoresScreen({
  currency = DEFAULT_CURRENCY,
  split = DEFAULT_SPLIT,
  kids = [],
  chores = [],
  board = [],
  assignees = [],
  recurringLocked = false,
  onAddChore,
  onApproveChore,
  onSendBackChore,
  onDeleteChore,
  headerRight,
}: Props) {
  const { scheme, typography, palette, radius, toybox } = useChoreyTheme();
  const [showAdd, setShowAdd] = useState(false);
  // Which repeat-cadence the parent is viewing. "all" shows everything; a
  // crossed-off weekly chore stays visible under its own tab so the next
  // period's copy isn't a surprise.
  const [recurFilter, setRecurFilter] = useState<RecurFilter>("all");

  const matchesRecur = (item: ChoreBoardItem) =>
    recurFilter === "all"
      ? true
      : recurFilter === "one-off"
        ? !item.recurrence
        : item.recurrence === recurFilter;

  const visible = board.filter(matchesRecur);

  // The board: what's waiting on the parent, what kids still owe, what's done.
  const needsApproval = visible.filter((item) => item.status === "submitted");
  const todo = visible.filter(
    (item) => item.status === "assigned" || item.status === "sent_back",
  );
  const done = visible.filter((item) => item.status === "approved");
  const lateCount = todo.filter((item) => item.late).length;

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: 120 }}
        style={{ flex: 1 }}
      >
        <ParentHeader
          subtitle="This week"
          title="Chores."
          action={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
              {headerRight}
            </View>
          }
        />

        {/* Repeat-cadence tabs — big, clear, tappable. */}
        {board.length > 0 ? (
          <RecurrenceTabs board={board} value={recurFilter} onChange={setRecurFilter} />
        ) : null}

        {/* Assigned-vs-cap per kid */}
        {kids.length > 0 ? (
          <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 18, paddingBottom: 14 }}>
            {kids.map((kid) => (
              <AssignedVsCap key={kid.id} kid={kid} currency={currency} />
            ))}
          </View>
        ) : null}

        {/* Board: Needs you → To do → Done */}
        {visible.length > 0 ? (
          <View style={{ paddingHorizontal: 18, gap: 10, marginBottom: 18 }}>
            {needsApproval.length > 0 ? (
              <BoardSection title="Needs your approval" count={needsApproval.length}>
                {needsApproval.map((item) => (
                  <ChoreBoardRow
                    key={item.id}
                    item={item}
                    currency={currency}
                    onApprove={() => onApproveChore?.(item.id)}
                    onSendBack={(reason) => onSendBackChore?.(item.id, reason)}
                  />
                ))}
              </BoardSection>
            ) : null}

            {todo.length > 0 ? (
              <BoardSection
                title="To do"
                count={todo.length}
                badge={lateCount > 0 ? `${lateCount} late` : undefined}
              >
                {todo.map((item) => (
                  <ChoreBoardRow
                    key={item.id}
                    item={item}
                    currency={currency}
                    onDelete={onDeleteChore ? () => onDeleteChore(item.id) : undefined}
                  />
                ))}
              </BoardSection>
            ) : null}

            {done.length > 0 ? (
              <BoardSection title="Done" count={done.length} muted>
                {done.map((item) => (
                  <ChoreBoardRow key={item.id} item={item} currency={currency} />
                ))}
              </BoardSection>
            ) : null}
          </View>
        ) : null}

        {/* Filter matched nothing, but other chores exist — explain the empty tab. */}
        {board.length > 0 && visible.length === 0 ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 }}>
            <Text style={[typography.text.bodySm, { color: scheme.fgMuted }]}>
              No {recurFilter === "one-off" ? "one-off" : recurFilter} chores right now.
            </Text>
          </View>
        ) : null}

        {/* Empty state — no live chores and no library to show. */}
        {board.length === 0 && chores.length === 0 ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 8, gap: 8 }}>
            <Text
              style={{
                fontFamily: typography.family.display.extra,
                fontSize: 24,
                letterSpacing: -0.5,
                color: scheme.fg,
              }}
            >
              No chores yet.
            </Text>
            <Text style={[typography.text.bodySm, { color: scheme.fgMuted }]}>
              Tap New to add the first chore. As kids finish them, they show up
              here to approve.
            </Text>
          </View>
        ) : null}

        {/* Library (the flat catalog) — only when explicitly provided. */}
        {chores.length > 0 ? (
          <>
            <Text
              style={[
                typography.text.overline,
                { color: scheme.fgFaint, paddingHorizontal: 22, paddingBottom: 8 },
              ]}
            >
              Library
            </Text>
            <View
              style={{
                marginHorizontal: 18,
                backgroundColor: scheme.bgModal,
                borderColor: scheme.toy.border,
                borderWidth: toybox.borderWidth,
                ...scheme.toy.shadowSm,
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
          </>
        ) : null}
      </ScrollView>

      <AddChoreSheet
        visible={showAdd}
        currency={currency}
        split={split}
        assignees={assignees}
        recurringLocked={recurringLocked}
        onClose={() => setShowAdd(false)}
        onConfirm={(input) => {
          onAddChore?.(input);
          setShowAdd(false);
        }}
      />
    </View>
  );
}

function RecurrenceTabs({
  board,
  value,
  onChange,
}: {
  board: ChoreBoardItem[];
  value: RecurFilter;
  onChange: (next: RecurFilter) => void;
}) {
  const { scheme, typography, palette, radius, toybox } = useChoreyTheme();

  const countFor = (id: RecurFilter) =>
    id === "all"
      ? board.length
      : id === "one-off"
        ? board.filter((item) => !item.recurrence).length
        : board.filter((item) => item.recurrence === id).length;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingBottom: 14 }}
    >
      {RECUR_TABS.map((tab) => {
        const selected = tab.id === value;
        const count = countFor(tab.id);
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={`Show ${tab.label} chores`}
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: radius.pill,
              backgroundColor: selected ? palette.accent[600] : scheme.bgModal,
              borderWidth: toybox.borderWidth,
              borderColor: selected ? palette.accent[800] : scheme.toy.border,
              ...(selected ? null : scheme.toy.shadowSm),
            }}
          >
            <Text
              style={[
                typography.text.label,
                { fontSize: 13, color: selected ? palette.cream[4] : scheme.fg },
              ]}
            >
              {tab.label}
            </Text>
            {count > 0 ? (
              <View
                style={{
                  minWidth: 18,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  backgroundColor: selected ? "rgba(255, 252, 245, 0.28)" : scheme.bgSunken,
                }}
              >
                <Text
                  style={[
                    typography.text.caption,
                    {
                      fontSize: 11,
                      fontWeight: "700",
                      color: selected ? palette.cream[4] : scheme.fgMuted,
                    },
                  ]}
                >
                  {count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function BoardSection({
  title,
  count,
  badge,
  muted = false,
  children,
}: {
  title: string;
  count: number;
  badge?: string;
  muted?: boolean;
  children: ReactNode;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 4,
          paddingBottom: 8,
          paddingTop: 4,
        }}
      >
        <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
          {title} · {count}
        </Text>
        {badge ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: radius.pill,
              backgroundColor: scheme.tint.warning,
            }}
          >
            <Text
              style={[
                typography.text.caption,
                { color: palette.semantic.warning[600], fontWeight: "700", fontSize: 11 },
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ gap: 8, opacity: muted ? 0.7 : 1 }}>{children}</View>
    </View>
  );
}

function ChoreBoardRow({
  item,
  currency,
  onApprove,
  onSendBack,
  onDelete,
}: {
  item: ChoreBoardItem;
  currency: CurrencyCode;
  onApprove?: () => void;
  onSendBack?: (reason: string) => void;
  onDelete?: () => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const ramp = bucketTokens[item.tone === "allowance" ? "spend" : item.tone].ramp;
  const [back, setBack] = useState(false);
  const [reason, setReason] = useState("");
  const canSend = reason.trim().length > 0;
  const submitted = item.status === "submitted";
  const approved = item.status === "approved";

  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: scheme.bgRaised,
        borderColor: item.late ? palette.semantic.warning[600] : scheme.border,
        borderWidth: item.late ? 1.5 : 1,
        borderRadius: radius.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={[
                typography.text.h3,
                {
                  color: scheme.fg,
                  fontSize: 15,
                  textDecorationLine: approved ? "line-through" : "none",
                },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.late ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                  backgroundColor: scheme.tint.warning,
                }}
              >
                <Clock size={10} color={palette.semantic.warning[600]} strokeWidth={2.6} />
                <Text
                  style={[
                    typography.text.caption,
                    { color: palette.semantic.warning[600], fontWeight: "700", fontSize: 10 },
                  ]}
                >
                  Late
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
            {item.childName} · {formatMoney(item.rewardCents, currency)}
            {formatDueAtTime(item.dueAt) ? ` · by ${formatDueAtTime(item.dueAt)}` : ""}
          </Text>
          {item.status === "sent_back" && item.sentBackReason ? (
            <Text style={[typography.text.caption, { color: scheme.fgMuted, marginTop: 3 }]}>
              Sent back: {item.sentBackReason}
            </Text>
          ) : null}
        </View>

        {submitted && !back ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Send back ${item.title}`}
              onPress={() => setBack(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: scheme.bgSunken,
              }}
            >
              <Undo2 size={15} color={scheme.fgMuted} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Approve ${item.title}`}
              onPress={onApprove}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: radius.pill,
                backgroundColor: pressed ? ramp[400] : ramp[200],
              })}
            >
              <Check size={14} color={ramp[800]} strokeWidth={3} />
              <Text style={[typography.text.label, { color: ramp[800], fontSize: 13 }]}>Approve</Text>
            </Pressable>
          </View>
        ) : approved ? (
          <Check size={18} color={ramp[600]} strokeWidth={3} />
        ) : onDelete && !back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.title}`}
            onPress={() =>
              Alert.alert(
                "Delete chore?",
                `"${item.title}" will be removed for ${item.childName}.`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: onDelete },
                ],
              )
            }
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: scheme.bgSunken,
            }}
          >
            <Trash2 size={15} color={scheme.fgMuted} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      {submitted && back ? (
        <View style={{ marginTop: 10 }}>
          <TextInput
            accessibilityLabel="Send-back reason"
            value={reason}
            onChangeText={setReason}
            placeholder="What needs fixing?"
            placeholderTextColor={scheme.fgFaint}
            autoFocus
            style={fieldStyle(scheme, typography.family.body.regular)}
          />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel send back"
              onPress={() => {
                setBack(false);
                setReason("");
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: radius.pill,
                backgroundColor: scheme.bgSunken,
              }}
            >
              <Text style={[typography.text.label, { color: scheme.fgMuted, fontSize: 13 }]}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm send back"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={() => {
                onSendBack?.(reason.trim());
                setBack(false);
                setReason("");
              }}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: radius.pill,
                backgroundColor: canSend
                  ? pressed
                    ? palette.semantic.warning[600]
                    : scheme.tint.warning
                  : scheme.bgSunken,
                opacity: canSend ? 1 : 0.6,
              })}
            >
              <Text
                style={[
                  typography.text.label,
                  { color: canSend ? palette.semantic.warning[600] : scheme.fgFaint, fontSize: 13 },
                ]}
              >
                Send back
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function AssignedVsCap({ kid, currency }: { kid: ParentKid; currency: CurrencyCode }) {
  const { scheme, typography, palette, radius, toybox } = useChoreyTheme();
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
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        ...scheme.toy.shadowSm,
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
  recurringLocked,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  currency: CurrencyCode;
  split: Split;
  assignees: ChoreAssignee[];
  recurringLocked: boolean;
  onClose: () => void;
  onConfirm: (input: {
    name: string;
    rewardCents: number;
    assigneeId: string;
    recurrence?: Recurrence;
    dueTime?: DueTime;
  }) => void;
}) {
  const { scheme, typography, palette, radius, bucketInk } = useChoreyTheme();
  const keyboardHeight = useKeyboardHeight();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [showAllAssignees, setShowAllAssignees] = useState(false);
  const [assigneeId, setAssigneeId] = useState(assignees[0]?.id ?? "all");
  const [repeat, setRepeat] = useState<"one-off" | Recurrence>("one-off");
  const [dueTime, setDueTime] = useState<DueTime>(DEFAULT_DUE_TIME);
  const [showRecurUpsell, setShowRecurUpsell] = useState(false);

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

  // A chore must be named and carry a reward — a blank reward silently creates
  // a $0 chore whose approval never reaches a wallet, which reads as a bug.
  const canAdd = name.trim().length > 0 && rewardCents > 0;

  const reset = () => {
    setName("");
    setValue("");
    setAssigneeId(assignees[0]?.id ?? "all");
    setShowAllAssignees(false);
    setRepeat("one-off");
    setDueTime(DEFAULT_DUE_TIME);
    setShowRecurUpsell(false);
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
          bottom: keyboardHeight,
          backgroundColor: scheme.bgModal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 22,
          paddingTop: 14,
          paddingBottom: 30,
          ...scheme.shadow.lg,
        }}
      >
        {/* Tapping the grabber dismisses — with the number pad up the backdrop
            scrolls off-screen, so this is the reliable way out. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => {
            reset();
            onClose();
          }}
          hitSlop={12}
          style={{
            width: 38,
            height: 4,
            borderRadius: radius.pill,
            backgroundColor: palette.border.strong,
            alignSelf: "center",
            marginBottom: 14,
          }}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24 }]}>
            New chore.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={() => {
              reset();
              onClose();
            }}
            hitSlop={8}
          >
            <Text style={[typography.text.label, { color: scheme.fgMuted, fontSize: 15 }]}>
              Cancel
            </Text>
          </Pressable>
        </View>

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          Name
        </Text>
        <TextInput
          accessibilityLabel="Chore name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Make the bed"
          placeholderTextColor={scheme.fgFaint}
          style={[fieldStyle(scheme, typography.family.body.regular), { marginBottom: 14 }]}
        />

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          Reward
        </Text>
        <TextInput
          accessibilityLabel="Chore reward"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={(raw) => setValue(clampRewardInput(raw))}
          placeholder="2.00"
          placeholderTextColor={scheme.fgFaint}
          style={[fieldStyle(scheme, typography.family.body.regular), { marginBottom: 14 }]}
        />

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          Assign to
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {visibleKids.map(renderChip)}
          {hasMoreKids ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show more children"
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
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: showRecurUpsell ? 8 : 16 }}>
          {REPEAT_OPTIONS.map((option) => {
            const selected = option.id === repeat;
            // Recurring chores pause with the subscription (lapsed household).
            const locked = recurringLocked && option.id !== "one-off";
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={`Repeat ${option.label}`}
                accessibilityState={{ selected, disabled: locked }}
                onPress={() => {
                  if (locked) {
                    setShowRecurUpsell(true);
                    return;
                  }
                  setShowRecurUpsell(false);
                  setRepeat(option.id);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: radius.sm,
                  backgroundColor: selected ? bucketTokens.spend.ramp[200] : scheme.bgPage,
                  borderWidth: 1.5,
                  borderColor: selected ? bucketTokens.spend.ramp[400] : palette.border.mid,
                  opacity: locked ? 0.6 : 1,
                }}
              >
                {locked ? <Lock size={11} color={scheme.fgFaint} strokeWidth={2.4} /> : null}
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

        {showRecurUpsell ? (
          <Text style={[typography.text.caption, { color: scheme.fgMuted, marginBottom: 16 }]}>
            Chorey is paused — resume your subscription to use repeats.
          </Text>
        ) : null}

        {/* Due-by time — when the chore should be done by. */}
        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          Due by
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {DUE_TIME_PRESETS.map((option) => {
            const selected = option.value === dueTime;
            return (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                accessibilityLabel={`Due by ${option.label}`}
                accessibilityState={{ selected }}
                onPress={() => setDueTime(option.value)}
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

        {/* For a one-off, spell out the resolved date so a past time rolling to
            tomorrow doesn't look like a bug. */}
        {repeat === "one-off" && describeOneOffDue(dueTime) ? (
          <Text style={[typography.text.caption, { color: scheme.fgMuted, marginTop: -8, marginBottom: 16 }]}>
            {describeOneOffDue(dueTime)}
          </Text>
        ) : null}

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
          accessibilityState={{ disabled: !canAdd }}
          disabled={!canAdd}
          onPress={() => {
            if (!canAdd) {
              return;
            }
            onConfirm({
              name: name.trim(),
              rewardCents,
              assigneeId,
              recurrence: repeat === "one-off" ? undefined : repeat,
              dueTime,
            });
            reset();
          }}
          style={({ pressed }) => ({
            alignItems: "center",
            paddingVertical: 14,
            borderRadius: radius.pill,
            backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
            opacity: canAdd ? 1 : 0.45,
          })}
        >
          <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 15 }]}>
            Add chore
          </Text>
        </Pressable>
        {!canAdd ? (
          <Text
            style={[
              typography.text.caption,
              { color: scheme.fgFaint, textAlign: "center", marginTop: 10 },
            ]}
          >
            Add a name and a reward to continue.
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}
