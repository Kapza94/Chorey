import { createRef } from "react";
import type { View } from "react-native";

import { createShareStatsActions } from "@/features/parent-app/share-actions";

describe("createShareStatsActions", () => {
  it("captures the card ref, then shares the resulting uri with the caption", async () => {
    const calls: string[] = [];
    const ref = createRef<View>();
    const actions = createShareStatsActions({
      capture: async () => {
        calls.push("capture");
        return "file:///tmp/card.png";
      },
      share: async (uri, caption) => {
        calls.push(`share:${uri}:${caption}`);
      },
    });

    await actions.shareCard(ref, "Look at our week");

    expect(calls).toEqual(["capture", "share:file:///tmp/card.png:Look at our week"]);
  });

  it("does not share when capture fails", async () => {
    let shared = false;
    const actions = createShareStatsActions({
      capture: async () => {
        throw new Error("snapshot failed");
      },
      share: async () => {
        shared = true;
      },
    });

    await expect(actions.shareCard(createRef<View>(), "x")).rejects.toThrow("snapshot failed");
    expect(shared).toBe(false);
  });
});
