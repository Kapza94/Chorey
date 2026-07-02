import { useState } from "react";
import { View } from "react-native";

import { KidHomeScreen, type KidChore } from "@/features/kid-home/kid-home-screen";
import { KidChoreModal } from "@/features/kid-home/kid-chore-modal";
import { LevelUpBurst } from "@/components/level-up-burst";
import { KidJourneyScreen } from "@/features/kid-home/kid-journey-screen";
import { levelForPoints } from "@/features/game/leveling";
import { KidWishlistScreen, type KidWish } from "@/features/kid-home/kid-wishlist-screen";
import type { WishNote } from "@/features/spend-wishlist/spend-wishlist-actions";
import { KidYouScreen } from "@/features/kid-home/kid-you-screen";
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
  onSubmitChore?: (id: string, photoBase64?: string | null) => Promise<void>;
  onUndoChore?: (id: string) => Promise<void>;
  /** when set, the kid can attach a photo of a finished chore */
  pickPhoto?: () => Promise<{ uri: string; base64: string } | null>;
  // Wishlist
  spendableCents?: number;
  wishes?: KidWish[];
  onRequestPurchase?: (wishId: string) => void;
  onAddWish?: (input: { name: string; targetCents: number }) => void;
  /** wishlist notes thread */
  wishNotes?: WishNote[];
  wishNotesLoading?: boolean;
  onOpenWishNotes?: (wishId: string) => void;
  onAddWishNote?: (wishId: string, body: string) => Promise<void> | void;
  /** lifetime game points (drives the level sticker + XP bar) */
  totalPoints?: number;
  /** when set, the full-screen level-up celebration shows for this level */
  celebrationLevel?: number | null;
  onCelebrationDone?: () => void;
  /** where the journey car last parked; below the current level it drives */
  journeyFromLevel?: number;
  /** the journey car arrived at the current level — persist the parking spot */
  onJourneyArrived?: () => void;
  // You
  savingsCents?: number;
  givingCents?: number;
  causeName?: string | null;
  onSuggestCause?: (name: string) => void;
  onLogOut?: () => void;
  /** pull-to-refresh on the Home tab — re-fetch so new chores appear. */
  onRefresh?: () => void;
  refreshing?: boolean;
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
  pickPhoto,
  spendableCents,
  wishes,
  onRequestPurchase,
  onAddWish,
  wishNotes,
  wishNotesLoading,
  onOpenWishNotes,
  onAddWishNote,
  totalPoints,
  celebrationLevel,
  onCelebrationDone,
  journeyFromLevel,
  onJourneyArrived,
  savingsCents,
  givingCents,
  causeName,
  onSuggestCause,
  onLogOut,
  onRefresh,
  refreshing,
  initialTab = "home",
}: Props) {
  const { scheme } = useChoreyTheme();
  const [tab, setTab] = useState<KidTab>(initialTab);
  const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);
  const [journeyOpen, setJourneyOpen] = useState(false);
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
          totalPoints={totalPoints}
          onOpenChore={setSelectedChoreId}
          onUndoChore={onUndoChore}
          onOpenJourney={() => setJourneyOpen(true)}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      ) : tab === "wish" ? (
        <KidWishlistScreen
          currency={currency}
          spendableCents={spendableCents}
          wishes={wishes}
          onRequestPurchase={onRequestPurchase}
          onAddWish={onAddWish}
          notes={wishNotes}
          notesLoading={wishNotesLoading}
          onOpenNotes={onOpenWishNotes}
          onAddNote={onAddWishNote}
        />
      ) : (
        <KidYouScreen
          name={name}
          age={age}
          currency={currency}
          savingsCents={savingsCents}
          givingCents={givingCents}
          totalPoints={totalPoints}
          causeName={causeName}
          wishes={wishes}
          onSuggestCause={onSuggestCause}
          onLogOut={onLogOut}
        />
      )}

      <KidTabBar active={tab} onChange={setTab} />
      {celebrationLevel ? (
        <LevelUpBurst level={celebrationLevel} onDone={onCelebrationDone} />
      ) : null}
      <KidJourneyScreen
        visible={journeyOpen}
        level={levelForPoints(totalPoints ?? 0)}
        fromLevel={journeyFromLevel}
        onArrived={onJourneyArrived}
        onClose={() => setJourneyOpen(false)}
      />
      <KidChoreModal
        chore={selectedChore}
        currency={currency ?? DEFAULT_CURRENCY}
        onClose={() => setSelectedChoreId(null)}
        pickPhoto={pickPhoto}
        onSubmit={async (choreId, photoBase64) => {
          if (!onSubmitChore) {
            throw new Error("This chore cannot be updated right now.");
          }
          setSelectedChoreId(null);
          await onSubmitChore(choreId, photoBase64);
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
