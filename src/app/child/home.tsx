import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";

import { KidApp } from "@/features/kid-home/kid-app";
import type { KidChore } from "@/features/kid-home/kid-home-screen";
import type { KidWish } from "@/features/kid-home/kid-wishlist-screen";
import type { ChildChore } from "@/features/chores/child-chore-actions";
import type { BucketBalances } from "@/features/chores/money";
import {
  listChoresForChild,
  submitChoreForChild,
} from "@/features/chores/default-child-chore-actions";
import { getBucketBalancesForChild } from "@/features/ledger/default-ledger-actions";
import {
  listWishlistForChild,
  requestWishlistPurchase,
} from "@/features/spend-wishlist/default-spend-wishlist-actions";
import type { SpendWishlistItem } from "@/features/spend-wishlist/spend-wishlist-actions";
import { listGivingOptionsForChild } from "@/features/giving/default-giving-actions";
import type { GivingOption } from "@/features/giving/giving-actions";

const emptyBalances: BucketBalances = {
  givingCents: 0,
  savingsCents: 0,
  spendCents: 0,
};

function isDone(status: ChildChore["status"]) {
  return status === "submitted" || status === "approved";
}

/**
 * The redesigned kid app, fed from real Supabase rows via the child's access
 * code. Mirrors the data wiring in `child/dashboard.tsx`, plus the chosen giving
 * cause. (Giving "given so far" tracking is a follow-up — see the build plan.)
 */
export default function ChildHomeRoute() {
  const params = useLocalSearchParams<{ accessCode?: string; childName?: string }>();
  const accessCode = Array.isArray(params.accessCode)
    ? params.accessCode[0]
    : params.accessCode;
  const childName = Array.isArray(params.childName)
    ? params.childName[0]
    : params.childName;

  const [chores, setChores] = useState<ChildChore[]>([]);
  const [wishlistItems, setWishlistItems] = useState<SpendWishlistItem[]>([]);
  const [bucketBalances, setBucketBalances] =
    useState<BucketBalances>(emptyBalances);
  const [givingOptions, setGivingOptions] = useState<GivingOption[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      if (!accessCode) {
        return;
      }

      Promise.all([
        listChoresForChild(accessCode),
        getBucketBalancesForChild(accessCode),
        listWishlistForChild(accessCode),
        listGivingOptionsForChild(accessCode),
      ]).then(([nextChores, nextBalances, nextWishlistItems, nextGivingOptions]) => {
        if (mounted) {
          setChores(nextChores);
          setBucketBalances(nextBalances);
          setWishlistItems(nextWishlistItems);
          setGivingOptions(nextGivingOptions);
        }
      });

      return () => {
        mounted = false;
      };
    }, [accessCode]),
  );

  const kidChores = useMemo<KidChore[]>(
    () =>
      chores.map((chore) => ({
        id: chore.id,
        name: chore.title,
        valueCents: chore.rewardCents,
        done: isDone(chore.status),
      })),
    [chores],
  );

  const wishes = useMemo<KidWish[]>(
    () =>
      wishlistItems.map((item) => ({
        id: item.id,
        name: item.name,
        targetCents: item.targetCents,
        status: item.status,
      })),
    [wishlistItems],
  );

  return (
    <KidApp
      name={childName}
      currency="USD"
      chores={kidChores}
      onToggleChore={async (choreId) => {
        if (!accessCode) {
          return;
        }

        const target = chores.find((chore) => chore.id === choreId);
        if (!target || isDone(target.status)) {
          return; // already submitted/approved — no un-check path in v1
        }

        const submitted = await submitChoreForChild({ accessCode, choreId });
        setChores((current) =>
          current.map((chore) => (chore.id === choreId ? submitted : chore)),
        );
      }}
      spendableCents={bucketBalances.spendCents}
      wishes={wishes}
      onRequestPurchase={async (wishId) => {
        if (!accessCode) {
          return;
        }

        await requestWishlistPurchase({ accessCode, wishlistItemId: wishId });
        setWishlistItems((current) =>
          current.map((item) =>
            item.id === wishId ? { ...item, status: "requested" } : item,
          ),
        );
      }}
      savingsCents={bucketBalances.savingsCents}
      givingCents={bucketBalances.givingCents}
      causeName={givingOptions[0]?.name ?? null}
    />
  );
}
