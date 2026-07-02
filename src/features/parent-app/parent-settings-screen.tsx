import { useState, type ReactNode } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Application from "expo-application";
import {
  ChevronRight,
  CreditCard,
  FileText,
  KeyRound,
  LifeBuoy,
  LogOut,
  MailPlus,
  MessageSquarePlus,
  Monitor,
  Moon,
  Share2,
  Shield,
  Sun,
  Trash2,
  X,
} from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import {
  useThemePreference,
  type ThemePreference,
} from "@/theme/theme-preference";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  resolveCurrencyFormat,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/features/money/currency";
import {
  DEFAULT_SPLIT,
  MIN_GIVE_PCT,
  SPLIT_STEP,
  type Split,
} from "@/features/money/split";
import type { SettlementFrequency } from "@/features/household/household-actions";
import type { HouseholdInvite } from "@/features/household/household-invite-actions";
import { ParentHeader, type ParentKid } from "@/features/parent-app/parent-primitives";
import { ToyAvatar } from "@/components/toybox";
import type { ParentAccount } from "@/features/parent-app/parent-account";
import { FeedbackForm } from "@/features/feedback/feedback-form";
import { DeleteAccountConfirm } from "@/features/account/delete-account-confirm";
import { PRIVACY_URL, TERMS_URL } from "@/features/legal/legal";
import { useKeyboardHeight } from "@/components/use-keyboard-height";

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  email: "Email",
};

const BUDGET_STEP_CENTS = 500;
const BUDGET_MIN_CENTS = 500;

/** A kid's device sign-in code, joined to the kid for display. */
export type KidAccessCode = { kidId: string; accessCode: string };

type Props = {
  currency?: CurrencyCode;
  split?: Split;
  kids?: ParentKid[];
  accessCodes?: KidAccessCode[];
  parentInvites?: HouseholdInvite[];
  /** one-line status, e.g. "Free trial · ends Jun 25, 2026" */
  subscriptionLabel?: string;
  onManageSubscription?: () => void;
  onCreateParentInvite?: (email: string) => Promise<HouseholdInvite>;
  onCancelParentInvite?: (inviteId: string) => Promise<void> | void;
  onChangeBudget?: (kidId: string, budgetCents: number) => void;
  onChangeCadence?: (kidId: string, cadence: SettlementFrequency) => void;
  onChangeSplit?: (split: Split) => void;
  onLogOut?: () => void;
  headerRight?: ReactNode;
  appVersionLabel?: string;
  /** The signed-in parent, shown as a tappable profile row at the top. */
  account?: ParentAccount;
  /** Opens the full "Account & family" edit screen. */
  onOpenProfile?: () => void;
  /** Opens the App Store / Play Store page to cancel or change billing. */
  onManageStoreSubscription?: () => void;
  /** Persists a "Contact us" support request. Shows the row when set. */
  onSubmitContact?: (message: string) => Promise<void>;
  /** Persists a "Send feedback" note. Shows the row when set. */
  onSubmitFeedback?: (message: string) => Promise<void>;
  /** Permanently deletes the account. Shows the danger row when set. */
  onDeleteAccount?: () => Promise<void> | void;
};

function defaultAppVersionLabel() {
  const version = Application.nativeApplicationVersion ?? "0.1";
  const build = Application.nativeBuildVersion;
  return `chorey · v${version}${build ? ` (${build})` : ""}`;
}

