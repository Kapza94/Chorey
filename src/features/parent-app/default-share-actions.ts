/**
 * Real wiring for the share-stats actions: `react-native-view-shot` snapshots
 * the card to a PNG, `expo-sharing` opens the OS share sheet with it. The image
 * already carries the numbers and branding, so it is the payload; the caption
 * rides along as the share dialog's title (the only text slot expo-sharing
 * exposes cross-platform).
 *
 * Both are native modules — they require a dev/EAS build, not Expo Go.
 */
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import {
  createShareStatsActions,
  type ShareStatsActions,
} from "@/features/parent-app/share-actions";

export const shareStatsActions: ShareStatsActions = createShareStatsActions({
  capture: (viewRef) =>
    captureRef(viewRef, { format: "png", quality: 1, result: "tmpfile" }),
  share: async (uri, caption) => {
    if (!(await Sharing.isAvailableAsync())) {
      return;
    }
    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      UTI: "public.png",
      dialogTitle: caption,
    });
  },
});
