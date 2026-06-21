import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { KidApp } from "@/features/kid-home/kid-app";
import { useChoreyTheme } from "@/theme/use-chorey-theme";
import type { KidChore } from "@/features/kid-home/kid-home-screen";
import type { KidWish } from "@/features/kid-home/kid-wishlist-screen";
import type { ChildChore } from "@/features/chores/child-chore-actions";
import { isRecurringChoreLate } from "@/features/chores/recurrence";
import type { BucketBalances } from "@/features/chores/money";
import {
  listChoresForChild,
  submitChoreForChild,
  undoChoreSubmissionForChild,
} from "@/features/chores/default-child-chore-actions";
import {
  pickChorePhoto,
  uploadChorePhotoForChild,
} from "@/features/chores/default-child-photo-actions";
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
import { registerChildForPushNotifications } from "@/features/notifications/default-notification-actions";
import { getGameStatsForChild } from "@/features/game/default-game-actions";
import type { ChildGameStats } from "@/features/game/game-actions";
import { levelForPoints } from "@/features/game/leveling";
import {
  getLastDrivenLevel,
  getLastSeenLevel,
  setLastDrivenLevel,
  setLastSeenLevel,
} from "@/features/game/level-memory";
import type { ChildSession } from "@/features/children/child-session";
import {
  clearChildSession,
  loadChildSession,
  saveChildSession,
} from "@/features/children/default-child-session";

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
  const [badCode, setBadCode] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [paused, setPaused] = useState(false);

  const [chores, setChores] = useState<ChildChore[]>([]);
  const [wishlistItems, setWishlistItems] = useState<SpendWishlistItem[]>([]);
  const [bucketBalances, setBucketBalances] =
    useState<BucketBalances>(emptyBalances);
  const [givingOptions, setGivingOptions] = useState<GivingOption[]>([]);
  const [gameStats, setGameStats] = useState<ChildGameStats>({
    totalPoints: 0,
    approvedCount: 0,
  });
  const [celebrationLevel, setCelebrationLevel] = useState<number | null>(null);

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
          // A returning kid with a stored session is just offline — keep them in
          // on what we already know. But a first-time join (no stored session)
          // that won't resolve is almost always a wrong code: send them back to
          // re-enter it instead of into a dead-end "couldn't load" screen that
          // blames the internet.
          const stored = loadChildSession();
          if (stored && stored.accessCode === paramAccessCode) {
            setSession(stored);
          } else {
            setBadCode(true);
          }
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

  // Register this device for push once we know the child — so a late daily
  // chore can nudge them. Best-effort and idempotent (no-op without EAS/perms).
  useEffect(() => {
    if (accessCode) {
      void registerChildForPushNotifications(accessCode);
    }
  }, [accessCode]);

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
        // Re-resolve every visit so a pause (or resume) shows up promptly.
        resolveChildAccessCode(accessCode),
        getGameStatsForChild(accessCode),
      ])
        .then(([nextChores, nextBalances, nextWishlistItems, nextGivingOptions, resolved, nextGameStats]) => {
          if (mounted) {
            setLoadFailed(false);
            setChores(nextChores);
            setBucketBalances(nextBalances);
            setWishlistItems(nextWishlistItems);
            setGivingOptions(nextGivingOptions);
            setPaused(resolved.paused);
            setGameStats(nextGameStats);

            // Celebrate levels gained since this device last saw them. First
            // run just records the baseline — no celebration for old progress.
            const level = levelForPoints(nextGameStats.totalPoints);
            const kidKey = session?.childProfileId || accessCode;
            const lastSeen = getLastSeenLevel(kidKey);
            if (lastSeen > 0 && level > lastSeen) {
              setCelebrationLevel(level);
            } else if (lastSeen === 0) {
              setLastSeenLevel(kidKey, level);
            }
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
    }, [accessCode, loadAttempt, session?.childProfileId]),
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
        late: isRecurringChoreLate(chore),
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

  // Drop any half-formed session and send the kid back to the start, where the
  // onboarding kid path lets them type a fresh code.
  const reenterCode = () => {
    clearChildSession();
    router.replace("/");
  };

  if (badCode) {
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
          That code didn&apos;t work.
        </Text>
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted, textAlign: "center" }]}>
          Double-check the code with a parent — it looks like CHOREY-XXXXXXXX.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enter a different code"
          onPress={reenterCode}
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
            Enter a different code
          </Text>
        </Pressable>
      </View>
    );
  }

  if (sessionChecked && !session) {
    return <Redirect href="/" />;
  }

  if (!session) {
    return null;
  }

  if (paused) {
    // Neutral by design: a child never sees billing, prices, or subscription
    // terminology — just that Chorey is resting and their money is safe.
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
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          <View style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: scheme.tint.allowance }} />
          <View style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: scheme.tint.savings }} />
          <View style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: scheme.tint.giving }} />
        </View>
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 26, textAlign: "center" }]}>
          Chorey is taking a break.
        </Text>
        <Text
          style={[
            typography.text.bodySm,
            { color: scheme.fgMuted, textAlign: "center", lineHeight: 22 },
          ]}
        >
          Ask a parent to turn it back on. Your buckets are safe and waiting.
        </Text>
      </View>
    );
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enter a different code"
          onPress={reenterCode}
          style={{ marginTop: 4, paddingHorizontal: 28, paddingVertical: 10 }}
        >
          <Text style={[typography.text.label, { color: scheme.fgMuted, fontSize: 14 }]}>
            Enter a different code
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
      totalPoints={gameStats.totalPoints}
      celebrationLevel={celebrationLevel}
      journeyFromLevel={
        getLastDrivenLevel(session?.childProfileId || accessCode || "") ||
        levelForPoints(gameStats.totalPoints)
      }
      onJourneyArrived={() =>
        setLastDrivenLevel(
          session?.childProfileId || accessCode || "",
          levelForPoints(gameStats.totalPoints),
        )
      }
      onCelebrationDone={() => {
        setLastSeenLevel(
          session?.childProfileId || accessCode || "",
          levelForPoints(gameStats.totalPoints),
        );
        setCelebrationLevel(null);
      }}
      pickPhoto={pickChorePhoto}
      onSubmitChore={async (choreId, photoBase64) => {
        if (!accessCode) {
          throw new Error("Child access code is missing.");
        }

        const submitted = await submitChoreForChild({ accessCode, choreId });
        setChores((current) =>
          current.map((chore) => (chore.id === choreId ? submitted : chore)),
        );

        // Upload after the chore is submitted so the row exists for the edge
        // function to stamp. Best-effort: the chore is finished either way, so a
        // failed photo upload must not surface as a failed submit.
        if (photoBase64) {
          try {
            await uploadChorePhotoForChild({ accessCode, choreId, imageBase64: photoBase64 });
          } catch {
            // ponytail: photo is a bonus; swallow so the kid isn't told the
            // (successful) submit failed. Add a "photo didn't send" toast if it matters.
          }
        }
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