export function ParentSettingsScreen({
  currency = DEFAULT_CURRENCY,
  split = DEFAULT_SPLIT,
  kids = [],
  accessCodes = [],
  parentInvites = [],
  subscriptionLabel,
  onManageSubscription,
  onCreateParentInvite,
  onCancelParentInvite,
  onChangeBudget,
  onChangeCadence,
  onChangeSplit,
  onLogOut,
  headerRight,
  appVersionLabel = defaultAppVersionLabel(),
  account,
  onOpenProfile,
  onManageStoreSubscription,
  onSubmitContact,
  onSubmitFeedback,
  onDeleteAccount,
}: Props) {
  const { scheme, typography, palette, radius, toybox } = useChoreyTheme();
  // Contact / feedback / delete each swap in a focused sheet over Settings,
  // reusing the exact forms the account sheet uses — no duplicated logic.
  const [accountView, setAccountView] = useState<
    "none" | "contact" | "feedback" | "delete"
  >("none");
  const closeAccountView = () => setAccountView("none");
  const keyboardHeight = useKeyboardHeight();

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
        <ParentHeader subtitle="Account" title="Settings." action={headerRight} />

        <View style={{ paddingHorizontal: 18 }}>
          {/* Profile: the signed-in parent, same identity as the header avatar,
              tapping through to the full Account & family editor. */}
          {account ? (
            <>
              <Text
                style={[
                  typography.text.overline,
                  { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
                ]}
              >
                Profile
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Account and family"
                disabled={!onOpenProfile}
                onPress={onOpenProfile}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: pressed ? scheme.bgSunken : scheme.bgRaised,
                  borderColor: palette.border.mid,
                  borderWidth: 1.5,
                  borderRadius: radius.md,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  marginBottom: 20,
                })}
              >
                <ToyAvatar
                  name={account.name}
                  tone="savings"
                  size={44}
                  imageUrl={account.avatarUrl}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[typography.text.h3, { color: scheme.fg, fontSize: 16 }]}
                    numberOfLines={1}
                  >
                    {account.name || "Your account"}
                  </Text>
                  <Text
                    style={[
                      typography.text.caption,
                      { color: scheme.fgFaint, marginTop: 2 },
                    ]}
                    numberOfLines={1}
                  >
                    {account.email ||
                      `Signed in with ${PROVIDER_LABEL[account.provider] ?? "your account"}`}
                  </Text>
                </View>
                {onOpenProfile ? (
                  <ChevronRight size={18} color={scheme.fgFaint} strokeWidth={2} />
                ) : null}
              </Pressable>
            </>
          ) : null}

          {/* Budget per kid */}
          <Text
            style={[
              typography.text.overline,
              { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
            ]}
          >
            Budget per child
          </Text>
          <View style={{ gap: 10, marginBottom: 20 }}>
            {kids.map((kid) => (
              <BudgetCard
                key={kid.id}
                kid={kid}
                currency={currency}
                onChangeBudget={onChangeBudget}
                onChangeCadence={onChangeCadence}
              />
            ))}
            <Text
              style={[
                typography.text.caption,
                { color: scheme.fgFaint, paddingHorizontal: 4 },
              ]}
            >
              Chores add up toward the budget. You can still assign extra chores beyond it —
              anything over just keeps earning.
            </Text>
          </View>

          {/* The split */}
          <Text
            style={[
              typography.text.overline,
              { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
            ]}
          >
            The split
          </Text>
          <SplitEditor split={split} onChange={onChangeSplit} />

          {/* Appearance — light / dark / follow the phone. */}
          <Text
            style={[
              typography.text.overline,
              { color: scheme.fgFaint, paddingHorizontal: 4, paddingTop: 20, paddingBottom: 8 },
            ]}
          >
            Appearance
          </Text>
          <AppearancePicker />

          {/* Subscription — one household plan; parents manage it here. */}
          {subscriptionLabel ? (
            <>
              <Text
                style={[
                  typography.text.overline,
                  { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
                ]}
              >
                Subscription
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Manage subscription"
                onPress={onManageSubscription}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: pressed ? scheme.bgSunken : scheme.bgModal,
                  borderColor: scheme.toy.border,
                  borderWidth: toybox.borderWidth,
                  ...(pressed ? null : scheme.toy.shadowSm),
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 20,
                })}
              >
                <CreditCard size={17} color={scheme.fgMuted} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.text.label, { color: scheme.fg }]}>
                    Chorey Family
                  </Text>
                  <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
                    Manage your plan
                  </Text>
                </View>
                <ChevronRight size={16} color={scheme.fgFaint} strokeWidth={2} />
              </Pressable>
            </>
          ) : null}

          {/* Co-parent invites — Premium family sharing, capped in the DB. */}
          <Text
            style={[
              typography.text.overline,
              { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
            ]}
          >
            Parent accounts
          </Text>
          <ParentInviteCard
            invites={parentInvites}
            onCreateInvite={onCreateParentInvite}
            onCancelInvite={onCancelParentInvite}
          />

          {/* Kid sign-in codes — parents will lose these; keep them findable. */}
          <Text
            style={[
              typography.text.overline,
              { color: scheme.fgFaint, paddingHorizontal: 4, paddingTop: 20, paddingBottom: 8 },
            ]}
          >
            Child sign-in codes
          </Text>
          <View
            style={{
              backgroundColor: scheme.bgModal,
              borderColor: scheme.toy.border,
              borderWidth: toybox.borderWidth,
              ...scheme.toy.shadowSm,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {accessCodes.length === 0 ? (
              <Text
                style={[
                  typography.text.caption,
                  { color: scheme.fgFaint, paddingHorizontal: 16, paddingVertical: 14 },
                ]}
              >
                Codes appear here once a child has one.
              </Text>
            ) : (
              accessCodes.map((entry, index) => {
                const kid = kids.find((candidate) => candidate.id === entry.kidId);

                return (
                  <View
                    key={entry.kidId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: index < accessCodes.length - 1 ? 1 : 0,
                      borderBottomColor: scheme.border,
                    }}
                  >
                    <KeyRound size={16} color={scheme.fgMuted} strokeWidth={2} />
                    <Text
                      numberOfLines={1}
                      style={[typography.text.label, { flex: 1, color: scheme.fg }]}
                    >
                      {kid?.name ?? "Child"}
                    </Text>
                    <Text
                      selectable
                      style={[
                        typography.text.money,
                        { color: scheme.fg, fontSize: 16, letterSpacing: 2 },
                      ]}
                    >
                      {entry.accessCode}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Share ${kid?.name ?? "child"}'s code`}
                      hitSlop={8}
                      onPress={() =>
                        Share.share({
                          message: `${kid?.name ?? "Your child"}'s Chorey join code: ${entry.accessCode}\n\nOpen Chorey, tap "Join as a child", and enter this code.`,
                        })
                      }
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingLeft: 11,
                        paddingRight: 13,
                        height: 34,
                        borderRadius: radius.pill,
                        borderColor: scheme.toy.border,
                        borderWidth: toybox.borderWidth,
                        backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
                      })}
                    >
                      <Share2 size={15} color={palette.cream[4]} strokeWidth={2.4} />
                      <Text style={[typography.text.label, { fontSize: 13, color: palette.cream[4] }]}>
                        Share
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
            <Text
              style={[
                typography.text.caption,
                {
                  color: scheme.fgFaint,
                  paddingHorizontal: 16,
                  paddingBottom: 12,
                  paddingTop: accessCodes.length === 0 ? 0 : 10,
                },
              ]}
            >
              Children use their code to sign in on their own device.
            </Text>
          </View>

          {/* Account — the same actions the header avatar sheet offers, so
              everything is reachable straight from Settings too. */}
          {onManageStoreSubscription || onSubmitContact || onSubmitFeedback ? (
            <>
              <Text
                style={[
                  typography.text.overline,
                  { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
                ]}
              >
                Account
              </Text>
              <View style={{ gap: 9, marginBottom: 20 }}>
                {onManageStoreSubscription ? (
                  <AccountActionRow
                    Icon={CreditCard}
                    label="Cancel or manage billing"
                    onPress={onManageStoreSubscription}
                  />
                ) : null}
                {onSubmitContact ? (
                  <AccountActionRow
                    Icon={LifeBuoy}
                    label="Contact us"
                    onPress={() => setAccountView("contact")}
                  />
                ) : null}
                {onSubmitFeedback ? (
                  <AccountActionRow
                    Icon={MessageSquarePlus}
                    label="Send feedback"
                    onPress={() => setAccountView("feedback")}
                  />
                ) : null}
              </View>
            </>
          ) : null}

          {/* Legal — Terms + Privacy must stay reachable in-app at all times. */}
          <Text
            style={[
              typography.text.overline,
              { color: scheme.fgFaint, paddingHorizontal: 4, paddingBottom: 8 },
            ]}
          >
            Legal
          </Text>
          <View style={{ gap: 9, marginBottom: 20 }}>
            <AccountActionRow
              Icon={FileText}
              label="Terms of Service"
              onPress={() => void Linking.openURL(TERMS_URL)}
            />
            <AccountActionRow
              Icon={Shield}
              label="Privacy Policy"
              onPress={() => void Linking.openURL(PRIVACY_URL)}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={onLogOut}
            style={({ pressed }) => ({
              marginTop: 22,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 14,
              borderRadius: radius.md,
              backgroundColor: pressed ? scheme.bgSunken : scheme.bgModal,
              borderColor: scheme.toy.border,
              borderWidth: toybox.borderWidth,
              ...(pressed ? null : scheme.toy.shadowSm),
            })}
          >
            <LogOut size={17} color={palette.semantic.danger[600]} strokeWidth={2.2} />
            <Text
              style={[
                typography.text.label,
                { color: palette.semantic.danger[600], fontSize: 15 },
              ]}
            >
              Log out
            </Text>
          </Pressable>

          {onDeleteAccount ? (
            <View style={{ marginTop: 10 }}>
              <AccountActionRow
                Icon={Trash2}
                label="Delete account"
                tone="danger"
                onPress={() => setAccountView("delete")}
              />
            </View>
          ) : null}

          <Text
            style={{
              textAlign: "center",
              marginTop: 20,
              fontFamily: typography.family.display.medium,
              fontSize: 14,
              color: scheme.fgFaint,
            }}
          >
            {appVersionLabel}
          </Text>
        </View>
      </ScrollView>

      {/* Contact / feedback / delete — reuse the exact forms from the account
          sheet, presented as a bottom sheet over Settings. */}
      <Modal
        visible={accountView !== "none"}
        transparent
        animationType="slide"
        onRequestClose={closeAccountView}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={closeAccountView}
          style={{ flex: 1, backgroundColor: "rgba(42,32,24,0.45)" }}
        />
        <View
          style={{
            backgroundColor: scheme.bgModal,
            borderTopColor: scheme.toy.border,
            borderTopWidth: toybox.borderWidth,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 18,
            paddingTop: 20,
            paddingBottom: 34,
            marginBottom: keyboardHeight,
          }}
        >
          {accountView === "delete" && onDeleteAccount ? (
            <DeleteAccountConfirm
              onConfirm={() => onDeleteAccount()}
              onBack={closeAccountView}
            />
          ) : accountView === "contact" && onSubmitContact ? (
            <FeedbackForm
              kind="contact"
              onSubmit={onSubmitContact}
              onBack={closeAccountView}
            />
          ) : accountView === "feedback" && onSubmitFeedback ? (
            <FeedbackForm
              kind="feedback"
              onSubmit={onSubmitFeedback}
              onBack={closeAccountView}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

/** A tappable account/legal action row, styled to match the account sheet. */
function AccountActionRow({
  Icon,
  label,
  tone,
  onPress,
}: {
  Icon: typeof CreditCard;
  label: string;
  tone?: "danger";
  onPress?: () => void;
}) {
  const { scheme, typography, palette, toybox } = useChoreyTheme();
  const color = tone === "danger" ? palette.semantic.danger[600] : scheme.fg;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        paddingHorizontal: 14,
        paddingVertical: 13,
        backgroundColor: pressed ? scheme.bgSunken : scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        borderRadius: 13,
        ...(pressed ? null : scheme.toy.shadowSm),
      })}
    >
      <Icon size={18} color={color} strokeWidth={2.2} />
      <Text style={[typography.text.label, { flex: 1, color, fontSize: 14 }]}>
        {label}
      </Text>
      {tone !== "danger" ? (
        <ChevronRight size={16} color={scheme.fgFaint} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

function ParentInviteCard({
  invites,
  onCreateInvite,
  onCancelInvite,
}: {
  invites: HouseholdInvite[];
  onCreateInvite?: (email: string) => Promise<HouseholdInvite>;
  onCancelInvite?: (inviteId: string) => Promise<void> | void;
}) {
  const { scheme, typography, palette, radius, toybox } = useChoreyTheme();
  const [email, setEmail] = useState("");
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const activeInvites = invites.filter((invite) => invite.status === "pending");

  const createInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !onCreateInvite) {
      return;
    }

    setSending(true);
    setMessage(null);
    setCreatedUrl(null);
    try {
      const invite = await onCreateInvite(trimmed);
      setCreatedUrl(invite.inviteUrl ?? null);
      setEmail("");
      setMessage("Invite link ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invite could not be created.");
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        ...scheme.toy.shadowSm,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <MailPlus size={17} color={scheme.fgMuted} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={[typography.text.label, { color: scheme.fg }]}>
            Invite another parent
          </Text>
          <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>
            Family plan supports up to 4 parent accounts.
          </Text>
        </View>
      </View>

      <TextInput
        accessibilityLabel="Co-parent email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="parent@example.com"
        placeholderTextColor={scheme.fgFaint}
        style={{
          minHeight: 46,
          borderRadius: radius.md,
          borderWidth: toybox.borderWidth,
          borderColor: scheme.toy.border,
          backgroundColor: scheme.bgPage,
          paddingHorizontal: 14,
          color: scheme.fg,
          fontFamily: typography.family.body.regular,
          fontSize: 15,
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create co-parent invite"
        accessibilityState={{ disabled: sending || !email.trim() || !onCreateInvite }}
        disabled={sending || !email.trim() || !onCreateInvite}
        onPress={createInvite}
        style={({ pressed }) => ({
          alignItems: "center",
          borderRadius: radius.pill,
          backgroundColor: pressed ? palette.accent[800] : palette.accent[600],
          opacity: sending || !email.trim() || !onCreateInvite ? 0.45 : 1,
          paddingVertical: 12,
        })}
      >
        <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 14 }]}>
          {sending ? "Creating..." : "Create invite link"}
        </Text>
      </Pressable>

      {createdUrl ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share co-parent invite"
          onPress={() =>
            Share.share({
              message: `Join our Chorey family: ${createdUrl}`,
            })
          }
          style={{
            borderRadius: radius.md,
            backgroundColor: scheme.bgSunken,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text selectable style={[typography.text.caption, { color: scheme.fg }]}>
            {createdUrl}
          </Text>
        </Pressable>
      ) : null}

      {message ? (
        <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
          {message}
        </Text>
      ) : null}

      {activeInvites.length > 0 ? (
        <View style={{ gap: 8, paddingTop: 2 }}>
          {activeInvites.map((invite) => (
            <View
              key={invite.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderRadius: radius.md,
                backgroundColor: scheme.bgSunken,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text
                numberOfLines={1}
                style={[typography.text.caption, { flex: 1, color: scheme.fgMuted }]}
              >
                Pending: {invite.email}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Cancel invite for ${invite.email}`}
                hitSlop={8}
                onPress={() => onCancelInvite?.(invite.id)}
              >
                <X size={16} color={palette.semantic.danger[600]} strokeWidth={2.4} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function BudgetCard({
  kid,
  currency,
  onChangeBudget,
  onChangeCadence,
}: {
  kid: ParentKid;
  currency: CurrencyCode;
  onChangeBudget?: (kidId: string, budgetCents: number) => void;
  onChangeCadence?: (kidId: string, cadence: SettlementFrequency) => void;
}) {
  const { scheme, typography, radius, toybox } = useChoreyTheme();
  const tone = bucketTokens[kid.tone === "allowance" ? "spend" : kid.tone].ramp;
  const [budgetCents, setBudgetCents] = useState(kid.budgetCents);
  const [cadence, setCadence] = useState<SettlementFrequency>(kid.cadence);

  const setBudget = (nextCents: number) => {
    const clamped = Math.max(BUDGET_MIN_CENTS, nextCents);
    setBudgetCents(clamped);
    onChangeBudget?.(kid.id, clamped);
  };

  const step = (direction: 1 | -1) =>
    setBudget(budgetCents + direction * BUDGET_STEP_CENTS);

  const pickCadence = (next: SettlementFrequency) => {
    setCadence(next);
    onChangeCadence?.(kid.id, next);
  };

  return (
    <View
      style={{
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        ...scheme.toy.shadowSm,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.pill,
            backgroundColor: tone[200],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: typography.family.display.bold, fontSize: 16, color: tone[800] }}>
            {kid.name.trim().charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <Text style={[typography.text.h3, { flex: 1, color: scheme.fg, fontSize: 15 }]}>
          {kid.name}
        </Text>
        {/* cadence toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: scheme.bgSunken,
            borderRadius: radius.pill,
            padding: 3,
          }}
        >
          {(["weekly", "monthly"] as const).map((option) => {
            const selected = cadence === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={`${kid.name} ${option}`}
                accessibilityState={{ selected }}
                onPress={() => pickCadence(option)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor: selected ? scheme.bgModal : "transparent",
                  borderWidth: selected ? toybox.borderWidth : 0,
                  borderColor: scheme.toy.border,
                  ...(selected ? scheme.toy.shadowSm : null),
                }}
              >
                <Text
                  style={[
                    typography.text.caption,
                    {
                      color: selected ? scheme.fg : scheme.fgFaint,
                      fontWeight: "700",
                      textTransform: "capitalize",
                    },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View>
          <Text style={[typography.text.overline, { color: scheme.fgFaint, fontSize: 10 }]}>
            Budget cap
          </Text>
          <BudgetCapField
            cents={budgetCents}
            currency={currency}
            cadence={cadence}
            accent={tone[400]}
            onChange={setBudget}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <CapButton label="Decrease budget" symbol="−" onPress={() => step(-1)} />
          <CapButton label="Increase budget" symbol="+" onPress={() => step(1)} />
        </View>
      </View>
    </View>
  );
}

// Tappable budget cap: type a custom amount (whole major units) instead of only
// stepping ±5 — essential for low-value currencies like RSD. Stores back as cents.
function BudgetCapField({
  cents,
  currency,
  cadence,
  accent,
  onChange,
}: {
  cents: number;
  currency: CurrencyCode;
  cadence: SettlementFrequency;
  accent: string;
  onChange: (nextCents: number) => void;
}) {
  const { scheme, typography } = useChoreyTheme();
  const fmt = resolveCurrencyFormat(currency);
  const major = Math.round(cents / 100);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(major));

  const text = editing ? draft : String(major);
  const commit = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    onChange(Number.isFinite(parsed) && parsed > 0 ? parsed * 100 : cents);
  };

  const symbolGap = fmt.spaceBetweenSymbol ? " " : "";

  // Number row uses a tight, shared line-height on both the symbol and the input
  // so they sit on a common centre line — without this the input inherits h1's
  // ~50px lineHeight and the symbol floats above the digits.
  const NUM_SIZE = 26;
  const NUM_LH = 30;
  const numStyle = {
    color: scheme.fg,
    fontFamily: typography.text.h1.fontFamily,
    fontSize: NUM_SIZE,
    lineHeight: NUM_LH,
    includeFontPadding: false as const,
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
      {fmt.symbolPosition === "before" ? (
        <Text style={numStyle}>
          {fmt.symbol}
          {symbolGap}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel="Budget amount"
        value={text}
        onFocus={() => {
          setDraft(String(major));
          setEditing(true);
        }}
        onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        style={{
          ...numStyle,
          height: NUM_LH + 4,
          textAlignVertical: "center",
          paddingVertical: 0,
          paddingHorizontal: 0,
          // Room for every digit plus the caret — too tight and "90" clips to "9".
          minWidth: 32,
          width: Math.max(32, text.length * 18 + 10),
          borderBottomWidth: 2,
          borderBottomColor: accent,
        }}
      />
      {fmt.symbolPosition === "after" ? (
        <Text style={numStyle}>
          {symbolGap}
          {fmt.symbol}
        </Text>
      ) : null}
      <Text style={[typography.text.bodySm, { color: scheme.fgFaint }]}>
        / {cadence === "monthly" ? "mo" : "wk"}
      </Text>
    </View>
  );
}

function CapButton({
  label,
  symbol,
  onPress,
}: {
  label: string;
  symbol: string;
  onPress: () => void;
}) {
  const { scheme, palette, radius } = useChoreyTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 34,
        height: 34,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: palette.border.mid,
        backgroundColor: scheme.bgPage,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700", color: scheme.fg, lineHeight: 22 }}>
        {symbol}
      </Text>
    </Pressable>
  );
}

// Light / Dark / System segmented control. Writes straight to the persisted
// theme preference, so the whole app re-themes immediately and the choice
// survives restarts.
const APPEARANCE_OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

function AppearancePicker() {
  const { scheme, typography, palette, toybox } = useChoreyTheme();
  const { preference, setPreference } = useThemePreference();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        ...scheme.toy.shadowSm,
        borderRadius: 16,
        padding: 8,
        marginBottom: 20,
      }}
    >
      {APPEARANCE_OPTIONS.map(({ value, label, Icon }) => {
        const selected = preference === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`${label} appearance`}
            accessibilityState={{ selected }}
            onPress={() => setPreference(value)}
            style={{
              flex: 1,
              alignItems: "center",
              gap: 6,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: selected ? palette.accent[600] : scheme.bgSunken,
            }}
          >
            <Icon
              size={18}
              color={selected ? palette.cream[4] : scheme.fgMuted}
              strokeWidth={2.2}
            />
            <Text
              style={[
                typography.text.label,
                { fontSize: 13, color: selected ? palette.cream[4] : scheme.fgMuted },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Editable split: Spend and Giving step ±5; Savings is the auto-balanced
// remainder; Giving can't drop below MIN_GIVE_PCT. Controlled by the `split`
// prop — `onChange` updates it upstream (and persists). 40/40/20 is the default
// every household starts on.
function SplitEditor({
  split,
  onChange,
}: {
  split: Split;
  onChange?: (next: Split) => void;
}) {
  const { scheme, typography, radius, toybox } = useChoreyTheme();
  const editable = !!onChange;

  const clampPct = (value: number, max: number) => Math.max(0, Math.min(max, value));

  const stepSpend = (delta: number) => {
    const spend = clampPct(split.spend + delta, 100 - split.give);
    onChange?.({ spend, give: split.give, save: 100 - spend - split.give });
  };
  const stepGive = (delta: number) => {
    const give = Math.max(MIN_GIVE_PCT, Math.min(100 - split.spend, split.give + delta));
    onChange?.({ spend: split.spend, give, save: 100 - split.spend - give });
  };

  return (
    <View
      style={{
        backgroundColor: scheme.bgModal,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        ...scheme.toy.shadowSm,
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 16,
        marginBottom: 16,
      }}
    >
      <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>How earnings split</Text>
      <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, marginTop: 4 }]}>
        {split.spend} / {split.save} / {split.give}
      </Text>
      <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginTop: 4 }]}>
        We recommend 40 / 40 / 20. Nudge Spend and Giving — Savings balances the rest.
        Giving always stays at least {MIN_GIVE_PCT}%.
      </Text>

      <View
        style={{
          flexDirection: "row",
          height: 14,
          borderRadius: radius.pill,
          overflow: "hidden",
          gap: 2,
          marginTop: 14,
        }}
      >
        <View style={{ flex: split.spend, backgroundColor: bucketTokens.spend.ramp[400] }} />
        <View style={{ flex: split.save, backgroundColor: bucketTokens.savings.ramp[400] }} />
        <View style={{ flex: split.give, backgroundColor: bucketTokens.giving.ramp[400] }} />
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
        <SplitColumn
          tone="spend"
          label="Spend"
          value={split.spend}
          onStep={editable ? stepSpend : undefined}
        />
        <SplitColumn tone="savings" label="Save" value={split.save} hint="auto" />
        <SplitColumn
          tone="giving"
          label="Give"
          value={split.give}
          onStep={editable ? stepGive : undefined}
        />
      </View>
    </View>
  );
}

function SplitColumn({
  tone,
  label,
  value,
  hint,
  onStep,
}: {
  tone: "spend" | "savings" | "giving";
  label: string;
  value: number;
  hint?: string;
  onStep?: (delta: number) => void;
}) {
  const { typography, scheme, bucketInk } = useChoreyTheme();
  const tintKey = tone === "spend" ? "allowance" : tone;
  const ink = bucketInk(tone);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: scheme.tint[tintKey],
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <Text style={[typography.text.overline, { color: ink, fontSize: 10 }]}>{label}</Text>
      <Text
        style={{
          fontFamily: typography.family.display.semibold,
          fontSize: 22,
          color: ink,
          marginTop: 2,
        }}
      >
        {value}
        <Text style={{ fontSize: 12 }}>%</Text>
      </Text>
      {onStep ? (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          <SplitStep label={`Decrease ${label}`} symbol="−" ink={ink} onPress={() => onStep(-SPLIT_STEP)} />
          <SplitStep label={`Increase ${label}`} symbol="+" ink={ink} onPress={() => onStep(SPLIT_STEP)} />
        </View>
      ) : hint ? (
        <Text style={[typography.text.caption, { color: ink, opacity: 0.7, marginTop: 8 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

function SplitStep({
  label,
  symbol,
  ink,
  onPress,
}: {
  label: string;
  symbol: string;
  ink: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flex: 1,
        height: 28,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: ink,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "800", color: ink, lineHeight: 18 }}>{symbol}</Text>
    </Pressable>
  );
}
