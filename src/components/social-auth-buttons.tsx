import { Platform, Pressable, Text, View } from "react-native";

import { AppleIcon, GoogleIcon } from "@/components/brand-icons";
import { choreyTheme } from "@/theme/chorey-theme";
import { useChoreyTheme } from "@/theme/use-chorey-theme";

type Variant = "apple" | "google";

/**
 * A single branded OAuth button. Apple keeps its required black pill + white
 * wordmark; Google sits on a light surface — both follow the providers' sign-in
 * button guidelines so the same component is safe on the sign-in screen and in
 * onboarding.
 */
export function SocialAuthButton({
  label,
  variant,
  onPress,
  disabled,
}: {
  label: string;
  variant: Variant;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { scheme, palette } = useChoreyTheme();
  const isApple = variant === "apple";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        borderRadius: choreyTheme.radii.pill,
        backgroundColor: isApple
          ? "#11100F"
          : pressed
            ? scheme.tint.allowance
            : scheme.bgModal,
        borderColor: isApple ? "#11100F" : scheme.border,
        borderWidth: 1,
        flexDirection: "row",
        minHeight: 48,
        opacity: disabled ? 0.6 : 1,
        paddingHorizontal: 18,
        paddingVertical: 13,
      })}
    >
      <View style={{ width: 24, alignItems: "center" }}>
        {isApple ? <AppleIcon /> : <GoogleIcon />}
      </View>
      <View style={{ flex: 1, alignItems: "center", paddingRight: 24 }}>
        <Text
          style={{
            // Adapt to the button surface: white on the dark-mode surface, dark
            // on light — a fixed grey vanished against bgModal in dark mode.
            color: isApple ? palette.cream[4] : scheme.fg,
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Apple + Google one-tap sign-in.
 *
 * Apple is rendered only on iOS — "Sign in with Apple" isn't offered on Android
 * (Google covers that platform), so the button is hidden there rather than
 * launching a flow Android users can't complete. The caller wires each provider
 * to its own handler; the parent container supplies the vertical spacing.
 */
export function SocialAuthButtons({
  onApple,
  onGoogle,
  disabled,
  appleLabel = "Continue with Apple",
  googleLabel = "Continue with Google",
}: {
  onApple: () => void;
  onGoogle: () => void;
  disabled?: boolean;
  appleLabel?: string;
  googleLabel?: string;
}) {
  return (
    <>
      {Platform.OS === "ios" ? (
        <SocialAuthButton
          label={appleLabel}
          variant="apple"
          onPress={onApple}
          disabled={disabled}
        />
      ) : null}
      <SocialAuthButton
        label={googleLabel}
        variant="google"
        onPress={onGoogle}
        disabled={disabled}
      />
    </>
  );
}
