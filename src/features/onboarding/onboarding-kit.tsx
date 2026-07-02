import { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type TextInputProps,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";

/** Full-bleed onboarding screen scaffold: header (back + progress) / scroll / footer. */
export function OBShell({
  onBack,
  progress,
  footer,
  children,
  scroll = true,
}: {
  onBack?: () => void;
  progress?: { index: number; total: number };
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Set false for pages with a drawing surface (signature) so finger drags
   *  don't scroll the page out from under the pen. */
  scroll?: boolean;
}) {
  const { scheme } = useChoreyTheme();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const footerBottomPadding =
    keyboardHeight > 0 ? keyboardHeight + 12 : Math.max(insets.bottom + 16, 30);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <View
      style={{ flex: 1, backgroundColor: scheme.bgPage, paddingTop: 52 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingHorizontal: 22,
          paddingTop: 6,
          minHeight: 38,
        }}
      >
        <BackChevron onPress={onBack} />
        {progress ? (
          <OBProgress index={progress.index} total={progress.total} />
        ) : null}
      </View>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 26,
            paddingTop: 10,
            paddingBottom: 20,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            paddingHorizontal: 26,
            paddingTop: 10,
            paddingBottom: 20,
          }}
        >
          {children}
        </View>
      )}
      {footer ? (
        <View
          style={{
            backgroundColor: scheme.bgPage,
            paddingHorizontal: 26,
            paddingTop: 14,
            paddingBottom: footerBottomPadding,
            gap: 10,
          }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

function BackChevron({ onPress }: { onPress?: () => void }) {
  const { scheme } = useChoreyTheme();
  if (!onPress) {
    return <View style={{ width: 30 }} />;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      style={{
        width: 30,
        height: 30,
        borderRadius: 999,
        backgroundColor: scheme.bgRaised,
        alignItems: "center",
        justifyContent: "center",
        ...scheme.shadow.xs,
      }}
    >
      <ChevronLeft size={16} color={scheme.fg} strokeWidth={2.4} />
    </Pressable>
  );
}

export function OBProgress({ index, total }: { index: number; total: number }) {
  const { palette } = useChoreyTheme();
  // Fill the track proportionally: page (index+1) of `total`. Full width of the
  // header row (flex: 1), so two pages into an 8-page flow reads as 25%.
  const pct = total > 0 ? Math.min(1, Math.max(0, (index + 1) / total)) : 0;
  return (
    <View
      style={{
        flex: 1,
        height: 5,
        borderRadius: 999,
        backgroundColor: palette.border.strong,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          borderRadius: 999,
          backgroundColor: palette.accent[600],
        }}
      />
    </View>
  );
}

export function OBPrimary({
  children,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { scheme, typography, palette, toybox } = useChoreyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        width: "100%",
        paddingVertical: 15,
        borderRadius: 999,
        alignItems: "center",
        backgroundColor: disabled
          ? scheme.bgSunken
          : pressed
            ? palette.accent[800]
            : palette.accent[600],
        borderColor: scheme.toy.border,
        borderWidth: toybox.borderWidth,
        // Pressing drops the button onto its shadow.
        ...(pressed && !disabled
          ? { transform: [{ translateY: toybox.offset }] }
          : scheme.toy.shadow),
      })}
    >
      <Text
        style={[
          typography.text.label,
          {
            fontSize: 16,
            color: disabled ? scheme.fgDisabled : palette.cream[4],
          },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function OBSecondary({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { scheme, typography } = useChoreyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={{
        width: "100%",
        paddingVertical: 13,
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={[typography.text.label, { color: scheme.fgMuted }]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function OBTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { scheme, typography } = useChoreyTheme();
  return (
    <View style={{ marginTop: 6, marginBottom: 22 }}>
      <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 32 }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            typography.text.body,
            { color: scheme.fgMuted, marginTop: 10 },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function OBField({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  keyboardType,
  autoFocus,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  onFocus,
  onBlur,
  autoCapitalize,
  autoCorrect,
  autoComplete,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  keyboardType?: KeyboardTypeOptions;
  autoFocus?: boolean;
  maxLength?: number;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: boolean;
  autoComplete?: TextInputProps["autoComplete"];
}) {
  const { scheme, typography, radius } = useChoreyTheme();
  return (
    <View>
      {label ? (
        <Text
          style={[
            typography.text.overline,
            { color: scheme.fgFaint, marginBottom: 7 },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View style={{ justifyContent: "center" }}>
        {prefix ? (
          <Text
            style={{
              position: "absolute",
              left: 16,
              zIndex: 1,
              color: scheme.fgFaint,
              fontSize: 16,
              fontFamily: typography.family.body.semibold,
            }}
          >
            {prefix}
          </Text>
        ) : null}
        <TextInput
          accessibilityLabel={label ?? placeholder}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={scheme.fgDisabled}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          style={{
            // A shade lighter than the cards/sheets it sits on (bgRaised) so the
            // field reads as a distinct, tappable control instead of blending
            // into the surrounding card. Border uses the bold toybox ink outline
            // to match the rest of the form fields (see field-style.ts).
            backgroundColor: scheme.bgModal,
            borderColor: scheme.toy.border,
            borderWidth: 1.5,
            borderRadius: radius.sm,
            // Fixed single-line height (not vertical padding) so the caret and
            // text center together on iOS — padding makes the caret float up.
            height: 52,
            paddingVertical: 0,
            // Clear the fixed prefix whatever its length ("$" or "CHOREY-").
            // ~9.6px/char approximates the semibold 16pt prefix width.
            paddingLeft: prefix ? 16 + Math.ceil(prefix.length * 9.6) + 2 : 16,
            paddingRight: 16,
            fontFamily: typography.family.body.regular,
            fontSize: 16,
            color: scheme.fg,
            textAlignVertical: "center",
          }}
        />
      </View>
    </View>
  );
}

/** Small round +/- stepper used by the budget cap and split editors. */
export function OBStepButton({
  symbol,
  label,
  onPress,
  tone = "spend",
}: {
  symbol: string;
  label: string;
  onPress: () => void;
  tone?: "spend" | "savings" | "giving";
}) {
  const { palette } = useChoreyTheme();
  const ramp = bucketTokens[tone].ramp;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 30,
        height: 30,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: ramp[400],
        backgroundColor: palette.cream[4],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: ramp[800],
          lineHeight: 20,
        }}
      >
        {symbol}
      </Text>
    </Pressable>
  );
}
