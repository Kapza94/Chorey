import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MessageCircle, Plus, Send } from "lucide-react-native";

import { useKeyboardHeight } from "@/components/use-keyboard-height";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import { fieldStyle } from "@/components/field-style";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import { parseRewardCents } from "@/features/chores/money";
import type { WishNote } from "@/features/spend-wishlist/spend-wishlist-actions";

export type KidWish = {
  id: string;
  name: string;
  targetCents: number;
  /** active = can be requested when affordable; requested = awaiting parent; purchased = bought */
  status: "active" | "requested" | "purchased";
  /** a new note from a parent the kid hasn't opened yet. */
  hasUnread?: boolean;
  /** number of parent notes the kid hasn't opened yet. */
  unreadNoteCount?: number;
  /** latest note on this wish, visible without opening the thread. */
  latestNote?: {
    authorKind: "parent" | "child";
    body: string;
  } | null;
};

type Props = {
  currency?: CurrencyCode;
  /** the kid's current Spend (allowance) balance — "spendable now" */
  spendableCents?: number;
  wishes?: KidWish[];
  onRequestPurchase?: (wishId: string) => void;
  onAddWish?: (input: { name: string; targetCents: number }) => void;
  /** open a wish's note thread — the route fetches and feeds `notes`. */
  onOpenNotes?: (wishId: string) => void;
  /** post a note from the child onto the open wish. */
  onAddNote?: (wishId: string, body: string) => Promise<void> | void;
  /** notes for the currently-open wish, in order. */
  notes?: WishNote[];
  notesLoading?: boolean;
};

