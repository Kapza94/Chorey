import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Check, Clock, RotateCcw, X } from "lucide-react-native";

import type { KidChore } from "@/features/kid-home/kid-home-screen";
import { formatMoney, type CurrencyCode } from "@/features/money/currency";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

type Props = {
  chore: KidChore | null;
  currency: CurrencyCode;
  onClose: () => void;
  onSubmit: (choreId: string) => Promise<void>;
  onUndo: (choreId: string) => Promise<void>;
};

export function KidChoreModal({
  chore,
  currency,
  onClose,
  onSubmit,
  onUndo,
}: Props) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const [confirmingUndo, setConfirmingUndo] = useState(false);
  const [pendingAction, setPendingAction] = useState<"submit" | "undo" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runAction(
    action: "submit" | "undo",
    callback: (choreId: string) => Promise<void>,
  ) {
    if (!chore || pendingAction) {
      return;
    }

    setPendingAction(action);
    setErrorMessage(null);

    try {
      await callback(chore.id);
      setConfirmingUndo(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Try again.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  function close() {
    if (pendingAction) {
      return;
    }

    setConfirmingUndo(false);
    setErrorMessage(null);
    onClose();
  }

  return (
    <Modal
      visible={chore != null}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss chore"
        accessibilityState={{ disabled: pendingAction != null }}
        disabled={pendingAction != null}
        onPress={close}
        style={{ flex: 1, backgroundColor: "rgba(42, 32, 24, 0.32)" }}
      />
      {chore ? (
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
              marginBottom: 12,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  typography.text.h1,
                  { color: scheme.fg, fontSize: 26 },
                ]}
              >
                {chore.name}
              </Text>
              <Text
                style={[
                  typography.text.money,
                  { color: scheme.fgMuted, fontSize: 18, marginTop: 5 },
                ]}
              >
                {formatMoney(chore.valueCents, currency)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close chore"
              accessibilityState={{ disabled: pendingAction != null }}
              disabled={pendingAction != null}
              onPress={close}
              hitSlop={10}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? scheme.bgSunken : scheme.bgPage,
                opacity: pendingAction ? 0.5 : 1,
              })}
            >
              <X size={18} color={scheme.fgMuted} strokeWidth={2.4} />
            </Pressable>
          </View>

          {chore.state === "todo" && chore.note ? (
            <View
              style={{
                marginTop: 18,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: radius.sm,
                backgroundColor: scheme.tint.warning,
              }}
            >
              <Text style={[typography.text.label, { color: scheme.fg, fontSize: 13 }]}>
                Parent note
              </Text>
              <Text
                style={[
                  typography.text.bodySm,
                  { color: scheme.fgMuted, marginTop: 3 },
                ]}
              >
                {chore.note}
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: 22 }}>
            {chore.state === "todo" ? (
              <PrimaryButton
                label="Mark as finished"
                disabled={pendingAction != null}
                onPress={() => void runAction("submit", onSubmit)}
              />
            ) : chore.state === "waiting" ? (
              confirmingUndo ? (
                <View>
                  <Text
                    style={[
                      typography.text.h3,
                      { color: scheme.fg, fontSize: 16, textAlign: "center" },
                    ]}
                  >
                    Move this chore back to To do?
                  </Text>
                  <Text
                    style={[
                      typography.text.bodySm,
                      {
                        color: scheme.fgMuted,
                        textAlign: "center",
                        marginTop: 5,
                        marginBottom: 16,
                      },
                    ]}
                  >
                    You can mark it as finished again when it is ready.
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <SecondaryButton
                      label="Cancel undo"
                      text="Cancel"
                      disabled={pendingAction != null}
                      onPress={() => setConfirmingUndo(false)}
                    />
                    <PrimaryButton
                      label="Confirm move to To do"
                      text="Move to To do"
                      disabled={pendingAction != null}
                      onPress={() => void runAction("undo", onUndo)}
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      marginBottom: 14,
                    }}
                  >
                    <Clock
                      size={17}
                      color={palette.semantic.warning[600]}
                      strokeWidth={2.3}
                    />
                    <Text
                      style={[
                        typography.text.label,
                        { color: palette.semantic.warning[600], fontSize: 14 },
                      ]}
                    >
                      Waiting for parent
                    </Text>
                  </View>
                  <SecondaryButton
                    label="Undo finished"
                    text="Undo finished"
                    icon={
                      <RotateCcw size={16} color={scheme.fgMuted} strokeWidth={2.3} />
                    }
                    disabled={pendingAction != null}
                    onPress={() => {
                      setErrorMessage(null);
                      setConfirmingUndo(true);
                    }}
                  />
                </View>
              )
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  paddingVertical: 14,
                  borderRadius: radius.pill,
                  backgroundColor: scheme.tint.giving,
                }}
              >
                <Check size={18} color={giving[800]} strokeWidth={2.8} />
                <Text
                  style={[
                    typography.text.label,
                    { color: giving[800], fontSize: 15 },
                  ]}
                >
                  Approved
                </Text>
              </View>
            )}
          </View>

          {errorMessage ? (
            <Text
              accessibilityRole="alert"
              style={[
                typography.text.bodySm,
                {
                  color: palette.semantic.danger[600],
                  textAlign: "center",
                  marginTop: 14,
                },
              ]}
            >
              {errorMessage}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Modal>
  );
}

function PrimaryButton({
  label,
  text = label,
  disabled,
  onPress,
}: {
  label: string;
  text?: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { typography, radius } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: radius.pill,
        backgroundColor: pressed ? giving[400] : giving[200],
        opacity: disabled ? 0.55 : 1,
      })}
    >
      <Text
        style={[
          typography.text.label,
          { color: giving[800], fontSize: 15, textAlign: "center" },
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  text,
  icon,
  disabled,
  onPress,
}: {
  label: string;
  text: string;
  icon?: React.ReactNode;
  disabled: boolean;
  onPress: () => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: palette.border.mid,
        backgroundColor: pressed ? scheme.bgSunken : scheme.bgPage,
        opacity: disabled ? 0.55 : 1,
      })}
    >
      {icon}
      <Text
        style={[
          typography.text.label,
          { color: scheme.fgMuted, fontSize: 15, textAlign: "center" },
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}
