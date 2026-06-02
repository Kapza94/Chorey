import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";

/** Full-bleed onboarding screen scaffold: header (back + progress) / scroll / footer. */
export function OBShell({
  onBack,
  progress,
  footer,
  children,
}: {
  onBack?: () => void;
  progress?: { index: number; total: number };
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { scheme } = useChoreyTheme();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: scheme.bgPage, paddingTop: 52 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
        {progress ? <OBProgress index={progress.index} total={progress.total} /> : null}
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 10, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={{ paddingHorizontal: 26, paddingTop: 14, paddingBottom: 30, gap: 10 }}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
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
  return (
    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 4,
            borderRadius: 999,
            width: i === index ? 22 : 6,
            backgroundColor: i <= index ? palette.accent[600] : palette.border.strong,
          }}
        />
      ))}
    </View>
  );
}

export function OBPrimary({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { scheme, typography, palette } = useChoreyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        width: "100%",
        paddingVertical: 15,
        borderRadius: 999,
        alignItems: "center",
        backgroundColor: disabled
          ? palette.cream[0]
          : pressed
            ? palette.accent[800]
            : palette.accent[600],
        transform: [{ scale: pressed && !disabled ? 0.975 : 1 }],
      })}
    >
      <Text
        style={[
          typography.text.label,
          { fontSize: 16, color: disabled ? scheme.fgDisabled : palette.cream[4] },
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
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) {
  const { scheme, typography } = useChoreyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ width: "100%", paddingVertical: 13, alignItems: "center" }}
    >
      <Text style={[typography.text.label, { color: scheme.fgMuted }]}>{children}</Text>
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
      <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 32 }]}>{title}</Text>
      {subtitle ? (
        <Text style={[typography.text.body, { color: scheme.fgMuted, marginTop: 10 }]}>
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
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  return (
    <View>
      {label ? (
        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 7 }]}>
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
          style={{
            backgroundColor: scheme.bgRaised,
            borderColor: palette.border.mid,
            borderWidth: 1.5,
            borderRadius: radius.sm,
            paddingVertical: 14,
            paddingLeft: prefix ? 28 : 16,
            paddingRight: 16,
            fontFamily: typography.family.body.regular,
            fontSize: 16,
            color: scheme.fg,
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
      <Text style={{ fontSize: 18, fontWeight: "700", color: ramp[800], lineHeight: 20 }}>
        {symbol}
      </Text>
    </Pressable>
  );
}
