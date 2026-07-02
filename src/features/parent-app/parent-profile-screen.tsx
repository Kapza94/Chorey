import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Camera, ChevronRight } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { SetupScreenLayout } from "@/components/setup-screen-layout";
import { ToyAvatar, ToyButton, ToySticker } from "@/components/toybox";
import { OBField } from "@/features/onboarding/onboarding-kit";
import { CurrencyPicker } from "@/components/currency-picker";
import { currencyLabel, type CurrencyCode } from "@/features/money/currency";

// Same presets the onboarding "Set up your family" step offers, kept in sync so
// editing later reads identically to setup.
const PARENT_LABELS = ["Mom", "Dad", "Parent", "Guardian"];

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  email: "Email",
};

export type ParentProfileScreenProps = {
  /** parent display name */
  name: string;
  /** what the kids call this parent (Mom/Dad/custom) */
  parentLabel: string;
  /** household display name */
  familyName: string;
  currency: CurrencyCode;
  /** read-only for now — email is the auth identity, changed as a fast-follow */
  email: string;
  /** "google" | "apple" | "email" */
  provider: string;
  avatarUrl?: string | null;
  onChangeName: (name: string) => void;
  onChangeParentLabel: (label: string) => void;
  onChangeFamilyName: (name: string) => void;
  onChangeCurrency: (currency: CurrencyCode) => void;
  /** Pick + upload a new profile photo. Resolves when done (or cancelled). */
  onChangePhoto?: () => Promise<void> | void;
  onBack: () => void;
};

/** Pure screen: edit every parent/family detail set during onboarding. Each
 *  field persists on blur/select via its callback — no single Save button. */
export function ParentProfileScreen({
  name,
  parentLabel,
  familyName,
  currency,
  email,
  provider,
  avatarUrl,
  onChangeName,
  onChangeParentLabel,
  onChangeFamilyName,
  onChangeCurrency,
  onChangePhoto,
  onBack,
}: ParentProfileScreenProps) {
  const { scheme, typography, palette, radius } = useChoreyTheme();

  // Local drafts so typing stays smooth; each commits on blur.
  const [nameDraft, setNameDraft] = useState(name);
  const [familyDraft, setFamilyDraft] = useState(familyName);
  const [labelDraft, setLabelDraft] = useState(parentLabel);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const providerLabel = PROVIDER_LABEL[provider] ?? "Account";

  const commit = (draft: string, current: string, save: (v: string) => void) => {
    const next = draft.trim();
    if (next && next !== current) {
      save(next);
    }
  };

  const pickLabel = (label: string) => {
    setLabelDraft(label);
    onChangeParentLabel(label);
  };

  const changePhoto = async () => {
    if (!onChangePhoto || uploadingPhoto) {
      return;
    }
    setUploadingPhoto(true);
    try {
      await onChangePhoto();
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <SetupScreenLayout
      eyebrow="Your account"
      title="Account & family."
      description="Edit anything you set up — your name, what your kids call you, the family name, or your currency."
      onBack={onBack}
      footer={
        <ToyButton accessibilityLabel="Done" onPress={onBack}>
          Done
        </ToyButton>
      }
    >
      {/* Identity: photo + email (read-only). */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          disabled={!onChangePhoto || uploadingPhoto}
          onPress={changePhoto}
          style={{ width: 64, height: 64 }}
        >
          <ToyAvatar name={name} tone="savings" size={64} imageUrl={avatarUrl} />
          {onChangePhoto ? (
            <View
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 26,
                height: 26,
                borderRadius: 999,
                backgroundColor: palette.accent[600],
                borderColor: scheme.bgPage,
                borderWidth: 2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={palette.cream[4]} />
              ) : (
                <Camera size={13} color={palette.cream[4]} strokeWidth={2.4} />
              )}
            </View>
          ) : null}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={[typography.text.overline, { color: scheme.fgFaint }]}
          >
            Signed in with {providerLabel}
          </Text>
          <Text
            style={[typography.text.body, { color: scheme.fg, marginTop: 2 }]}
            numberOfLines={1}
          >
            {email || "—"}
          </Text>
        </View>
        <ToySticker label={providerLabel} tone="savings" />
      </View>

      <OBField
        label="Your name"
        value={nameDraft}
        onChange={setNameDraft}
        onBlur={() => commit(nameDraft, name, onChangeName)}
        placeholder="e.g. Alex"
        autoCapitalize="words"
      />

      {/* Parent label: preset pills + free-text, mirroring onboarding. */}
      <View>
        <Text
          style={[
            typography.text.overline,
            { color: scheme.fgFaint, marginBottom: 8 },
          ]}
        >
          What your kids call you
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {PARENT_LABELS.map((label) => {
            const selected = labelDraft === label;
            return (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                onPress={() => pickLabel(label)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: radius.pill,
                  borderWidth: 1.5,
                  borderColor: selected ? palette.accent[600] : palette.border.mid,
                  backgroundColor: selected
                    ? palette.accent[100]
                    : pressed
                      ? scheme.bgSunken
                      : scheme.bgRaised,
                })}
              >
                <Text
                  style={[
                    typography.text.label,
                    {
                      color: selected ? palette.accent[800] : scheme.fgMuted,
                      fontSize: 14,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ marginTop: 10 }}>
          <OBField
            label="Or type your own"
            value={labelDraft}
            onChange={setLabelDraft}
            onBlur={() => commit(labelDraft, parentLabel, onChangeParentLabel)}
            placeholder="e.g. Papa, Mama, Baba"
            autoCapitalize="words"
            maxLength={20}
          />
        </View>
      </View>

      <OBField
        label="Family name"
        value={familyDraft}
        onChange={setFamilyDraft}
        onBlur={() => commit(familyDraft, familyName, onChangeFamilyName)}
        placeholder="e.g. The Rivera Family"
        autoCapitalize="words"
      />

      {/* Currency */}
      <View>
        <Text
          style={[
            typography.text.overline,
            { color: scheme.fgFaint, marginBottom: 7 },
          ]}
        >
          Currency
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose your currency"
          onPress={() => setCurrencyPickerOpen(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: scheme.bgRaised,
            borderColor: palette.border.mid,
            borderWidth: 1.5,
            borderRadius: radius.sm,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text style={[typography.text.body, { color: scheme.fg }]}>
            {currencyLabel(currency)}
          </Text>
          <ChevronRight size={16} color={scheme.fgFaint} strokeWidth={2} />
        </Pressable>
        <Text
          style={[
            typography.text.caption,
            { color: scheme.fgFaint, marginTop: 8 },
          ]}
        >
          Amounts across the app show in this currency.
        </Text>
      </View>

      <CurrencyPicker
        visible={currencyPickerOpen}
        selectedCode={currency || null}
        onSelect={(c) => onChangeCurrency(c.code)}
        onClose={() => setCurrencyPickerOpen(false)}
      />
    </SetupScreenLayout>
  );
}
