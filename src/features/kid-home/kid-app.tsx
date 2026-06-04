import { useState } from "react";
import { View } from "react-native";

import { KidHomeScreen, type KidChore } from "@/features/kid-home/kid-home-screen";
import { KidWishlistScreen, type KidWish } from "@/features/kid-home/kid-wishlist-screen";
import { KidYouScreen } from "@/features/kid-home/kid-you-screen";
import { KidTabBar, type KidTab } from "@/features/kid-home/kid-tab-bar";
import { useChoreyTheme } from "@/theme/use-chorey-theme";
import type { CurrencyCode } from "@/features/money/currency";
import type { Split } from "@/features/money/split";

type Props = {
  // Home
  name?: string;
  age?: number | null;
  streakDays?: number;
  split?: Split;
  currency?: CurrencyCode;
  chores?: KidChore[];
  onToggleChore?: (id: string) => void;
  // Wishlist
  spendableCents?: number;
  wishes?: KidWish[];
  onRequestPurchase?: (wishId: string) => void;
  onAddWish?: () => void;
  // You
  savingsCents?: number;
  givingCents?: number;
  causeName?: string | null;
  givenCents?: number;
  onMarkGiven?: () => void;
  onPickCause?: () => void;
  onSeeEarnings?: () => void;
  onTellParent?: () => void;
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
  streakDays,
  split,
  currency,
  chores,
  onToggleChore,
  spendableCents,
  wishes,
  onRequestPurchase,
  onAddWish,
  savingsCents,
  givingCents,
  causeName,
  givenCents,
  onMarkGiven,
  onPickCause,
  onSeeEarnings,
  onTellParent,
  initialTab = "home",
}: Props) {
  const { scheme } = useChoreyTheme();
  const [tab, setTab] = useState<KidTab>(initialTab);

  return (
    <View style={{ flex: 1, backgroundColor: scheme.bgPage }}>
      {tab === "home" ? (
        <KidHomeScreen
          name={name}
          streakDays={streakDays}
          split={split}
          currency={currency}
          chores={chores}
          onToggleChore={onToggleChore}
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
          givenCents={givenCents}
          onMarkGiven={onMarkGiven}
          onPickCause={onPickCause}
          onSeeEarnings={onSeeEarnings}
          onTellParent={onTellParent}
        />
      )}

      <KidTabBar active={tab} onChange={setTab} />
    </View>
  );
}