export function KidWishlistScreen({
  currency = DEFAULT_CURRENCY,
  spendableCents = 0,
  wishes = [],
  onRequestPurchase,
  onAddWish,
  onOpenNotes,
  onAddNote,
  notes,
  notesLoading = false,
}: Props) {
  const { scheme, typography, palette, radius, toybox, bucketInk } = useChoreyTheme();
  const allowance = bucketTokens.spend.ramp;
  const [adding, setAdding] = useState(false);
  // Which wish's note thread is open.
  const [notesWishId, setNotesWishId] = useState<string | null>(null);
  const notesWish = wishes.find((wish) => wish.id === notesWishId) ?? null;

  const openNotes = (wishId: string) => {
    setNotesWishId(wishId);
    onOpenNotes?.(wishId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 120 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: 6 }}>
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
            What you&apos;re saving for
          </Text>
          <Text
            style={{
              fontFamily: typography.family.display.extra,
              fontSize: 34,
              letterSpacing: -0.8,
              color: scheme.fg,
              marginTop: 2,
            }}
          >
            Wishlist.
          </Text>
        </View>

        {/* Spendable now */}
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 8,
            backgroundColor: scheme.bgModal,
            borderColor: scheme.toy.border,
            borderWidth: toybox.borderWidth,
            borderRadius: toybox.radius,
            paddingHorizontal: 16,
            paddingVertical: 14,
            ...scheme.toy.shadow,
          }}
        >
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>
            Spendable now
          </Text>
          <Text
            style={[
              typography.text.moneyHero,
              { color: bucketInk("spend"), fontSize: 38, marginTop: 4 },
            ]}
          >
            {formatMoney(spendableCents, currency)}
          </Text>
        </View>

        {/* Count */}
        <Text
          style={[
            typography.text.overline,
            { color: scheme.fgFaint, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 10 },
          ]}
        >
          {wishes.length} {wishes.length === 1 ? "wish" : "wishes"}
        </Text>

        {/* Wishes */}
        <View style={{ gap: 10, paddingHorizontal: 18 }}>
          {wishes.map((wish) => {
            const pct =
              wish.targetCents > 0
                ? Math.min(100, Math.round((spendableCents / wish.targetCents) * 100))
                : 0;
            const affordable = spendableCents >= wish.targetCents;
            const unreadCount = wish.unreadNoteCount ?? (wish.hasUnread ? 1 : 0);
            const notesLabel =
              unreadCount > 0
                ? `Notes for ${wish.name}, ${unreadCount} new ${
                    unreadCount === 1 ? "message" : "messages"
                  }`
                : `Notes for ${wish.name}`;

            return (
              <View
                key={wish.id}
                style={{
                  backgroundColor: scheme.bgModal,
                  borderColor: scheme.toy.border,
                  borderWidth: toybox.borderWidth,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  gap: 10,
                  ...scheme.toy.shadowSm,
                }}
              >
                {unreadCount > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      right: 10,
                      top: 10,
                      minWidth: 20,
                      height: 20,
                      borderRadius: 999,
                      backgroundColor: palette.accent[600],
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 6,
                      zIndex: 1,
                    }}
                  >
                    <Text
                      style={[
                        typography.text.label,
                        { color: palette.cream[4], fontSize: 11 },
                      ]}
                    >
                      {unreadCount}
                    </Text>
                  </View>
                ) : null}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>
                      {wish.name}
                    </Text>
                    <Text
                      style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 2 }]}
                    >
                      {formatMoney(spendableCents, currency)} of{" "}
                      {formatMoney(wish.targetCents, currency)}
                    </Text>
                    {wish.latestNote ? (
                      <Text
                        style={[
                          typography.text.caption,
                          { color: scheme.fgMuted, marginTop: 4 },
                        ]}
                        numberOfLines={2}
                      >
                        {wish.latestNote.authorKind === "parent" ? "Parent" : "You"}:{" "}
                        {wish.latestNote.body}
                      </Text>
                    ) : null}
                  </View>

                  {wish.status === "requested" ? (
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: radius.pill,
                        backgroundColor: scheme.tint.warning,
                      }}
                    >
                      <Text
                        style={[
                          typography.text.label,
                          { color: palette.semantic.warning[600], fontSize: 13 },
                        ]}
                      >
                        Requested
                      </Text>
                    </View>
                  ) : affordable && wish.status === "active" ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Request ${wish.name}`}
                      onPress={() => onRequestPurchase?.(wish.id)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: radius.pill,
                        backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
                      })}
                    >
                      <Text
                        style={[
                          typography.text.label,
                          { color: palette.cream[4], fontSize: 13 },
                        ]}
                      >
                        Request
                      </Text>
                    </Pressable>
                  ) : (
                    <Text
                      style={[
                        typography.text.h1,
                        { color: scheme.fg, fontSize: 22 },
                      ]}
                    >
                      {pct}%
                    </Text>
                  )}
                </View>

                {/* Progress bar — funded from the Spend bucket (peach). */}
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
                      backgroundColor: allowance[400],
                      borderRadius: radius.pill,
                    }}
                  />
                </View>

                {/* Notes thread — talk to a parent about this wish. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={notesLabel}
                  onPress={() => openNotes(wish.id)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" }}
                >
                  <MessageCircle size={15} color={scheme.fgMuted} strokeWidth={2.2} />
                  <Text style={[typography.text.label, { color: scheme.fgMuted, fontSize: 13 }]}>
                    Notes
                  </Text>
                  {unreadCount > 0 ? (
                    <View
                      style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: 999,
                        backgroundColor: palette.accent[600],
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 5,
                      }}
                    >
                      <Text
                        style={[
                          typography.text.label,
                          { color: palette.cream[4], fontSize: 11 },
                        ]}
                      >
                        {unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Add a wish */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a wish"
          onPress={() => setAdding(true)}
          style={{
            marginHorizontal: 18,
            marginTop: 18,
            paddingVertical: 14,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: scheme.borderHover,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Plus size={16} color={scheme.fgMuted} strokeWidth={2} />
          <Text style={[typography.text.label, { color: scheme.fgMuted }]}>Add a wish</Text>
        </Pressable>
      </ScrollView>

      <AddWishSheet
        visible={adding}
        currency={currency}
        onClose={() => setAdding(false)}
        onConfirm={(input) => {
          onAddWish?.(input);
          setAdding(false);
        }}
      />

      <WishNotesModal
        key={notesWishId ?? "none"}
        wish={notesWish}
        notes={notes}
        loading={notesLoading}
        onSend={async (body) => {
          if (notesWish) {
            await onAddNote?.(notesWish.id, body);
          }
        }}
        onClose={() => setNotesWishId(null)}
      />
    </View>
  );
}

/** A little messaging thread for one wish — the child reads parent notes and
 *  replies. Parent notes sit left, the child's own notes sit right. */
function WishNotesModal({
  wish,
  notes,
  loading,
  onSend,
  onClose,
}: {
  wish: KidWish | null;
  notes?: WishNote[];
  loading: boolean;
  onSend: (body: string) => Promise<void> | void;
  onClose: () => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const keyboardHeight = useKeyboardHeight();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSend = draft.trim().length > 0 && !sending;

  return (
    <Modal visible={wish !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(42, 32, 24, 0.32)" }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: keyboardHeight,
          maxHeight: "78%",
          backgroundColor: scheme.bgModal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 22,
          paddingTop: 14,
          paddingBottom: 24,
          ...scheme.shadow.lg,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
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

        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 22 }]}>
          {wish?.name ?? "Notes"}
        </Text>

        <ScrollView
          style={{ marginTop: 12, marginBottom: 12 }}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          keyboardShouldPersistTaps="handled"
        >
          {loading && !notes ? (
            <Text style={[typography.text.bodySm, { color: scheme.fgFaint }]}>Loading…</Text>
          ) : !notes || notes.length === 0 ? (
            <Text style={[typography.text.bodySm, { color: scheme.fgFaint }]}>
              No notes yet. Leave a message about this wish.
            </Text>
          ) : (
            notes.map((note) => {
              const mine = note.authorKind === "child";
              return (
                <View
                  key={note.id}
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "82%",
                    backgroundColor: mine ? bucketTokens.spend.ramp[200] : scheme.bgSunken,
                    borderRadius: radius.md,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  {!mine ? (
                    <Text style={[typography.text.caption, { color: scheme.fgFaint, marginBottom: 2 }]}>
                      {note.authorName || "Parent"}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      typography.text.bodySm,
                      { color: mine ? bucketTokens.spend.ramp[800] : scheme.fg },
                    ]}
                  >
                    {note.body}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
          <TextInput
            accessibilityLabel="Write a note"
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a note…"
            placeholderTextColor={scheme.fgFaint}
            multiline
            style={[
              fieldStyle(scheme, typography.family.body.regular),
              { flex: 1, maxHeight: 100, textAlignVertical: "top" },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send note"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={() => {
              const body = draft.trim();
              setDraft("");
              setSending(true);
              setError(null);
              onClose();
              void Promise.resolve(onSend(body))
                .catch(() => {
                  setError("Note did not save. Try again.");
                  setDraft(body);
                })
                .finally(() => setSending(false));
            }}
            style={({ pressed }) => ({
              width: 46,
              height: 46,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: canSend
                ? pressed
                  ? palette.accent[800]
                  : palette.accent[600]
                : scheme.bgSunken,
              opacity: canSend ? 1 : 0.6,
            })}
          >
            <Send size={18} color={canSend ? palette.cream[4] : scheme.fgFaint} strokeWidth={2.2} />
          </Pressable>
        </View>
        {error ? (
          <Text style={[typography.text.caption, { color: palette.semantic.danger[600], marginTop: 8 }]}>
            {error}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

function AddWishSheet({
  visible,
  currency,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  currency: CurrencyCode;
  onClose: () => void;
  onConfirm: (input: { name: string; targetCents: number }) => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const keyboardHeight = useKeyboardHeight();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  let targetCents = 0;
  try {
    targetCents = parseRewardCents(target);
  } catch {
    targetCents = 0;
  }
  const canSave = name.trim().length > 0 && targetCents > 0;

  const reset = () => {
    setName("");
    setTarget("");
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
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, marginBottom: 16 }]}>
          Add a wish.
        </Text>

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          What do you want?
        </Text>
        <TextInput
          accessibilityLabel="Wish name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Skateboard"
          placeholderTextColor={scheme.fgFaint}
          style={[fieldStyle(scheme, typography.family.body.regular), { marginBottom: 14 }]}
        />

        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 6 }]}>
          How much is it?
        </Text>
        <TextInput
          accessibilityLabel="Wish cost"
          keyboardType="decimal-pad"
          value={target}
          onChangeText={setTarget}
          placeholder="0.00"
          placeholderTextColor={scheme.fgFaint}
          style={[fieldStyle(scheme, typography.family.body.regular), { marginBottom: 20 }]}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save wish"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={() => {
            onConfirm({ name: name.trim(), targetCents });
            reset();
          }}
          style={({ pressed }) => ({
            alignItems: "center",
            paddingVertical: 14,
            borderRadius: radius.pill,
            backgroundColor: canSave
              ? pressed
                ? bucketTokens.spend.ramp[400]
                : bucketTokens.spend.ramp[200]
              : scheme.bgSunken,
            opacity: canSave ? 1 : 0.6,
          })}
        >
          <Text
            style={[
              typography.text.label,
              { color: canSave ? bucketTokens.spend.ramp[800] : scheme.fgFaint, fontSize: 15 },
            ]}
          >
            {canSave ? `Save · ${formatMoney(targetCents, currency)}` : "Save"}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
