import { useLocalSearchParams } from "expo-router";

import { KidApp } from "@/features/kid-home/kid-app";
import { KidJourneyScreen } from "@/features/kid-home/kid-journey-screen";
import { ParentApp } from "@/features/parent-app/parent-app";
import type { ParentKid } from "@/features/parent-app/parent-primitives";
import type { ChoreBoardItem } from "@/features/parent-app/parent-chores-screen";

/**
 * DEV-ONLY screenshot stage for App Store captures. Renders the pure screens
 * with hand-picked demo data — no login, no Supabase, no real family.
 *
 *   chorey://dev/screenshots?screen=kid-home | split | approvals | levels | hero
 *
 * Never ships: returns null outside __DEV__, and the route is only reachable
 * by typing the URL. Delete freely once store screenshots are done.
 */

const mia: ParentKid = {
  id: "k1",
  name: "Mia",
  age: 9,
  tone: "allowance",
  earnedCents: 1850,
  allowanceCents: 740,
  savingsCents: 740,
  givingCents: 370,
  choresDone: 4,
  choresTotal: 6,
  pendingApprovals: 2,
  level: 7,
  cadence: "weekly",
  budgetCents: 2500,
  assignedCents: 2700, // over the allowance → shows the "+$2.00 bonus" state
};

const eli: ParentKid = {
  id: "k2",
  name: "Eli",
  age: 7,
  tone: "savings",
  earnedCents: 900,
  allowanceCents: 360,
  savingsCents: 360,
  givingCents: 180,
  choresDone: 3,
  choresTotal: 5,
  pendingApprovals: 0,
  level: 4,
  cadence: "weekly",
  budgetCents: 1500,
  assignedCents: 1350,
};

const kidChores = [
  { id: "c1", name: "Make the bed", valueCents: 90, state: "todo" as const },
  { id: "c2", name: "Feed the dog", valueCents: 90, state: "todo" as const },
  { id: "c3", name: "Water the plants", valueCents: 90, state: "waiting" as const },
  { id: "c4", name: "Empty the dishwasher", valueCents: 90, state: "approved" as const },
  { id: "c5", name: "Wash the car", valueCents: 300, state: "todo" as const },
];

const board: ChoreBoardItem[] = [
  { id: "b1", title: "Water the plants", childName: "Mia", rewardCents: 90, tone: "allowance", status: "submitted" },
  { id: "b2", title: "Tidy the playroom", childName: "Eli", rewardCents: 75, tone: "savings", status: "submitted" },
  { id: "b3", title: "Make the bed", childName: "Mia", rewardCents: 90, tone: "allowance", status: "assigned", recurrence: "daily" },
  { id: "b4", title: "Feed the dog", childName: "Eli", rewardCents: 75, tone: "savings", status: "assigned", recurrence: "daily" },
  { id: "b5", title: "Empty the dishwasher", childName: "Mia", rewardCents: 90, tone: "allowance", status: "approved" },
];

const kidAppProps = {
  name: "Mia",
  age: 9,
  currency: "USD" as const,
  chores: kidChores,
  spendableCents: 1140,
  savingsCents: 1140,
  givingCents: 570,
  totalPoints: 730,
  causeName: "Animal shelter",
  wishes: [
    { id: "w1", name: "Skateboard", targetCents: 6500, status: "active" as const },
    { id: "w2", name: "LEGO set", targetCents: 2400, status: "active" as const },
  ],
};

export default function DevScreenshotsRoute() {
  const { screen } = useLocalSearchParams<{ screen?: string }>();

  if (!__DEV__) {
    return null;
  }

  switch (screen) {
    case "split":
      // key forces a remount so initialTab applies when hopping between stages
      return <KidApp key="split" {...kidAppProps} initialTab="you" />;
    case "approvals":
      return (
        <ParentApp
          key="approvals"
          subtitle="Saturday · This week"
          initialTab="chores"
          kids={[mia, eli]}
          choreBoard={board}
          assignees={[
            { id: "k1", name: "Mia", budgetCents: 2500 },
            { id: "k2", name: "Eli", budgetCents: 1500 },
          ]}
        />
      );
    case "levels":
      return <KidJourneyScreen visible level={7} fromLevel={7} />;
    case "settings":
      return (
        <ParentApp
          key="settings"
          initialTab="settings"
          kids={[mia, eli]}
          onChangeBudget={() => {}}
          onChangeCadence={() => {}}
        />
      );
    case "hero":
      return (
        <ParentApp key="hero" subtitle="Saturday · This week" kids={[mia, eli]} />
      );
    case "kid-home":
    default:
      return <KidApp key="home" {...kidAppProps} />;
  }
}
