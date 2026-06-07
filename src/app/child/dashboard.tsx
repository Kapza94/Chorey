import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";

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

const emptyBalances: BucketBalances = {
  givingCents: 0,
  savingsCents: 0,
  spendCents: 0,
};

function isDone(status: ChildChore["status"]) {
  return status === "submitted" || status === "approved";
}

export default function ChildDashboardRoute() {
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

  useEffect(() => {
    let mounted = true;

    if (!accessCode) {
      return;
    }

    Promise.all([
      listChoresForChild(accessCode),
      getBucketBalancesForChild(accessCode),
      listWishlistForChild(accessCode),
    ]).then(([nextChores, nextBalances, nextWishlistItems]) => {
      if (mounted) {
        setChores(nextChores);
        setBucketBalances(nextBalances);
        setWishlistItems(nextWishlistItems);
      }
    });

    return () => {
      mounted = false;
    };
  }, [accessCode]);

  const kidChores = useMemo<KidChore[]>(
    () =>
      chores.map((chore) => ({
        id: chore.id,
        name: chore.title,
        valueCents: chore.rewardCents,
        state:
          chore.status === "approved"
            ? ("approved" as const)
            : chore.status === "submitted"
              ? ("waiting" as const)
              : ("todo" as const),
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
    />
  );
}
