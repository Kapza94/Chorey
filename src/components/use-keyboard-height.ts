import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Tracks the on-screen keyboard height so a bottom-anchored sheet can lift above
 * it (set the sheet's `bottom` to this value). Without it, a sheet pinned to
 * `bottom: 0` gets covered by the keyboard and its inputs/buttons become
 * unreachable.
 *
 * iOS fires `keyboardWillShow/Hide` (smoother, ahead of the animation); Android
 * only reliably fires the `Did` events.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
