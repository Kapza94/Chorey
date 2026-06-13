import { useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Check, ChevronRight, Plus, Sparkles, Undo2, Wallet } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import type { PayoutMethod } from "@/features/payments/payment-actions";
import { KidCard } from "@/features/parent-app/kid-card";
import { ParentHeader, type ParentKid } from "@/features/parent-app/parent-primitives";
import { ToyButton } from "@/components/toybox";

/** A dashed, waiting-to-be-filled bucket for the empty state. */
function EmptyBucket({ bucket, offset = false }: { bucket: "spend" | "savings" | "giving"; offset?: boolean }) {
  const { isDark } = useChoreyTheme();
  const ramp = bucketTokens[bucket].ramp;
  return (
    <View
      style={{
        flex: 1,
        height: 72,
        marginTop: offset ? 12 : 0,
        backgroundColor: isDark ? ramp.tintDark : ramp[100],
        borderColor: ramp[600],
        borderWidth: 2,
        borderStyle: "dashed",
        borderRadius: 14,
      }}
    />
  );
}

/** One off-app payout to a kid, for the per-kid payments sheet. */
export type KidPaymentRow = {
  id: string;
  dateLabel: string;
  method: PayoutMethod;
  detail?: string | null;
  amountCents: number;
};

/** A kid's all-time earned / paid totals plus their payout history. */
export type KidPaymentSummary = {
  kidId: string;
  /** gross all-time earnings (positive ledger events only). */
  earnedCents: number;
  paidCents: number;
  /** net Spend balance — the only money owed to the kid in cash. */
  spendCents: number;
  history: KidPaymentRow[];
};

/** A submitted chore awaiting parent approval. */
export type PendingApproval = {
  id: string;
  childName: string;
  title: string;
  rewardCents: number;
  tone: ParentKid["tone"];
};

/** A kid's request to spend their Spend balance on a wishlist item. */
export type PendingPurchase = {
  id: string;
  childName: string;
  itemName: string;
  targetCents: number;
};

/** A kid's suggested giving cause awaiting parent approval. */
export type PendingGivingSuggestion = {
  id: string;
  childName: string;
  name: string;
};

type Props = {
  subtitle?: string;
  currency?: CurrencyCode;
  kids?: ParentKid[];
  pendingApprovals?: PendingApproval[];
  purchaseRequests?: PendingPurchase[];
  givingSuggestions?: PendingGivingSuggestion[];
  payments?: KidPaymentSummary[];
  onSelectKid?: (id: string) => void;
  onAddKid?: () => void;
  onReviewApprovals?: () => void;
  onApproveChore?: (choreId: string) => void;
  onSendBackChore?: (choreId: string, reason: string) => void;
  onApprovePurchase?: (requestId: string) => void;
  onApproveGivingSuggestion?: (suggestionId: string) => void;
  headerRight?: ReactNode;
};

