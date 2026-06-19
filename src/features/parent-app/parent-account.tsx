import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

import { useKeyboardHeight } from "@/components/use-keyboard-height";
import {
  ChevronRight,
  CreditCard,
  LifeBuoy,
  LogOut,
  MessageSquarePlus,
  Pencil,
  Settings2,
  Trash2,
} from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { ToyAvatar, ToySticker } from "@/components/toybox";
import { FeedbackForm } from "@/features/feedback/feedback-form";
import { DeleteAccountConfirm } from "@/features/account/delete-account-confirm";

export type ParentAccount = {
  name: string;
  email: string;
  /** "google" | "apple" | "email" — drives the provider sticker */
  provider: string;
  avatarUrl?: string | null;
  householdName?: string | null;
};

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  email: "Email",
};

/** The tappable identity in the header — photo if we have one, else initials. */
export function AccountAvatarButton({
  account,
  onPress,
}: {
  account: ParentAccount;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Your account"
      onPress={onPress}
      hitSlop={6}
    >
      <ToyAvatar name={account.name} tone="savings" size={44} imageUrl={account.avatarUrl} />
    </Pressable>
  );
}

/** Account sheet — identity, household, and the few account-level actions.
 *  Deliberately does NOT duplicate Settings; it links into it. */
export function ParentAccountSheet({
  visible,
  account,
  subscriptionLabel,
  onEditName,
  onManageSubscription,
  onManageStoreSubscription,
  onSubmitContact,
  onSubmitFeedback,
  onDeleteAccount,
  onSignOut,
  onClose,
}: {
  visible: boolean;
  account: ParentAccount;
  subscriptionLabel?: string;
  onEditName?: (name: string) => void;
  onManageSubscription?: () => void;
  /** Opens the App Store / Play Store page to cancel or change billing. */
  onManageStoreSubscription?: () => void;
  /** Persists a "Contact us" support request. Shows the form row when set. */
  onSubmitContact?: (message: string) => Promise<void>;
  /** Persists a "Send feedback" note. Shows the form row when set. */
  onSubmitFeedback?: (message: string) => Promise<void>;
  /** Permanently deletes the account. Shows the danger row when set. */
  onDeleteAccount?: () => Promise<void> | void;
  onSignOut?: () => void;
  onClose: () => void;
}) {
  const { scheme, typography, palette, toybox, isDark } = useChoreyTheme();
  const keyboardHeight = useKeyboardHeight();
  const peach = palette.allowance;
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(account.name);
  // 'menu' is the account list; the others swap in a focused sub-view.
  const [view, setView] = useState<"menu" | "contact" | "feedback" | "delete">("menu");

  const providerLabel = PROVIDER_LABEL[account.provider] ?? "Account";

  function saveName() {
    const next = draftName.trim();
    if (next && next !== account.name) {
      onEditName?.(next);
    }
    setEditing(false);
  }

  // Always reopen on the menu, never mid-form.
  function close() {
    setView("menu");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close account"
        onPress={close}
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
          paddingTop: 14,
          paddingBottom: 34,
          // Lift the sheet (and the feedback form it hosts) above the keyboard.
          marginBottom: keyboardHeight,
        }}
      >
        <View
          style={{
            width: 44,
            height: 5,
            borderRadius: 3,
            backgroundColor: scheme.bgSunken,
            alignSelf: "center",
            marginBottom: 16,
          }}
        />

        {view === "contact" || view === "feedback" ? (
          <FeedbackForm
            kind={view}
            onSubmit={view === "contact" ? onSubmitContact! : onSubmitFeedback!}
            onBack={() => setView("menu")}
          />
        ) : view === "delete" ? (
          <DeleteAccountConfirm
            onConfirm={() => onDeleteAccount!()}
            onBack={() => setView("menu")}
          />
        ) : (
          <>
        {/* Identity */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
          <ToyAvatar name={account.name} tone="savings" size={58} imageUrl={account.avatarUrl} />
          <View style={{ flex: 1 }}>
            {editing ? (
              <TextInput
                accessibilityLabel="Your name"
                value={draftName}
                onChangeText={setDraftName}
                onBlur={saveName}
                onSubmitEditing={saveName}
                autoFocus
                style={{
                  fontFamily: typography.family.display.extra,
                  fontSize: 21,
                  letterSpacing: -0.5,
                  color: scheme.fg,
                  borderBottomColor: scheme.toy.border,
                  borderBottomWidth: 2,
                  paddingVertical: 2,
                }}
              />
            ) : (
              <Text
                style={{
                  fontFamily: typography.family.display.extra,
                  fontSize: 21,
                  letterSpacing: -0.5,
                  color: scheme.fg,
                }}
                numberOfLines={1}
              >
                {account.name}
              </Text>
            )}
            <Text style={[typography.text.caption, { color: scheme.fgFaint }]} numberOfLines={1}>
              {account.email}
            </Text>
          </View>
          <ToySticker label={providerLabel} tone="savings" />
        </View>

        {/* Household + subscription */}
        {account.householdName ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
              paddingHorizontal: 13,
              paddingVertical: 11,
              backgroundColor: isDark ? peach.tintDark : peach[200],
              borderColor: scheme.toy.border,
              borderWidth: toybox.borderWidth,
              borderRadius: 14,
              ...scheme.toy.shadowSm,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.text.overline, { color: peach[800] }]}>Household</Text>
              <Text
                style={{
                  fontFamily: typography.family.display.bold,
                  fontSize: 17,
                  color: peach[800],
                }}
                numberOfLines={1}
              >
                {account.householdName}
              </Text>
            </View>
            {subscriptionLabel ? <ToySticker label={subscriptionLabel} tone="giving" straight /> : null}
          </View>
        ) : null}

        {/* Actions */}
        <View style={{ marginTop: 14, gap: 9 }}>
          <AccountRow
            Icon={Pencil}
            label={editing ? "Save name" : "Edit profile"}
            onPress={() => (editing ? saveName() : setEditing(true))}
          />
          <AccountRow
            Icon={Settings2}
            label="Account & subscription"
            onPress={onManageSubscription}
          />
          {onManageStoreSubscription ? (
            <AccountRow
              Icon={CreditCard}
              label="Cancel or manage billing"
              onPress={onManageStoreSubscription}
            />
          ) : null}
          {onSubmitContact ? (
            <AccountRow
              Icon={LifeBuoy}
              label="Contact us"
              onPress={() => setView("contact")}
            />
          ) : null}
          {onSubmitFeedback ? (
            <AccountRow
              Icon={MessageSquarePlus}
              label="Send feedback"
              onPress={() => setView("feedback")}
            />
          ) : null}
          <AccountRow Icon={LogOut} label="Sign out" tone="danger" onPress={onSignOut} />
          {onDeleteAccount ? (
            <AccountRow
              Icon={Trash2}
              label="Delete account"
              tone="danger"
              onPress={() => setView("delete")}
            />
          ) : null}
        </View>
          </>
        )}
      </View>
    </Modal>
  );
}

function AccountRow({
  Icon,
  label,
  tone,
  onPress,
}: {
  Icon: typeof Pencil;
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
        paddingHorizontal: 13,
        paddingVertical: 12,
        backgroundColor: pressed ? scheme.bgSunken : scheme.bgRaised,
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        borderRadius: 13,
        ...(pressed ? {} : scheme.toy.shadowSm),
      })}
    >
      <Icon size={18} color={color} strokeWidth={2.2} />
      <Text style={[typography.text.label, { flex: 1, color, fontSize: 14 }]}>{label}</Text>
      {tone !== "danger" ? (
        <ChevronRight size={16} color={scheme.fgFaint} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

