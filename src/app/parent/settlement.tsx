import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";

import type { BucketBalances } from "@/features/chores/money";
import { getBucketBalancesForHousehold } from "@/features/ledger/default-ledger-actions";
import {
  getActiveSettlementPeriod,
  settleAllSettlementBuckets,
} from "@/features/settlement/default-settlement-actions";
import type { SettlementPeriod } from "@/features/settlement/settlement-actions";
import { SettlementReviewScreen } from "@/features/settlement/settlement-review-screen";
import { choreyTheme } from "@/theme/chorey-theme";

const emptyBalances: BucketBalances = {
  givingCents: 0,
  savingsCents: 0,
  spendCents: 0,
};

export default function ParentSettlementRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    householdId?: string;
  }>();
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;
  const [bucketBalances, setBucketBalances] =
    useState<BucketBalances>(emptyBalances);
  const [settlementPeriod, setSettlementPeriod] =
    useState<SettlementPeriod | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      if (!householdId) {
        return;
      }

      Promise.all([
        getBucketBalancesForHousehold(householdId),
        getActiveSettlementPeriod(householdId),
      ]).then(([nextBalances, nextSettlementPeriod]) => {
        if (mounted) {
          setBucketBalances(nextBalances);
          setSettlementPeriod(nextSettlementPeriod);
        }
      });

      return () => {
        mounted = false;
      };
    }, [householdId]),
  );

  if (!householdId || !settlementPeriod) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: choreyTheme.spacing.xl,
          backgroundColor: choreyTheme.colors.cream2,
        }}
      >
        <Text
          style={{
            color: choreyTheme.colors.inkMuted,
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          Settlement is loading.
        </Text>
      </View>
    );
  }

  return (
    <SettlementReviewScreen
      bucketBalances={bucketBalances}
      onBack={() => router.back()}
      onMarkAllSettled={async (periodId) => {
        await settleAllSettlementBuckets({ householdId, periodId });
        const nextSettlementPeriod = await getActiveSettlementPeriod(householdId);
        setSettlementPeriod(nextSettlementPeriod);
      }}
      settlementPeriod={settlementPeriod}
    />
  );
}