export function ParentKidsScreen({
  subtitle,
  currency = DEFAULT_CURRENCY,
  kids = [],
  pendingApprovals = [],
  purchaseRequests = [],
  givingSuggestions = [],
  payments = [],
  onSelectKid,
  onAddKid,
  onReviewApprovals,
  onApproveChore,
  onSendBackChore,
  onApprovePurchase,
  onApproveGivingSuggestion,
  headerRight,
}: Props) {
  const { scheme, typography, palette, radius, toybox, isDark, bucketInk } = useChoreyTheme();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [paymentsKid, setPaymentsKid] = useState<ParentKid | null>(null);

  const totalPending = kids.reduce((sum, kid) => sum + kid.pendingApprovals, 0);
  const reviewCount =
    totalPending + purchaseRequests.length + givingSuggestions.length;
  const sum = (pick: (kid: ParentKid) => number) =>
    kids.reduce((total, kid) => total + pick(kid), 0);

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 120 }} style={{ flex: 1 }}>
        <ParentHeader
          subtitle={subtitle}
          title="Kids."
          action={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add kid"
                onPress={onAddKid}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingLeft: 11,
                  paddingRight: 14,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: pressed ? scheme.bgSunken : scheme.bgModal,
                  borderColor: scheme.toy.border,
                  borderWidth: toybox.borderWidth,
                  ...(pressed ? {} : scheme.toy.shadowSm),
                })}
              >
                <Plus size={15} color={scheme.fg} strokeWidth={2.4} />
                <Text style={[typography.text.label, { color: scheme.fg, fontSize: 13 }]}>
                  Add kid
                </Text>
              </Pressable>
              {headerRight}
            </View>
          }
        />

        {reviewCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Review approvals"
            onPress={() => {
              onReviewApprovals?.();
              setReviewOpen(true);
            }}
            style={{
              marginHorizontal: 18,
              marginBottom: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: scheme.tint.warning,
              borderColor: scheme.toy.border,
              borderWidth: toybox.borderWidth,
              borderRadius: radius.md,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              ...scheme.toy.shadowSm,
            }}
          >
            <Sparkles size={20} color={palette.semantic.warning[600]} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 13 }]}>
                {reviewCount} {reviewCount === 1 ? "thing needs" : "things need"} you
              </Text>
              <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
                Tap to review.
              </Text>
            </View>
            <ChevronRight size={16} color={palette.semantic.warning[600]} strokeWidth={2} />
          </Pressable>
        ) : null}

        {kids.length === 0 ? (
          /* Composed getting-started state instead of a wall of zeros. */
          <View style={{ paddingHorizontal: 18, gap: 14 }}>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <EmptyBucket bucket="spend" />
              <EmptyBucket bucket="savings" offset />
              <EmptyBucket bucket="giving" />
            </View>
            <Text
              style={{
                fontFamily: typography.family.display.extra,
                fontSize: 26,
                letterSpacing: -0.5,
                color: scheme.fg,
              }}
            >
              No kids yet.
            </Text>
            <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginTop: -6 }]}>
              Add your first kid and these three buckets start filling — 40% to
              spend, 40% to save, 20% to give.
            </Text>
            <ToyButton onPress={onAddKid} accessibilityLabel="Add your first kid">
              Add your first kid
            </ToyButton>
          </View>
        ) : (
          <>
            <View style={{ gap: 14, paddingHorizontal: 18 }}>
              {kids.map((kid) => (
                <KidCard
                  key={kid.id}
                  kid={kid}
                  currency={currency}
                  onTap={() => {
                    onSelectKid?.(kid.id);
                    setPaymentsKid(kid);
                  }}
                />
              ))}
            </View>

            {/* Household total */}
            <Text
              style={[
                typography.text.overline,
                { color: scheme.fgFaint, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 8 },
              ]}
            >
              This week, all kids
            </Text>
            <View
              style={{
                marginHorizontal: 18,
                paddingHorizontal: 18,
                paddingVertical: 16,
                backgroundColor: isDark
                  ? palette.allowance.tintDark
                  : palette.allowance[200],
                borderColor: scheme.toy.border,
                borderWidth: toybox.borderWidth,
                borderRadius: toybox.radius,
                ...scheme.toy.shadow,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.family.display.bold,
                  fontSize: 36,
                  letterSpacing: -0.7,
                  color: bucketInk("spend"),
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatMoney(sum((kid) => kid.earnedCents), currency)}
              </Text>
              <View style={{ flexDirection: "row", gap: 18, marginTop: 14 }}>
                <TotalCell label="To spend" cents={sum((k) => k.allowanceCents)} color={bucketInk("spend")} currency={currency} />
                <TotalCell label="To save" cents={sum((k) => k.savingsCents)} color={bucketInk("savings")} currency={currency} />
                <TotalCell label="To give" cents={sum((k) => k.givingCents)} color={bucketInk("giving")} currency={currency} />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <ApprovalsReviewSheet
        visible={reviewOpen}
        pending={pendingApprovals}
        purchaseRequests={purchaseRequests}
        givingSuggestions={givingSuggestions}
        currency={currency}
        onApproveChore={(choreId) => onApproveChore?.(choreId)}
        onSendBackChore={(choreId, reason) => onSendBackChore?.(choreId, reason)}
        onApprovePurchase={(requestId) => onApprovePurchase?.(requestId)}
        onApproveGivingSuggestion={(suggestionId) =>
          onApproveGivingSuggestion?.(suggestionId)
        }
        onClose={() => setReviewOpen(false)}
      />

      <KidPaymentsSheet
        kid={paymentsKid}
        summary={payments.find((p) => p.kidId === paymentsKid?.id) ?? null}
        currency={currency}
        onClose={() => setPaymentsKid(null)}
      />
    </View>
  );
}

