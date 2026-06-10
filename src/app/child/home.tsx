import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { KidApp } from "@/features/kid-home/kid-app";
import { useChoreyTheme } from "@/theme/use-chorey-theme";
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
import { resolveChildAccessCode } from "@/features/children/default-child-access-actions";
import type { ChildSession } from "@/features/children/child-session";
import {
  clearChildSession,
  loadChildSession,
  saveChildSession,
} from "@/features/children/default-child-session";
import { DEFAULT_CURRENCY } from "@/features/money/currency";

const emptyBalances: BucketBalances = {
  givingCents: 0,
  savingsCents: 0,
  spendCents: 0,
};

/**
 * The kid app, fed from real Supabase rows via the child's access code.
 *
 * Entering with an access code (from the access screen or onboarding) resolves
 * the full child + household currency and persists the session, so the device
 * remembers the kid across restarts. With no code and no stored session, the
 * kid is sent back to the start.
 */
export default function ChildHomeRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accessCode?: string; childName?: string }>();
  const paramAccessCode = Array.isArray(params.accessCode)
    ? params.accessCode[0]
    : params.accessCode;
  const paramChildName = Array.isArray(params.childName)
    ? params.childName[0]
    : params.childName;

  const { scheme, typography, radius } = useChoreyTheme();
  const [session, setSession] = useState<ChildSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [chores, setChores] = useState<ChildChore[]>([]);
  const [wishlistItems, setWishlistItems] = useState<SpendWishlistItem[]>([]);
  const [bucketBalances, setBucketBalances] =
    useState<BucketBalances>(emptyBalances);
  const [givingOptions, setGivingOptions] = useState<GivingOption[]>([]);

  useEffect(() => {
    let active = true;

    async function establishSession() {
      if (paramAccessCode) {
        try {
          const resolved = await resolveChildAccessCode(paramAccessCode);
          if (!active) return;

          const next: ChildSession = {
            accessCode: resolved.accessCode,
            childName: resolved.childName || paramChildName || "",
            childProfileId: resolved.childProfileId,
            householdId: resolved.householdId,
            currency: resolved.currency,
          };
          saveChildSession(next);
          setSession(next);
        } catch {
          if (!active) return;
          // Couldn't resolve right now (offline?) — keep the kid in with what
          // the params carry rather than bouncing them out.
          setSession({
            accessCode: paramAccessCode,
            childName: paramChildName ?? "",
            childProfileId: "",
            householdId: "",
            currency: DEFAULT_CURRENCY,
          });
        }
      } else {
        setSession(loadChildSession());
      }

      if (active) {
        setSessionChecked(true);
      }
    }

    void establishSession();

    return () => {
      active = false;
    };
  }, [paramAccessCode, paramChildName]);

  const accessCode = session?.accessCode;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      // Bumping loadAttempt re-arms this effect after a failed load.
      void loadAttempt;

      if (!accessCode) {
        return;
      }

      Promise.all([
        listChoresForChild(accessCode),
        getBucketBalancesForChild(accessCode),
        listWishlistForChild(accessCode),
        listGivingOptionsForChild(accessCode),
      ])
        .then(([nextChores, nextBalances, nextWishlistItems, nextGivingOptions]) => {
          if (mounted) {
            setLoadFailed(false);
            setChores(nextChores);
            setBucketBalances(nextBalances);
            setWishlistItems(nextWishlistItems);
            setGivingOptions(nextGivingOptions);
          }
        })
        .catch(() => {
          // A network blip must not look like "all my chores are gone".
          if (mounted) {
            setLoadFailed(true);
          }
        });

      return () => {
        mounted = false;
      };
    }, [accessCode, loadAttempt]),
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

  if (sessionChecked && !session) {
    return <Redirect href="/" />;
  }

  if (!session) {
    return null;
  }

  if (loadFailed) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: scheme.bgPage,
          flex: 1,
          gap: 8,
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 24, textAlign: "center" }]}>
          Hmm, that didn&apos;t load.
        </Text>
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted, textAlign: "center" }]}>
          Your chores and money are safe. Check the internet and try again.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={() => setLoadAttempt((attempt) => attempt + 1)}
          style={({ pressed }) => ({
            alignItems: "center",
            backgroundColor: pressed ? scheme.bgSunken : scheme.bgRaised,
            borderColor: scheme.border,
            borderRadius: radius.pill,
            borderWidth: 1,
            marginTop: 8,
            paddingHorizontal: 28,
            paddingVertical: 13,
          })}
        >
          <Text style={[typography.text.label, { color: scheme.fg, fontSize: 15 }]}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KidApp
      name={session.childName || undefined}
      currency={session.currency}
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
      onLogOut={() => {
        clearChildSession();
        router.replace("/");
      }}
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
