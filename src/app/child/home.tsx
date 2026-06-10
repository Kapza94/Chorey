import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { KidApp } from "@/features/kid-home/kid-app";
import type { KidChore } from "@/features/kid-home/kid-home-screen";
import type { KidWish } from "@/features/kid-home/kid-wishlist-screen";
import type { ChildChore } from "@/features/chores/child-chore-actions";
import type { BucketBalances } from "@/features/chores/money";
import {
  listChoresForChild,
  submitChoreForChild,
  undoChoreSubmissionForChild,
} from "@/features/chores/default-child-chore-actions";
import { getBucketBalancesForChild } from "@/features/ledger/default-ledger-actions";
import {
  createWishlistItemForChild,
  listWishlistForChild,
  requestWishlistPurchase,
} from "@/features/spend-wishlist/default-spend-wishlist-actions";
import type { SpendWishlistItem } from "@/features/spend-wishlist/spend-wishlist-actions";
import {
  listGivingOptionsForChild,
  suggestGivingOptionForChild,
} from "@/features/giving/default-giving-actions";
import type { GivingOption } from "@/features/giving/giving-actions";

const emptyBalances: BucketBalances = {
  givingCents: 0,
  savingsCents: 0,
  spendCents: 0,
};

/**
 * The redesigned kid app, fed from real Supabase rows via the child's access
 * code. Mirrors the data wiring in `child/dashboard.tsx`, plus the chosen giving
 * cause. (Giving "given so far" tracking is a follow-up — see the build plan.)
 */
export default function ChildHomeRoute() {
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
        state:
          chore.status === "approved"
            ? ("approved" as const)
            : chore.status === "submitted"
              ? ("waiting" as const)
              : ("todo" as const),
        note:
          chore.status === "sent_back" && chore.sentBackReason
            ? `Sent back: ${chore.sentBackReason}`
            : undefined,
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
      onSubmitChore={async (choreId) => {
        if (!accessCode) {
          throw new Error("Child access code is missing.");
        }

        const submitted = await submitChoreForChild({ accessCode, choreId });
        setChores((current) =>
          current.map((chore) => (chore.id === choreId ? submitted : chore)),
        );
      }}
      onUndoChore={async (choreId) => {
        if (!accessCode) {
          throw new Error("Child access code is missing.");
        }

        try {
          const assigned = await undoChoreSubmissionForChild({ accessCode, choreId });
          setChores((current) =>
            current.map((chore) => (chore.id === choreId ? assigned : chore)),
          );
        } catch (error) {
          setChores(await listChoresForChild(accessCode));
          throw error;
        }
      }}
      spendableCents={bucketBalances.spendCents}
      wishes={wishes}
      onAddWish={async ({ name, targetCents }) => {
        if (!accessCode) {
          return;
        }

        await createWishlistItemForChild({ accessCode, name, targetCents });
        setWishlistItems(await listWishlistForChild(accessCode));
      }}
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
      onLogOut={() => router.replace("/")}
      onSuggestCause={async (causeName) => {
        if (!accessCode) {
          return;
        }

        await suggestGivingOptionForChild({ accessCode, name: causeName });
        setGivingOptions(await listGivingOptionsForChild(accessCode));
      }}
    />
  );
}