function ApprovalsReviewSheet({
  visible,
  pending,
  purchaseRequests,
  givingSuggestions,
  currency,
  onApproveChore,
  onSendBackChore,
  onApprovePurchase,
  onApproveGivingSuggestion,
  onClose,
}: {
  visible: boolean;
  pending: PendingApproval[];
  purchaseRequests: PendingPurchase[];
  givingSuggestions: PendingGivingSuggestion[];
  currency: CurrencyCode;
  onApproveChore: (choreId: string) => void;
  onSendBackChore: (choreId: string, reason: string) => void;
  onApprovePurchase: (requestId: string) => void;
  onApproveGivingSuggestion: (suggestionId: string) => void;
  onClose: () => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const isEmpty =
    pending.length + purchaseRequests.length + givingSuggestions.length === 0;

  const sectionLabel = (text: string) => (
    <Text
      style={[
        typography.text.overline,
        { color: scheme.fgFaint, marginTop: 6, marginBottom: 8 },
      ]}
    >
      {text}
    </Text>
  );

  const reviewRow = (
    key: string,
    title: string,
    subtitle: string,
    approveLabel: string,
    onApprove: () => void,
    ramp: Record<number, string>,
  ) => (
    <View
      key={key}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: scheme.bgRaised,
        borderColor: scheme.border,
        borderWidth: 1,
        borderRadius: radius.md,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>{title}</Text>
        <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={approveLabel}
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
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
          bottom: 0,
          maxHeight: "80%",
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
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, marginBottom: 4 }]}>
          Needs you.
        </Text>
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginBottom: 12 }]}>
          Approve finished work, purchases, and giving causes.
        </Text>

        {isEmpty ? (
          <Text style={[typography.text.body, { color: scheme.fgFaint, paddingVertical: 16 }]}>
            Nothing to review right now.
          </Text>
        ) : (
          <ScrollView style={{ flexGrow: 0 }}>
            {pending.length > 0 ? (
              <>
                {sectionLabel("Chores to approve")}
                <View style={{ gap: 10 }}>
                  {pending.map((item) => (
                    <ChoreReviewRow
                      key={item.id}
                      item={item}
                      currency={currency}
                      onApprove={() => onApproveChore(item.id)}
                      onSendBack={(reason) => onSendBackChore(item.id, reason)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {purchaseRequests.length > 0 ? (
              <>
                {sectionLabel("Purchase requests")}
                <View style={{ gap: 10 }}>
                  {purchaseRequests.map((item) =>
                    reviewRow(
                      item.id,
                      item.itemName,
                      `${item.childName} · ${formatMoney(item.targetCents, currency)}`,
                      `Approve purchase ${item.itemName}`,
                      () => onApprovePurchase(item.id),
                      bucketTokens.spend.ramp,
                    ),
                  )}
                </View>
              </>
            ) : null}

            {givingSuggestions.length > 0 ? (
              <>
                {sectionLabel("Giving causes")}
                <View style={{ gap: 10 }}>
                  {givingSuggestions.map((item) =>
                    reviewRow(
                      item.id,
                      item.name,
                      `${item.childName} suggested`,
                      `Approve cause ${item.name}`,
                      () => onApproveGivingSuggestion(item.id),
                      bucketTokens.giving.ramp,
                    ),
                  )}
                </View>
              </>
            ) : null}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function ChoreReviewRow({
  item,
  currency,
  onApprove,
  onSendBack,
}: {
  item: PendingApproval;
  currency: CurrencyCode;
  onApprove: () => void;
  onSendBack: (reason: string) => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const ramp = bucketTokens[item.tone === "allowance" ? "spend" : item.tone].ramp;
  const [back, setBack] = useState(false);
  const [reason, setReason] = useState("");
  const canSend = reason.trim().length > 0;

  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: scheme.bgRaised,
        borderColor: scheme.border,
        borderWidth: 1,
        borderRadius: radius.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>{item.title}</Text>
          <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
            {item.childName} · {formatMoney(item.rewardCents, currency)}
          </Text>
        </View>
        {!back ? (
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
        ) : null}
      </View>

      {back ? (
        <View style={{ marginTop: 10 }}>
          <TextInput
            accessibilityLabel="Send-back reason"
            value={reason}
            onChangeText={setReason}
            placeholder="What needs fixing?"
            placeholderTextColor={scheme.fgFaint}
            autoFocus
            style={{
              backgroundColor: scheme.bgPage,
              borderColor: palette.border.mid,
              borderWidth: 1,
              borderRadius: radius.sm,
              paddingHorizontal: 12,
              paddingVertical: 9,
              fontFamily: typography.family.body.regular,
              fontSize: 14,
              color: scheme.fg,
            }}
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
              onPress={() => onSendBack(reason.trim())}
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

function paymentMethodLabel(row: { method: PayoutMethod; detail?: string | null }) {
  if (row.method === "other") {
    return row.detail ? `Other · ${row.detail}` : "Other";
  }
  return "Cash";
}

function KidPaymentsSheet({
  kid,
  summary,
  currency,
  onClose,
}: {
  kid: ParentKid | null;
  summary: KidPaymentSummary | null;
  currency: CurrencyCode;
  onClose: () => void;
}) {
  const { scheme, typography, palette, radius, bucketInk } = useChoreyTheme();

  const earned = summary?.earnedCents ?? 0;
  const paid = summary?.paidCents ?? 0;
  // Owed = the kid's net Spend balance; Savings and Giving are never cash.
  const owed = Math.max(0, summary?.spendCents ?? 0);
  const history = summary?.history ?? [];
  const tone = kid
    ? bucketTokens[kid.tone === "allowance" ? "spend" : kid.tone].ramp
    : bucketTokens.spend.ramp;

  const cell = (label: string, cents: number, color: string) => (
    <View style={{ flex: 1 }}>
      <Text style={[typography.text.overline, { color: scheme.fgFaint, fontSize: 10 }]}>
        {label}
      </Text>
      <Text style={[typography.text.money, { color, fontSize: 17, marginTop: 2 }]}>
        {formatMoney(cents, currency)}
      </Text>
    </View>
  );

  return (
    <Modal visible={kid != null} transparent animationType="slide" onRequestClose={onClose}>
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
          bottom: 0,
          maxHeight: "80%",
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

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.pill,
              backgroundColor: tone[200],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: typography.family.display.bold, fontSize: 19, color: tone[800] }}>
              {kid?.name.trim().charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 22 }]}>
            {kid?.name}
          </Text>
        </View>

        {/* Earned / Paid / Owed */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: 16,
          }}
        >
          {cell("Earned", earned, scheme.fg)}
          {cell("Paid", paid, bucketInk("savings"))}
          {cell("Owed", owed, owed > 0 ? bucketInk("spend") : scheme.fgFaint)}
        </View>

        <Text
          style={[
            typography.text.overline,
            { color: scheme.fgFaint, marginTop: 18, marginBottom: 8 },
          ]}
        >
          Paid out · {formatMoney(paid, currency)} all-time
        </Text>

        {history.length === 0 ? (
          <Text style={[typography.text.body, { color: scheme.fgFaint, paddingVertical: 12 }]}>
            No payments yet.
          </Text>
        ) : (
          <ScrollView style={{ flexGrow: 0 }}>
            <View
              style={{
                backgroundColor: scheme.bgRaised,
                borderColor: scheme.border,
                borderWidth: 1,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {history.map((row, index) => (
                <View
                  key={row.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    borderBottomWidth: index < history.length - 1 ? 1 : 0,
                    borderBottomColor: scheme.border,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: radius.pill,
                      backgroundColor: scheme.bgSunken,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Wallet size={15} color={scheme.fgMuted} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[typography.text.label, { color: scheme.fg }]}>
                      {paymentMethodLabel(row)}
                    </Text>
                    <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
                      {row.dateLabel}
                    </Text>
                  </View>
                  <Text style={[typography.text.money, { fontSize: 14, color: scheme.fg }]}>
                    {formatMoney(row.amountCents, currency)}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function TotalCell({
  label,
  cents,
  color,
  currency,
}: {
  label: string;
  cents: number;
  color: string;
  currency: CurrencyCode;
}) {
  const { typography, scheme } = useChoreyTheme();

  return (
    <View>
      <Text style={[typography.text.overline, { color: scheme.fgFaint, fontSize: 10 }]}>
        {label}
      </Text>
      <Text style={[typography.text.money, { color, fontSize: 15, marginTop: 2 }]}>
        {formatMoney(cents, currency)}
      </Text>
    </View>
  );
}
