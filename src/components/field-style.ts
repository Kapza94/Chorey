import type { TextStyle } from "react-native";

import type { ChoreyScheme } from "@/theme/chorey-theme";

/**
 * Shared text-input style for sheets and forms.
 *
 * Inputs used to wear a faint 1px `border.mid` hairline, which all but vanished
 * against the cream sheet surface — they read as half-rendered ghost boxes next
 * to the app's bold outlined tiles. This gives every field the same toybox ink
 * outline the cards use, so a field looks like a deliberate, tappable control.
 */
export function fieldStyle(scheme: ChoreyScheme, bodyFontFamily: string): TextStyle {
  return {
    backgroundColor: scheme.bgPage,
    borderColor: scheme.toy.border,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: bodyFontFamily,
    fontSize: 15,
    color: scheme.fg,
  };
}
