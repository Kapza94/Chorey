import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Check, ChevronRight, Plus, Sparkles } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import { KidCard } from "@/features/parent-app/kid-card";
import { ParentHeader, type ParentKid } from "@/features/parent-app/parent-primitives";

/** A submitted chore awaiting parent approval. */
export type PendingApproval = {
  id: string;
  childName: string;
  title: string;
  rewardCents: number;
  tone: ParentKid["tone"];
};

type Props = {
  subtitle?: string;
  currency?: CurrencyCode;
  kids?: ParentKid[];
  pendingApprovals?: PendingApproval[];
  onSelectKid?: (id: string) => void;
  onAddKid?: () => void;
  onReviewApprovals?: () => void;
  onApproveChore?: (choreId: string) => void;
};

export function ParentKidsScreen({
  subtitle,
  currency = DEFAULT_CURRENCY,
  kids = [],
  pendingApprovals = [],
  onSelectKid,
  onAddKid,
  onReviewApprovals,
  onApproveChore,
}: Props) {
  const { scheme, typography, palette, radius, bucketInk } = useChoreyTheme();
  const [reviewOpen, setReviewOpen] = useState(false);

  const totalPending = kids.reduce((sum, kid) => sum + kid.pendingApprovals, 0);
  const sum = (pick: (kid: ParentKid) => number) =>
    kids.reduce((total, kid) => total + pick(kid), 0);

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} style={{ flex: 1 }}>
        <ParentHeader
          subtitle={subtitle}
          title="Kids."
          action={
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
                backgroundColor: pressed ? scheme.bgSunken : scheme.bgRaised,
                ...scheme.shadow.xs,
              })}
            >
              <Plus size={15} color={scheme.fg} strokeWidth={2.4} />
              <Text style={[typography.text.label, { color: scheme.fg, fontSize: 13 }]}>
                Add kid
              </Text>
            </Pressable>
          }
        />

        {totalPending > 0 ? (
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
              borderRadius: radius.md,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Sparkles size={20} color={palette.semantic.warning[600]} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 13 }]}>
                {totalPending} {totalPending === 1 ? "chore" : "chores"} need your approval
              </Text>
              <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
                Tap to review.
              </Text>
            </View>
            <ChevronRight size={16} color={palette.semantic.warning[600]} strokeWidth={2} />
          </Pressable>
        ) : null}

        <View style={{ gap: 12, paddingHorizontal: 18 }}>
          {kids.map((kid) => (
            <KidCard
              key={kid.id}
              kid={kid}
              currency={currency}
              onTap={() => onSelectKid?.(kid.id)}
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
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: 16,
          }}
        >
          <Text
            style={[
              typography.text.h1,
              { color: scheme.fg, fontSize: 36, fontVariant: ["tabular-nums"] },
            ]}
          >
            {formatMoney(sum((kid) => kid.earnedCents), currency)}
          </Text>
          <View style={{ flexDirection: "row", gap: 18, marginTop: 14 }}>
            <TotalCell label="To spend" cents={sum((k) => k.allowanceCents)} color={bucketInk("spend")} currency={currency} />
            <TotalCell label="To save" cents={sum((k) => k.savingsCents)} color={bucketInk("savings")} currency={currency} />
            <TotalCell label="To give" cents={sum((k) => k.givingCents)} color={bucketInk("giving")} currency={currency} />
          </View>
        </View>
      </ScrollView>

      <ApprovalsReviewSheet
        visible={reviewOpen}
        pending={pendingApprovals}
        currency={currency}
        onApprove={(choreId) => onApproveChore?.(choreId)}
        onClose={() => setReviewOpen(false)}
      />
    </View>
  );
}

function ApprovalsReviewSheet({
  visible,
  pending,
  currency,
  onApprove,
  onClose,
}: {
  visible: boolean;
  pending: PendingApproval[];
  currency: CurrencyCode;
  onApprove: (choreId: string) => void;
  onClose: () => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();

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
          Approve work.
        </Text>
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginBottom: 16 }]}>
          Approving credits the reward to the kid&apos;s buckets.
        </Text>

        {pending.length === 0 ? (
          <Text style={[typography.text.body, { color: scheme.fgFaint, paddingVertical: 16 }]}>
            Nothing to approve right now.
          </Text>
        ) : (
          <ScrollView style={{ flexGrow: 0 }}>
            <View style={{ gap: 10 }}>
              {pending.map((item) => {
                const tone = bucketTokens[item.tone === "allowance" ? "spend" : item.tone].ramp;
                return (
                  <View
                    key={item.id}
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
                      <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>
                        {item.title}
                      </Text>
                      <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
                        {item.childName} · {formatMoney(item.rewardCents, currency)}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Approve ${item.title}`}
                      onPress={() => onApprove(item.id)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: radius.pill,
                        backgroundColor: pressed ? tone[400] : tone[200],
                      })}
                    >
                      <Check size={14} color={tone[800]} strokeWidth={3} />
                      <Text style={[typography.text.label, { color: tone[800], fontSize: 13 }]}>
                        Approve
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
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
