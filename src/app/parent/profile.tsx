import { useCallback, useState } from "react";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { ParentProfileScreen } from "@/features/parent-app/parent-profile-screen";
import {
  getHouseholdSettings,
  updateHouseholdCurrency,
  updateHouseholdName,
} from "@/features/household/default-household-actions";
import {
  getParentIdentity,
  updateParentDisplayName,
  updateParentLabel,
} from "@/features/auth/parent-identity-actions";
import { pickAndUploadParentAvatar } from "@/features/account/default-avatar-actions";
import type { CurrencyCode } from "@/features/money/currency";

/** Route: the parent's editable account + family details. Prefills from the
 *  household row and auth identity, persists each field as it changes. */
export default function ParentProfileRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ householdId?: string }>();
  const householdId = Array.isArray(params.householdId)
    ? params.householdId[0]
    : params.householdId;

  const [name, setName] = useState("");
  const [parentLabel, setParentLabel] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("");
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("email");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // The screen seeds its text drafts from these props on mount, so hold it back
  // until the first load lands — otherwise the fields capture empty values.
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const identity = await getParentIdentity();
    if (identity) {
      setName(identity.name);
      setEmail(identity.email);
      setProvider(identity.provider);
      setAvatarUrl(identity.avatarUrl);
    }
    if (householdId) {
      const settings = await getHouseholdSettings(householdId);
      setFamilyName(settings.name);
      setCurrency(settings.currency);
      // "Parent" is the read fallback for an unset label; show it blank so the
      // field/pills start empty rather than pre-filling a placeholder word.
      setParentLabel(settings.parentLabel === "Parent" ? "" : settings.parentLabel);
    }
    setLoaded(true);
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!loaded) {
    return null;
  }

  return (
    <ParentProfileScreen
      name={name}
      parentLabel={parentLabel}
      familyName={familyName}
      currency={currency}
      email={email}
      provider={provider}
      avatarUrl={avatarUrl}
      onChangeName={(next) => {
        setName(next);
        void updateParentDisplayName(next);
      }}
      onChangeParentLabel={(next) => {
        setParentLabel(next);
        void updateParentLabel(next);
      }}
      onChangeFamilyName={(next) => {
        setFamilyName(next);
        if (householdId) {
          void updateHouseholdName(householdId, next);
        }
      }}
      onChangeCurrency={(next) => {
        setCurrency(next);
        if (householdId) {
          void updateHouseholdCurrency(householdId, next);
        }
      }}
      onChangePhoto={async () => {
        const url = await pickAndUploadParentAvatar();
        if (url) {
          setAvatarUrl(url);
        }
      }}
      onBack={() => router.back()}
    />
  );
}
