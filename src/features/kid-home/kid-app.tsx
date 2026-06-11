import { useState } from "react";
import { View } from "react-native";

import { KidHomeScreen, type KidChore } from "@/features/kid-home/kid-home-screen";
import { KidChoreModal } from "@/features/kid-home/kid-chore-modal";
import { KidWishlistScreen, type KidWish } from "@/features/kid-home/kid-wishlist-screen";
import { KidYouScreen, type KidSavingsGoal } from "@/features/kid-home/kid-you-screen";
import { KidTabBar, type KidTab } from "@/features/kid-home/kid-tab-bar";
import { useChoreyTheme } from "@/theme/use-chorey-theme";
import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/features/money/currency";
import type { Split } from "@/features/money/split";

type Props = {
  // Home
  name?: string;
  age?: number | null;
  split?: Split;
  currency?: CurrencyCode;
  chores?: KidChore[];
  onSubmitChore?: (id: string) => Promise<void>;
  onUndoChore?: (id: string) => Promise<void>;
  // Wishlist
  spendableCents?: number;
  wishes?: KidWish[];
  onRequestPurchase?: (wishId: string) => void;
  onAddWish?: (input: { name: string; targetCents: number }) => void;
  // You
  savingsCents?: number;
  givingCents?: number;
  causeName?: string | null;
  savingsGoal?: KidSavingsGoal | null;
  onSetSavingsGoal?: (input: { name: string; targetCents: number }) => void;
  onSuggestCause?: (name: string) => void;
  onLogOut?: () => void;
  /** override the starting tab (tests) */
  initialTab?: KidTab;
};

/**
 * The kid app shell — hosts the Home / Wishlist / You tabs and the shared
 * bottom tab bar. Presentational: the route feeds it data + handlers.
 */
export function KidApp({
  name,
  age,
  split,
  currency,
  chores,
  onSubmitChore,
  onUndoChore,
  spendableCents,
  wishes,
  onRequestPurchase,
  onAddWish,
  savingsCents,
  givingCents,
  causeName,
  savingsGoal,
  onSetSavingsGoal,
  onSuggestCause,
  onLogOut,
  initialTab = "home",
}: Props) {
  const { scheme } = useChoreyTheme();
  const [tab, setTab] = useState<KidTab>(initialTab);
  const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);
  const selectedChore =
    chores?.find((chore) => chore.id === selectedChoreId) ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      {tab === "home" ? (
        <KidHomeScreen
          name={name}
          split={split}
          currency={currency}
          chores={chores}
          spendCents={spendableCents}
          savingsCents={savingsCents}
          givingCents={givingCents}
          onOpenChore={setSelectedChoreId}
        />
      ) : tab === "wish" ? (
        <KidWishlistScreen
          currency={currency}
          spendableCents={spendableCents}
          wishes={wishes}
          onRequestPurchase={onRequestPurchase}
          onAddWish={onAddWish}
        />
      ) : (
        <KidYouScreen
          name={name}
          age={age}
          currency={currency}
          savingsCents={savingsCents}
          givingCents={givingCents}
          causeName={causeName}
          savingsGoal={savingsGoal}
          onSetSavingsGoal={onSetSavingsGoal}
          onSuggestCause={onSuggestCause}
          onLogOut={onLogOut}
        />
      )}

      <KidTabBar active={tab} onChange={setTab} />
      <KidChoreModal
        chore={selectedChore}
        currency={currency ?? DEFAULT_CURRENCY}
        onClose={() => setSelectedChoreId(null)}
        onSubmit={async (choreId) => {
          if (!onSubmitChore) {
            throw new Error("This chore cannot be updated right now.");
          }
          await onSubmitChore(choreId);
        }}
        onUndo={async (choreId) => {
          if (!onUndoChore) {
            throw new Error("This chore cannot be updated right now.");
          }
          await onUndoChore(choreId);
        }}
      />
    </View>
  );
}
