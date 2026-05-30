import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ChildDashboardScreen } from "@/features/child-dashboard/child-dashboard-screen";
import type { ChildChore } from "@/features/chores/child-chore-actions";
import type { BucketBalances } from "@/features/chores/money";
import {
  listChoresForChild,
  submitChoreForChild,
} from "@/features/chores/default-child-chore-actions";
import { getBucketBalancesForChild } from "@/features/ledger/default-ledger-actions";
import {
  createWishlistItemForChild,
  listWishlistForChild,
  requestWishlistPurchase,
} from "@/features/spend-wishlist/default-spend-wishlist-actions";
import type { SpendWishlistItem } from "@/features/spend-wishlist/spend-wishlist-actions";

const emptyBalances: BucketBalances = {
  givingCents: 0,
  savingsCents: 0,
  spendCents: 0,
};

export default function ChildDashboardRoute() {
  const router = useRouter();
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
  const [submittingChoreId, setSubmittingChoreId] = useState<string | null>(
    null,
  );

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

  return (
    <ChildDashboardScreen
      bucketBalances={bucketBalances}
      childName={childName}
      chores={chores}
      onCreateWishlistItem={async (input) => {
        if (!accessCode) {
          return;
        }

        const item = await createWishlistItemForChild({
          accessCode,
          name: input.name,
          targetCents: input.targetCents,
        });
        setWishlistItems((current) => [item, ...current]);
      }}
      onBack={() => router.back()}
      onRequestPurchase={async (wishlistItemId) => {
        if (!accessCode) {
          return;
        }

        await requestWishlistPurchase({ accessCode, wishlistItemId });
        setWishlistItems((current) =>
          current.map((item) =>
            item.id === wishlistItemId ? { ...item, status: "requested" } : item,
          ),
        );
      }}
      onSubmitChore={async (choreId) => {
        if (!accessCode) {
          return;
        }

        setSubmittingChoreId(choreId);

        try {
          const submitted = await submitChoreForChild({ accessCode, choreId });
          setChores((current) =>
            current.map((chore) => (chore.id === choreId ? submitted : chore)),
          );
        } finally {
          setSubmittingChoreId(null);
        }
      }}
      submittingChoreId={submittingChoreId}
      wishlistItems={wishlistItems}
    />
  );
}
