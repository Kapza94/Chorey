/**
 * Share-stats actions — the side-effectful half of the feature.
 *
 * Snapshotting a view and opening the OS share sheet are native operations, so
 * they live here behind a typed factory (mirroring the `*-actions` pattern). The
 * card component stays a pure view: it owns a ref and hands it to `shareCard`,
 * which captures it to an image and shares it. Tests inject stub `capture` /
 * `share` deps; `default-share-actions.ts` wires the real native modules.
 */
import type { RefObject } from "react";
import type { View } from "react-native";

export type ShareStatsActions = {
  /**
   * Capture the referenced card view to an image and open the share sheet with
   * it (caption included where the target supports text). Resolves whether or
   * not the user completes the share; rejects only on a real capture/share
   * failure.
   */
  shareCard: (viewRef: RefObject<View | null>, caption: string) => Promise<void>;
};

/** Captures a view ref to a local image file URI. */
export type CaptureView = (viewRef: RefObject<View | null>) => Promise<string>;

/** Opens the OS share sheet for a local file URI, with a text caption. */
export type ShareImage = (uri: string, caption: string) => Promise<void>;

export function createShareStatsActions(deps: {
  capture: CaptureView;
  share: ShareImage;
}): ShareStatsActions {
  return {
    async shareCard(viewRef, caption) {
      const uri = await deps.capture(viewRef);
      await deps.share(uri, caption);
    },
  };
}
