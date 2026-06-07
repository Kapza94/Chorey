import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import {
  Apple,
  Check,
  ChevronRight,
  Gift,
  Globe,
  HandHeart,
  Heart,
  Lock,
  PawPrint,
  Plus,
  Sparkles,
  User,
  X,
} from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
  CURRENCIES,
  currencyForCountry,
  formatMoney,
  type CurrencyCode,
} from "@/features/money/currency";
import { balanceSplit, type Split } from "@/features/money/split";
import {
  OBField,
  OBPrimary,
  OBSecondary,
  OBShell,
  OBStepButton,
  OBTitle,
} from "@/features/onboarding/onboarding-kit";

/* ---------- reference data ---------- */

type Country = { code: string; name: string; cur: string; symbol: string };

export const COUNTRIES: Country[] = [
  { code: "RS", name: "Serbia", cur: "RSD", symbol: "дин" },
  { code: "US", name: "United States", cur: "USD", symbol: "$" },
  { code: "GB", name: "United Kingdom", cur: "GBP", symbol: "£" },
  { code: "DE", name: "Germany", cur: "EUR", symbol: "€" },
  { code: "HR", name: "Croatia", cur: "EUR", symbol: "€" },
  { code: "BA", name: "Bosnia & Herz.", cur: "BAM", symbol: "KM" },
  { code: "AU", name: "Australia", cur: "AUD", symbol: "A$" },
  { code: "CA", name: "Canada", cur: "CAD", symbol: "C$" },
];

export type KidTone = "allowance" | "savings" | "giving" | "sky";

const KID_TONES: { tone: KidTone; label: string }[] = [
  { tone: "allowance", label: "Peach" },
  { tone: "savings", label: "Lilac" },
  { tone: "giving", label: "Sage" },
  { tone: "sky", label: "Sky" },
];

// A couple of ready-made suggestions to tap; parents add their own below.
// A small library of preset chores. The first three show by default; the rest
// are surfaced one at a time via "Suggest a chore".
const CHORE_LIBRARY = [
  { name: "Make the bed", valueCents: 100 },
  { name: "Dishes", valueCents: 250 },
  { name: "Walk the dog", valueCents: 300 },
  { name: "Take out the trash", valueCents: 150 },
  { name: "Tidy your room", valueCents: 200 },
  { name: "Set the table", valueCents: 100 },
  { name: "Vacuum the floor", valueCents: 250 },
  { name: "Water the plants", valueCents: 100 },
  { name: "Feed the pet", valueCents: 100 },
  { name: "Fold the laundry", valueCents: 200 },
  { name: "Wipe the counters", valueCents: 150 },
  { name: "Help with groceries", valueCents: 300 },
];

const CHORE_DEFAULT_COUNT = 3;
const CHORE_MAX_SUGGESTIONS = 5;

// Broad causes a kid can care about — ideas the family gives toward in real
// life, NOT real charities wired to any payment. Parents hand over the giving
// pile themselves; Chorey just remembers where the kid wanted it to go.
const CAUSE_PICKS = [
  { name: "Animals", desc: "Shelters & rescue pets", Icon: PawPrint },
  { name: "Hunger", desc: "Food for families nearby", Icon: Apple },
  { name: "The planet", desc: "Oceans, parks & wildlife", Icon: Globe },
  { name: "Helping kids", desc: "Health & a fair start", Icon: HandHeart },
];

/** Resolve a kid tone to concrete colors (sky maps onto the info palette). */
function useToneStyle(tone: KidTone) {
  const { scheme, palette } = useChoreyTheme();
  if (tone === "sky") {
    return {
      swatch: palette.semantic.info[600],
      avatarBg: scheme.tint.info,
      text: palette.semantic.info[600],
    };
  }
  const ramp = bucketTokens[tone === "allowance" ? "spend" : tone].ramp;
  return { swatch: ramp[400], avatarBg: ramp[200], text: ramp[800] };
}

/* ---------- data + result ---------- */

type Kid = { name: string; age: string; tone: KidTone };

type OnboardingData = {
  parentName: string;
  familyName: string;
  country: string;
  kids: Kid[];
  split: { spend: number; give: number };
  cadence: "weekly" | "monthly";
  budgetDollars: number;
  chores: { name: string; valueCents: number }[];
  causes: string[];
  kidName: string;
  kidTone: KidTone;
};

export type OnboardingResult =
  | {
      role: "parent";
      parentName: string;
      familyName: string;
      country: string;
      currency: CurrencyCode;
      kids: Kid[];
      split: Split;
      cadence: "weekly" | "monthly";
      budgetCents: number;
      chores: { name: string; valueCents: number }[];
      causes: string[];
      joinCode: string;
    }
  | { role: "kid"; code: string; kidName: string; kidTone: KidTone };

type Step =
  | "welcome"
  | "idea"
  | "role"
  | "p_family"
  | "p_addkid"
  | "p_split"
  | "p_chores"
  | "p_causes"
  | "p_premium"
  | "p_account"
  | "p_done"
  | "k_code"
  | "k_avatar"
  | "k_how";

const INITIAL: OnboardingData = {
  parentName: "",
  familyName: "",
  country: "",
  kids: [],
  split: { spend: 40, give: 20 },
  cadence: "weekly",
  budgetDollars: 25,
  chores: [],
  causes: [],
  kidName: "",
  kidTone: "allowance",
};

function joinCodeFor(familyName: string) {
  return "CH" + (familyName.replace(/[^A-Za-z]/g, "").toUpperCase() + "KID").slice(0, 4);
}

/* ---------- flow controller ---------- */

/** In-app account actions the final onboarding step needs (email 6-digit OTP). */
export type OnboardingAuth = {
  sendEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
};

/** What persisting the parent setup hands back — the real generated codes. */
export type OnboardingPersistResult = {
  householdId: string;
  kids: { childProfileId: string; name: string; accessCode: string }[];
};

type ParentResult = Extract<OnboardingResult, { role: "parent" }>;

export function OnboardingFlow({
  onComplete,
  initialStep = "welcome",
  auth,
  persist,
}: {
  onComplete?: (
    result: OnboardingResult,
    persisted?: OnboardingPersistResult | null,
  ) => void;
  initialStep?: Step;
  /** Account creation actions; when omitted the account step just advances. */
  auth?: OnboardingAuth;
  /** Persist the finished parent setup (runs after the account is verified). */
  persist?: (result: ParentResult) => Promise<OnboardingPersistResult | void>;
}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [data, setData] = useState<OnboardingData>(INITIAL);
  const [code, setCode] = useState("");
  const [persisted, setPersisted] = useState<OnboardingPersistResult | null>(null);
  const patch = (next: Partial<OnboardingData>) => setData((d) => ({ ...d, ...next }));

  const buildParentResult = (): ParentResult => ({
    role: "parent",
    parentName: data.parentName.trim(),
    familyName: data.familyName.trim(),
    country: data.country,
    currency: currencyForCountry(data.country),
    kids: data.kids,
    split: balanceSplit(data.split.spend, data.split.give),
    cadence: data.cadence,
    budgetCents: data.budgetDollars * 100,
    chores: data.chores,
    causes: data.causes,
    joinCode: joinCodeFor(data.familyName),
  });

  const finishParent = () => onComplete?.(buildParentResult(), persisted);

  const persistParent = async () => {
    const result = await persist?.(buildParentResult());
    if (result) {
      setPersisted(result);
    }
    return result;
  };

  const finishKid = () =>
    onComplete?.({ role: "kid", code, kidName: data.kidName.trim(), kidTone: data.kidTone });

  switch (step) {
    case "welcome":
      return <OBWelcome onNext={() => setStep("idea")} />;
    case "idea":
      return <OBIdea onNext={() => setStep("role")} onBack={() => setStep("welcome")} />;
    case "role":
      return (
        <OBRole
          onBack={() => setStep("idea")}
          onParent={() => setStep("p_family")}
          onKid={() => setStep("k_code")}
        />
      );
    case "p_family":
      return (
        <OBFamily
          data={data}
          patch={patch}
          onNext={() => setStep("p_addkid")}
          onBack={() => setStep("role")}
        />
      );
    case "p_addkid":
      return (
        <OBAddKid
          data={data}
          patch={patch}
          onNext={() => setStep("p_split")}
          onBack={() => setStep("p_family")}
        />
      );
    case "p_split":
      return (
        <OBBudgetSplit
          data={data}
          patch={patch}
          onNext={() => setStep("p_chores")}
          onBack={() => setStep("p_addkid")}
        />
      );
    case "p_chores":
      return (
        <OBChores
          data={data}
          patch={patch}
          onNext={() => setStep("p_causes")}
          onBack={() => setStep("p_split")}
        />
      );
    case "p_causes":
      return (
        <OBCauses
          data={data}
          patch={patch}
          // Free households get one kid. With more than one, gate on Premium
          // before the account step so persistence never half-fails.
          onNext={() => setStep(data.kids.length > 1 ? "p_premium" : "p_account")}
          onBack={() => setStep("p_chores")}
        />
      );
    case "p_premium":
      return (
        <OBPremiumGate
          data={data}
          patch={patch}
          onContinue={() => setStep("p_account")}
          onBack={() => setStep("p_causes")}
        />
      );
    case "p_account":
      return (
        <OBParentAccount
          auth={auth}
          onPersist={persistParent}
          onNext={() => setStep("p_done")}
          onBack={() => setStep("p_causes")}
        />
      );
    case "p_done":
      return <OBParentDone data={data} persisted={persisted} onFinish={finishParent} />;
    case "k_code":
      return (
        <OBKidCode
          code={code}
          setCode={setCode}
          onNext={() => setStep("k_avatar")}
          onBack={() => setStep("role")}
        />
      );
    case "k_avatar":
      return (
        <OBKidAvatar
          data={data}
          patch={patch}
          onNext={() => setStep("k_how")}
          onBack={() => setStep("k_code")}
        />
      );
    case "k_how":
      return <OBKidHow data={data} onFinish={finishKid} onBack={() => setStep("k_avatar")} />;
    default:
      return null;
  }
}

/* ---------- 1. Welcome ---------- */

function OBWelcome({ onNext }: { onNext: () => void }) {
  const { scheme, typography, palette } = useChoreyTheme();
  return (
    <OBShell
      footer={
        <>
          <OBPrimary onPress={onNext}>Get started</OBPrimary>
          <OBSecondary onPress={onNext}>I already have an account</OBSecondary>
        </>
      }
    >
      <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 22 }}>
          <Dot color={bucketTokens.spend.ramp[400]} />
          <Dot color={bucketTokens.savings.ramp[400]} />
          <Dot color={bucketTokens.giving.ramp[400]} />
        </View>
        <Text
          style={{
            fontFamily: typography.family.display.extra,
            fontSize: 52,
            letterSpacing: -2,
            color: scheme.fg,
          }}
        >
          chorey
        </Text>
        <Text
          style={[
            typography.text.body,
            { fontSize: 17, color: scheme.fgMuted, textAlign: "center", marginTop: 14, maxWidth: 280 },
          ]}
        >
          Chores that teach kids to{" "}
          <Text style={{ color: bucketTokens.spend.ramp[600], fontWeight: "700" }}>spend</Text>,{" "}
          <Text style={{ color: bucketTokens.savings.ramp[600], fontWeight: "700" }}>save</Text>, and{" "}
          <Text style={{ color: bucketTokens.giving.ramp[600], fontWeight: "700" }}>give</Text>.
        </Text>
      </View>
    </OBShell>
  );
}

function Dot({ color }: { color: string }) {
  return <View style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: color }} />;
}

/* ---------- 2. The big idea ---------- */

function OBIdea({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { scheme, typography, bucketInk } = useChoreyTheme();
  const bars = [
    { tone: "spend" as const, pct: 40, label: "Spend", cents: 400 },
    { tone: "savings" as const, pct: 40, label: "Save", cents: 400 },
    { tone: "giving" as const, pct: 20, label: "Give", cents: 200 },
  ];
  return (
    <OBShell
      onBack={onBack}
      progress={{ index: 0, total: 4 }}
      footer={<OBPrimary onPress={onNext}>I&apos;m in</OBPrimary>}
    >
      <OBTitle
        title="Every dollar splits three ways."
        subtitle="When a kid earns $10, here's where it goes — automatically, every time."
      />
      {bars.map((bar) => {
        const ramp = bucketTokens[bar.tone].ramp;
        return (
          <View key={bar.label} style={{ marginBottom: 18 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontFamily: typography.family.display.bold, fontSize: 22, color: bucketInk(bar.tone) }}>
                  {bar.pct}%
                </Text>
                <Text style={[typography.text.label, { fontSize: 15, color: scheme.fg }]}>
                  {bar.label}
                </Text>
              </View>
              <Text style={[typography.text.money, { color: ramp[600] }]}>
                {formatMoney(bar.cents, "USD")}
              </Text>
            </View>
            <View style={{ height: 12, backgroundColor: scheme.bgSunken, borderRadius: 999, overflow: "hidden" }}>
              <View style={{ width: `${bar.pct}%`, height: "100%", backgroundColor: ramp[400], borderRadius: 999 }} />
            </View>
          </View>
        );
      })}
      <View
        style={{
          marginTop: 12,
          padding: 16,
          borderRadius: 14,
          backgroundColor: scheme.bgRaised,
          borderColor: scheme.border,
          borderWidth: 1,
          flexDirection: "row",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <Lock size={18} color={bucketTokens.savings.ramp[600]} strokeWidth={2.2} />
        <Text style={[typography.text.caption, { flex: 1, color: scheme.fgMuted, fontSize: 13 }]}>
          Savings stays locked — no spend button. That&apos;s how the habit sticks.
        </Text>
      </View>
    </OBShell>
  );
}

/* ---------- 3. Choose role ---------- */

function OBRole({
  onParent,
  onKid,
  onBack,
}: {
  onParent: () => void;
  onKid: () => void;
  onBack: () => void;
}) {
  return (
    <OBShell onBack={onBack} progress={{ index: 1, total: 4 }}>
      <OBTitle
        title="Who's setting up?"
        subtitle="Parents set up the family first, then kids join with a code."
      />
      <RoleCard
        tone="allowance"
        Icon={User}
        title="I'm a parent"
        body="Set chores, the split, and approve payouts."
        onPress={onParent}
      />
      <RoleCard
        tone="savings"
        Icon={Sparkles}
        title="Join as a kid"
        body="Got a code from a parent? Hop in here."
        onPress={onKid}
      />
    </OBShell>
  );
}

function RoleCard({
  tone,
  Icon,
  title,
  body,
  onPress,
}: {
  tone: "allowance" | "savings";
  Icon: typeof User;
  title: string;
  body: string;
  onPress: () => void;
}) {
  const { scheme, typography } = useChoreyTheme();
  const ramp = bucketTokens[tone === "allowance" ? "spend" : "savings"].ramp;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        backgroundColor: scheme.bgRaised,
        borderColor: scheme.border,
        borderWidth: 1.5,
        borderRadius: 18,
        padding: 18,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: ramp[200],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={26} color={ramp[800]} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 17 }]}>{title}</Text>
        <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 2 }]}>{body}</Text>
      </View>
      <ChevronRight size={18} color={scheme.fgFaint} strokeWidth={2} />
    </Pressable>
  );
}

/* ---------- 4. Family + country ---------- */

function OBFamily({
  data,
  patch,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  patch: (p: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const country = COUNTRIES.find((c) => c.code === data.country);
  const ready = data.parentName.trim() && data.familyName.trim() && !!data.country;

  return (
    <OBShell
      onBack={onBack}
      progress={{ index: 2, total: 4 }}
      footer={
        <OBPrimary onPress={onNext} disabled={!ready}>
          Continue
        </OBPrimary>
      }
    >
      <OBTitle title="Set up your family." subtitle="Just the basics — you can change anything later." />
      <View style={{ gap: 18 }}>
        <OBField
          label="Your name"
          value={data.parentName}
          onChange={(v) => patch({ parentName: v })}
          placeholder="e.g. Alex"
        />
        <OBField
          label="Family name"
          value={data.familyName}
          onChange={(v) => patch({ familyName: v })}
          placeholder="e.g. The Rivera Family"
        />

        <View>
          <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 7 }]}>
            Country
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose your country"
            onPress={() => setPickerOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: scheme.bgRaised,
              borderColor: palette.border.mid,
              borderWidth: 1.5,
              borderRadius: radius.sm,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text
              style={[
                typography.text.body,
                { color: country ? scheme.fg : scheme.fgDisabled },
              ]}
            >
              {country ? country.name : "Choose your country"}
            </Text>
            <ChevronRight size={16} color={scheme.fgFaint} strokeWidth={2} />
          </Pressable>
          <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 8 }]}>
            {country ? (
              <>
                Amounts will show in{" "}
                <Text style={{ color: scheme.fgMuted, fontWeight: "700" }}>
                  {country.cur} ({country.symbol})
                </Text>{" "}
                — your local currency.
              </>
            ) : (
              "We'll show all amounts in your local currency."
            )}
          </Text>
        </View>
      </View>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable
          accessibilityLabel="Dismiss"
          onPress={() => setPickerOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(42, 32, 24, 0.32)" }}
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: scheme.bgModal,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 22,
            paddingTop: 20,
            paddingBottom: 30,
            ...scheme.shadow.lg,
          }}
        >
          <Text style={[typography.text.h2, { color: scheme.fg, marginBottom: 12 }]}>
            Choose your country
          </Text>
          {COUNTRIES.map((c) => (
            <Pressable
              key={c.code}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              onPress={() => {
                patch({ country: c.code });
                setPickerOpen(false);
              }}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 13,
                borderBottomWidth: 1,
                borderBottomColor: scheme.border,
              }}
            >
              <Text style={[typography.text.body, { color: scheme.fg }]}>{c.name}</Text>
              <Text style={[typography.text.body, { color: scheme.fgFaint }]}>
                {c.cur} ({c.symbol})
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </OBShell>
  );
}

/* ---------- 5. Add kids ---------- */

function OBAddKid({
  data,
  patch,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  patch: (p: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { scheme, typography } = useChoreyTheme();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [tone, setTone] = useState<KidTone>("allowance");

  const hasDraft = !!name.trim();
  const canContinue = hasDraft || data.kids.length > 0;

  // Commit the in-progress kid into the list. Returns the updated count.
  const commitDraft = (): boolean => {
    if (!name.trim()) return false;
    patch({ kids: [...data.kids, { name: name.trim(), age, tone }] });
    return true;
  };

  const handleAddAnother = () => {
    if (!commitDraft()) return;
    setName("");
    setAge("");
    const idx = KID_TONES.findIndex((t) => t.tone === tone);
    setTone(KID_TONES[(idx + 1) % KID_TONES.length].tone);
  };

  const handleContinue = () => {
    commitDraft(); // keep the filled-in kid; no-op if the form is empty
    onNext();
  };

  return (
    <OBShell
      onBack={onBack}
      progress={{ index: 3, total: 4 }}
      footer={
        <>
          <OBPrimary onPress={handleContinue} disabled={!canContinue}>
            Continue
          </OBPrimary>
          {hasDraft ? (
            <OBSecondary onPress={handleAddAnother}>+ Add another kid</OBSecondary>
          ) : null}
        </>
      }
    >
      <OBTitle
        title={data.kids.length ? "Add another kid." : "Add your kid."}
        subtitle={
          data.kids.length
            ? "Fill in their details, then Continue — or add one more."
            : "Fill in their details, then Continue. You can add another after."
        }
      />

      {data.kids.length > 0 ? (
        <View style={{ gap: 8, marginBottom: 16 }}>
          {data.kids.map((kid, index) => (
            <KidRow key={`${kid.name}-${index}`} kid={kid} />
          ))}
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: scheme.bgRaised,
          borderColor: scheme.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 2 }}>
            <OBField label="Name" value={name} onChange={setName} placeholder="Kid's name" />
          </View>
          <View style={{ flex: 1 }}>
            <OBField
              label="Age"
              value={age}
              onChange={(v) => setAge(v.replace(/\D/g, "").slice(0, 2))}
              placeholder="9"
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 8 }]}>Color</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {KID_TONES.map((t) => (
            <ColorSwatch
              key={t.tone}
              tone={t.tone}
              label={t.label}
              selected={tone === t.tone}
              onPress={() => setTone(t.tone)}
            />
          ))}
        </View>
      </View>
    </OBShell>
  );
}

function KidRow({ kid, onRemove }: { kid: Kid; onRemove?: () => void }) {
  const { scheme, typography } = useChoreyTheme();
  const toneStyle = useToneStyle(kid.tone);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: scheme.bgRaised,
        borderColor: scheme.border,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          backgroundColor: toneStyle.avatarBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: typography.family.display.bold, fontSize: 18, color: toneStyle.text }}>
          {kid.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>{kid.name}</Text>
        <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
          {kid.age ? `${kid.age} years` : "Age not set"}
        </Text>
      </View>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${kid.name}`}
          onPress={onRemove}
          hitSlop={8}
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: scheme.bgSunken,
          }}
        >
          <X size={15} color={scheme.fgMuted} strokeWidth={2.4} />
        </Pressable>
      ) : (
        <Check size={18} color={bucketTokens.giving.ramp[600]} strokeWidth={2.6} />
      )}
    </View>
  );
}

/* ---------- Premium gate (more than one kid) ---------- */

function OBPremiumGate({
  data,
  patch,
  onContinue,
  onBack,
}: {
  data: OnboardingData;
  patch: (p: Partial<OnboardingData>) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const { scheme, typography, palette } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const [showSoon, setShowSoon] = useState(false);

  const oneKid = data.kids.length === 1;
  const removeKid = (index: number) =>
    patch({ kids: data.kids.filter((_, i) => i !== index) });

  return (
    <OBShell
      onBack={onBack}
      footer={
        <OBPrimary onPress={onContinue} disabled={!oneKid}>
          {oneKid ? "Continue" : "Remove a kid to continue"}
        </OBPrimary>
      }
    >
      <OBTitle
        title="Add the whole family with Premium."
        subtitle="Chorey Free includes one kid. Keep everyone with Premium, or remove a kid to continue free."
      />

      {/* Premium upsell (the hard paywall). */}
      <View
        style={{
          padding: 18,
          borderRadius: 18,
          backgroundColor: scheme.tint.giving,
          borderColor: giving[400],
          borderWidth: 1.5,
          marginBottom: 18,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Sparkles size={18} color={giving[800]} strokeWidth={2.2} />
          <Text style={[typography.text.h3, { color: giving[800], fontSize: 16 }]}>
            Chorey Premium
          </Text>
        </View>
        <Text style={[typography.text.bodySm, { color: scheme.fgMuted, marginBottom: 12 }]}>
          Add multiple kids, recurring chores, reminders, and more.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Unlock Premium"
          onPress={() => setShowSoon(true)}
          style={({ pressed }) => ({
            alignItems: "center",
            paddingVertical: 13,
            borderRadius: 999,
            backgroundColor: pressed ? giving[400] : giving[600],
          })}
        >
          <Text style={[typography.text.label, { color: palette.cream[4], fontSize: 15 }]}>
            Unlock Premium
          </Text>
        </Pressable>
        {showSoon ? (
          <Text style={[typography.text.caption, { color: scheme.fgMuted, marginTop: 10, textAlign: "center" }]}>
            In-app purchases are coming soon — for now, keep one kid to continue.
          </Text>
        ) : null}
      </View>

      <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 8 }]}>
        Your kids ({data.kids.length})
      </Text>
      <View style={{ gap: 8 }}>
        {data.kids.map((kid, index) => (
          <KidRow
            key={`${kid.name}-${index}`}
            kid={kid}
            onRemove={() => removeKid(index)}
          />
        ))}
      </View>
    </OBShell>
  );
}

function ColorSwatch({
  tone,
  label,
  selected,
  onPress,
}: {
  tone: KidTone;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { scheme } = useChoreyTheme();
  const toneStyle = useToneStyle(tone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        backgroundColor: toneStyle.swatch,
        borderWidth: 3,
        borderColor: selected ? scheme.fg : "transparent",
      }}
    />
  );
}

/* ---------- 6. Budget & split ---------- */

// Tappable budget amount: type a custom value directly (handy for currencies
// like RSD where stepping ±5 would take forever), with the ± buttons alongside.
function BudgetAmountField({
  symbol,
  value,
  cadence,
  groupSeparator,
  onChange,
}: {
  symbol: string;
  value: number;
  cadence: "weekly" | "monthly";
  groupSeparator: string;
  onChange: (next: number) => void;
}) {
  const { scheme, typography } = useChoreyTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  // Group thousands (e.g. "1.000 дин") once the amount passes three digits, but
  // show the raw digits while editing so the keypad stays simple.
  const grouped = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  const text = editing ? draft : grouped;
  // Drop a font size at five+ visible chars so four digits (plus a separator)
  // never clip; the field also widens with the content.
  const fontSize = text.length > 4 ? 28 : 32;
  const commit = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    onChange(Number.isFinite(parsed) && parsed > 0 ? parsed : value);
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5 }}>
      <Text style={{ fontFamily: typography.family.display.bold, fontSize, color: scheme.fg }}>
        {symbol}
      </Text>
      <TextInput
        accessibilityLabel="Budget amount"
        value={text}
        onFocus={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        style={{
          fontFamily: typography.family.display.bold,
          fontSize,
          color: scheme.fg,
          paddingVertical: 0,
          paddingHorizontal: 0,
          minWidth: 72,
          width: Math.max(72, text.length * fontSize * 0.62),
          borderBottomWidth: 2,
          borderBottomColor: bucketTokens.spend.ramp[400],
        }}
      />
      <Text style={[typography.text.bodySm, { color: scheme.fgFaint }]}>
        / {cadence === "monthly" ? "month" : "week"}
      </Text>
    </View>
  );
}

function OBBudgetSplit({
  data,
  patch,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  patch: (p: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const country = COUNTRIES.find((c) => c.code === data.country);
  const symbol = country?.symbol ?? "$";
  const groupSeparator = CURRENCIES[currencyForCountry(data.country)].groupSeparator;
  const { spend, give } = data.split;
  const save = 100 - spend - give;
  const isDefault = spend === 40 && give === 20;

  const stepSplit = (key: "spend" | "give", dir: 1 | -1) => {
    const next =
      key === "spend"
        ? balanceSplit(spend + dir * 5, give)
        : balanceSplit(spend, give + dir * 5);
    patch({ split: { spend: next.spend, give: next.give } });
  };

  return (
    <OBShell
      onBack={onBack}
      footer={
        <>
          <OBPrimary onPress={onNext}>
            {isDefault ? "Use the 40/40/20 split" : "Use this split"}
          </OBPrimary>
          {!isDefault ? (
            <OBSecondary onPress={() => patch({ split: { spend: 40, give: 20 } })}>
              Reset to 40/40/20
            </OBSecondary>
          ) : null}
        </>
      }
    >
      <OBTitle
        title="Budget & split."
        subtitle="Set how much each kid can earn, and how their money divides."
      />

      {/* budget cap + cadence */}
      <View
        style={{
          backgroundColor: scheme.bgRaised,
          borderColor: scheme.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
          marginBottom: 18,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>Budget cap</Text>
          <View style={{ flexDirection: "row", backgroundColor: scheme.bgSunken, borderRadius: 999, padding: 3 }}>
            {(["weekly", "monthly"] as const).map((c) => {
              const selected = data.cadence === c;
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={c}
                  accessibilityState={{ selected }}
                  onPress={() => patch({ cadence: c })}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: selected ? scheme.bgModal : "transparent",
                    ...(selected ? scheme.shadow.xs : null),
                  }}
                >
                  <Text
                    style={[
                      typography.text.caption,
                      { color: selected ? scheme.fg : scheme.fgFaint, fontWeight: "700", textTransform: "capitalize" },
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <BudgetAmountField
            symbol={symbol}
            value={data.budgetDollars}
            cadence={data.cadence}
            groupSeparator={groupSeparator}
            onChange={(next) => patch({ budgetDollars: next })}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <OBStepButton
              symbol="−"
              label="Decrease budget"
              tone="spend"
              onPress={() => patch({ budgetDollars: Math.max(1, data.budgetDollars - 5) })}
            />
            <OBStepButton
              symbol="+"
              label="Increase budget"
              tone="spend"
              onPress={() => patch({ budgetDollars: data.budgetDollars + 5 })}
            />
          </View>
        </View>
        <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 10 }]}>
          Chores add up toward this. Extra chores beyond the cap still earn — your call.
        </Text>
      </View>

      <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 10 }]}>
        How it divides
      </Text>
      <View style={{ flexDirection: "row", height: 16, borderRadius: 999, overflow: "hidden", gap: 3, marginBottom: 18 }}>
        <View style={{ flex: spend, backgroundColor: bucketTokens.spend.ramp[400] }} />
        <View style={{ flex: save, backgroundColor: bucketTokens.savings.ramp[400] }} />
        <View style={{ flex: give, backgroundColor: bucketTokens.giving.ramp[400] }} />
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <SplitStepper tone="spend" label="Spend" value={spend} onStep={(d) => stepSplit("spend", d)} />
        <SplitStepper tone="savings" label="Save" value={save} />
        <SplitStepper tone="giving" label="Give" value={give} onStep={(d) => stepSplit("give", d)} />
      </View>
    </OBShell>
  );
}

function SplitStepper({
  tone,
  label,
  value,
  onStep,
}: {
  tone: "spend" | "savings" | "giving";
  label: string;
  value: number;
  onStep?: (dir: 1 | -1) => void;
}) {
  const { scheme, typography, bucketInk } = useChoreyTheme();
  const ramp = bucketTokens[tone].ramp;
  const tintKey = tone === "spend" ? "allowance" : tone;
  const ink = bucketInk(tone);
  return (
    <View style={{ flex: 1, backgroundColor: scheme.tint[tintKey], borderRadius: 14, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 }}>
      <Text style={[typography.text.overline, { color: ink, fontSize: 10, textAlign: "center" }]}>
        {label}
      </Text>
      <Text style={{ fontFamily: typography.family.display.bold, fontSize: 28, color: ink, textAlign: "center" }}>
        {value}
        <Text style={{ fontSize: 14 }}>%</Text>
      </Text>
      {onStep ? (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8, justifyContent: "center" }}>
          <OBStepButton symbol="−" label={`Decrease ${label}`} tone={tone} onPress={() => onStep(-1)} />
          <OBStepButton symbol="+" label={`Increase ${label}`} tone={tone} onPress={() => onStep(1)} />
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 4, marginTop: 8, justifyContent: "center", alignItems: "center" }}>
          <Lock size={11} color={ramp[600]} strokeWidth={2.4} />
          <Text style={[typography.text.caption, { color: ramp[600], fontWeight: "700", fontSize: 10 }]}>auto</Text>
        </View>
      )}
    </View>
  );
}

/* ---------- 7. First chores ---------- */

function OBChores({
  data,
  patch,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  patch: (p: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { scheme, typography } = useChoreyTheme();
  const currency = currencyForCountry(data.country);
  const symbol = CURRENCIES[currency].symbol;
  const allowance = bucketTokens.spend.ramp;

  const [customName, setCustomName] = useState("");
  const [customReward, setCustomReward] = useState("");
  // How many extra presets (beyond the default 3) have been suggested so far.
  const [suggestCount, setSuggestCount] = useState(0);

  const visiblePicks = CHORE_LIBRARY.slice(0, CHORE_DEFAULT_COUNT + suggestCount);
  const canSuggest =
    suggestCount < CHORE_MAX_SUGGESTIONS &&
    CHORE_DEFAULT_COUNT + suggestCount < CHORE_LIBRARY.length;

  const toggle = (name: string) => {
    const has = data.chores.find((c) => c.name === name);
    if (has) {
      patch({ chores: data.chores.filter((c) => c.name !== name) });
    } else {
      const pick = CHORE_LIBRARY.find((c) => c.name === name);
      if (pick) patch({ chores: [...data.chores, pick] });
    }
  };

  const removeChore = (name: string) =>
    patch({ chores: data.chores.filter((c) => c.name !== name) });

  const rewardUnits = parseInt(customReward, 10);
  const canAddCustom =
    customName.trim().length > 0 && Number.isFinite(rewardUnits) && rewardUnits > 0;

  const addCustom = () => {
    const name = customName.trim();
    if (!canAddCustom || data.chores.some((c) => c.name === name)) return;
    patch({ chores: [...data.chores, { name, valueCents: rewardUnits * 100 }] });
    setCustomName("");
    setCustomReward("");
  };

  // Chores the parent wrote themselves (not one of the preset picks).
  const customChores = data.chores.filter(
    (c) => !CHORE_LIBRARY.some((p) => p.name === c.name),
  );
  const totalCents = data.chores.reduce((s, c) => s + c.valueCents, 0);

  return (
    <OBShell
      onBack={onBack}
      footer={
        <OBPrimary onPress={onNext} disabled={data.chores.length === 0}>
          {data.chores.length
            ? `Add ${data.chores.length} ${data.chores.length === 1 ? "chore" : "chores"}`
            : "Add at least one"}
        </OBPrimary>
      }
    >
      <OBTitle title="First chores." subtitle="Tap a chore, or get a suggestion." />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
        {visiblePicks.map((c) => {
          const on = !!data.chores.find((x) => x.name === c.name);
          return (
            <Pressable
              key={c.name}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              accessibilityState={{ selected: on }}
              onPress={() => toggle(c.name)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 15,
                paddingVertical: 11,
                borderRadius: 999,
                backgroundColor: on ? allowance[200] : scheme.bgRaised,
                borderWidth: 1.5,
                borderColor: on ? allowance[400] : scheme.border,
              }}
            >
              {on ? (
                <Check size={14} color={allowance[800]} strokeWidth={3} />
              ) : (
                <Plus size={14} color={scheme.fgFaint} strokeWidth={2.4} />
              )}
              <Text style={[typography.text.label, { color: on ? allowance[800] : scheme.fg }]}>
                {c.name}
              </Text>
              <Text style={[typography.text.caption, { color: on ? allowance[800] : scheme.fgFaint }]}>
                {formatMoney(c.valueCents, currency)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {canSuggest ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Suggest a chore"
          onPress={() => setSuggestCount((n) => n + 1)}
          style={({ pressed }) => ({
            marginTop: 14,
            paddingVertical: 13,
            borderRadius: 999,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: allowance[400],
            backgroundColor: pressed ? allowance[200] : "transparent",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          })}
        >
          <Sparkles size={16} color={allowance[800]} strokeWidth={2.2} />
          <Text style={[typography.text.label, { color: allowance[800] }]}>
            Suggest a chore
          </Text>
        </Pressable>
      ) : null}

      {/* Write your own chore + reward — always available. */}
      <View
        style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 16,
          backgroundColor: scheme.bgRaised,
          borderColor: scheme.border,
          borderWidth: 1,
        }}
      >
        <Text style={[typography.text.overline, { color: scheme.fgFaint, marginBottom: 10 }]}>
          Add your own
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TextInput
            accessibilityLabel="Chore name"
            value={customName}
            onChangeText={setCustomName}
            placeholder="e.g. Vacuum the hall"
            placeholderTextColor={scheme.fgFaint}
            returnKeyType="next"
            style={{
              flex: 1,
              fontFamily: typography.family.body.regular,
              fontSize: 15,
              color: scheme.fg,
              backgroundColor: scheme.bgSunken,
              borderColor: scheme.border,
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 11,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: scheme.bgSunken,
              borderColor: scheme.border,
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 10,
            }}
          >
            <Text style={[typography.text.bodySm, { color: scheme.fgFaint }]}>{symbol}</Text>
            <TextInput
              accessibilityLabel="Chore reward"
              value={customReward}
              onChangeText={(t) => setCustomReward(t.replace(/[^0-9]/g, ""))}
              onSubmitEditing={addCustom}
              placeholder="0"
              placeholderTextColor={scheme.fgFaint}
              keyboardType="number-pad"
              returnKeyType="done"
              style={{
                fontFamily: typography.family.body.regular,
                fontSize: 15,
                color: scheme.fg,
                paddingVertical: 11,
                paddingHorizontal: 4,
                minWidth: 44,
                textAlign: "center",
              }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add chore"
            accessibilityState={{ disabled: !canAddCustom }}
            onPress={addCustom}
            disabled={!canAddCustom}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: canAddCustom ? allowance[400] : scheme.bgSunken,
              opacity: canAddCustom ? 1 : 0.6,
            }}
          >
            <Plus size={20} color={canAddCustom ? allowance[800] : scheme.fgFaint} strokeWidth={2.6} />
          </Pressable>
        </View>

        {customChores.length > 0 ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            {customChores.map((c) => (
              <View
                key={c.name}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: allowance[200],
                }}
              >
                <Text style={[typography.text.label, { flex: 1, color: allowance[800] }]}>
                  {c.name}
                </Text>
                <Text style={[typography.text.caption, { color: allowance[800] }]}>
                  {formatMoney(c.valueCents, currency)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${c.name}`}
                  onPress={() => removeChore(c.name)}
                  hitSlop={8}
                >
                  <X size={16} color={allowance[800]} strokeWidth={2.6} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {data.chores.length > 0 ? (
        <View
          style={{
            marginTop: 18,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={[typography.text.bodySm, { color: scheme.fgMuted }]}>
            Up to{" "}
            <Text style={{ color: scheme.fg, fontWeight: "700" }}>{formatMoney(totalCents, currency)}</Text> a
            day, if all done
          </Text>
          <Text style={[typography.text.caption, { color: scheme.fgFaint }]}>
            {data.chores.length} picked
          </Text>
        </View>
      ) : null}
    </OBShell>
  );
}

/* ---------- 8. Causes (giving is given in real life) ---------- */

function OBCauses({
  data,
  patch,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  patch: (p: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { scheme, typography } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const [customCause, setCustomCause] = useState("");

  const toggle = (name: string) => {
    if (data.causes.includes(name)) {
      patch({ causes: data.causes.filter((c) => c !== name) });
    } else {
      patch({ causes: [...data.causes, name] });
    }
  };

  const addCustom = () => {
    const name = customCause.trim();
    if (!name || data.causes.includes(name)) {
      return;
    }
    patch({ causes: [...data.causes, name] });
    setCustomCause("");
  };

  // Causes the parent typed themselves (not one of the suggested picks).
  const customCauses = data.causes.filter(
    (c) => !CAUSE_PICKS.some((p) => p.name === c),
  );

  return (
    <OBShell
      onBack={onBack}
      footer={
        <>
          <OBPrimary onPress={onNext} disabled={data.causes.length === 0}>
            {data.causes.length ? "Continue" : "Pick at least one"}
          </OBPrimary>
          <OBSecondary onPress={onNext}>Skip for now</OBSecondary>
        </>
      }
    >
      <OBTitle
        title="What matters to your family?"
        subtitle="Pick a cause your kids care about. You'll give the giving pile in real life — Chorey just remembers where they wanted it to go."
      />
      <View style={{ gap: 10 }}>
        {CAUSE_PICKS.map((c) => {
          const on = data.causes.includes(c.name);
          return (
            <Pressable
              key={c.name}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              accessibilityState={{ selected: on }}
              onPress={() => toggle(c.name)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: on ? scheme.tint.giving : scheme.bgRaised,
                borderWidth: 1.5,
                borderColor: on ? giving[400] : scheme.border,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: on ? giving[200] : scheme.bgSunken,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <c.Icon size={22} color={on ? giving[800] : scheme.fgFaint} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.text.h3, { color: scheme.fg, fontSize: 15 }]}>{c.name}</Text>
                <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 1 }]}>{c.desc}</Text>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: on ? giving[400] : "transparent",
                  borderWidth: on ? 0 : 1.5,
                  borderColor: scheme.fgFaint,
                }}
              >
                {on ? <Check size={14} color={giving[800]} strokeWidth={3} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Add your own cause. */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }}>
        <TextInput
          accessibilityLabel="Add your own idea"
          value={customCause}
          onChangeText={setCustomCause}
          onSubmitEditing={addCustom}
          placeholder="Add your own idea"
          placeholderTextColor={scheme.fgFaint}
          returnKeyType="done"
          style={{
            ...typography.text.body,
            flex: 1,
            color: scheme.fg,
            backgroundColor: scheme.bgSunken,
            borderColor: scheme.border,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add cause"
          accessibilityState={{ disabled: !customCause.trim() }}
          onPress={addCustom}
          disabled={!customCause.trim()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: customCause.trim() ? giving[400] : scheme.bgSunken,
            opacity: customCause.trim() ? 1 : 0.6,
          }}
        >
          <Plus size={20} color={customCause.trim() ? giving[800] : scheme.fgFaint} strokeWidth={2.6} />
        </Pressable>
      </View>

      {customCauses.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {customCauses.map((name) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${name}`}
              onPress={() => toggle(name)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: giving[200],
              }}
            >
              <Text style={[typography.text.label, { color: giving[800] }]}>{name}</Text>
              <X size={14} color={giving[800]} strokeWidth={2.6} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </OBShell>
  );
}

/* ---------- 9. Parent all set ---------- */

/* ---------- 9. Create account (email 6-digit code) ---------- */

function errorMessage(error: unknown): string | null {
  return error instanceof Error && error.message ? error.message : null;
}

function OBParentAccount({
  auth,
  onPersist,
  onNext,
  onBack,
}: {
  auth?: OnboardingAuth;
  onPersist: () => Promise<unknown> | undefined;
  onNext: () => void;
  onBack: () => void;
}) {
  const { typography, palette } = useChoreyTheme();
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const codeValid = codeValue.length === 6;

  const sendCode = async () => {
    if (!emailValid || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await auth?.sendEmailCode(email.trim());
      setPhase("code");
    } catch (e) {
      setError(errorMessage(e) ?? "Couldn't send the code. Check the email and try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyAndSave = async () => {
    if (!codeValid || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await auth?.verifyEmailCode(email.trim(), codeValue);
      await onPersist();
      onNext();
    } catch (e) {
      setError(errorMessage(e) ?? "That code didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OBShell
      onBack={
        phase === "code"
          ? () => {
              setPhase("email");
              setError(null);
            }
          : onBack
      }
      footer={
        phase === "email" ? (
          <OBPrimary onPress={sendCode} disabled={!emailValid || busy}>
            {busy ? "Sending…" : "Email me a code"}
          </OBPrimary>
        ) : (
          <>
            <OBPrimary onPress={verifyAndSave} disabled={!codeValid || busy}>
              {busy ? "Saving…" : "Create account & finish"}
            </OBPrimary>
            <OBSecondary onPress={sendCode}>Resend code</OBSecondary>
          </>
        )
      }
    >
      <OBTitle
        title={phase === "email" ? "Save your family." : "Enter your code."}
        subtitle={
          phase === "email"
            ? "Create your free parent account so everything you just set up is saved."
            : `We sent a 6-digit code to ${email.trim()}. Enter it to finish.`
        }
      />
      {phase === "email" ? (
        <OBField
          label="Email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setError(null);
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoFocus
          returnKeyType="go"
          onSubmitEditing={sendCode}
        />
      ) : (
        <OBField
          label="6-digit code"
          value={codeValue}
          onChange={(v) => {
            setCodeValue(v.replace(/\D/g, "").slice(0, 6));
            setError(null);
          }}
          placeholder="123456"
          keyboardType="number-pad"
          autoFocus
          maxLength={6}
          returnKeyType="go"
          onSubmitEditing={verifyAndSave}
        />
      )}
      {error ? (
        <Text style={[typography.text.bodySm, { color: palette.semantic.danger[600], marginTop: 12 }]}>
          {error}
        </Text>
      ) : null}
    </OBShell>
  );
}

function OBParentDone({
  data,
  persisted,
  onFinish,
}: {
  data: OnboardingData;
  persisted: OnboardingPersistResult | null;
  onFinish: () => void;
}) {
  const { scheme, typography, palette } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const currency = currencyForCountry(data.country);
  const totalCents = data.chores.reduce((s, c) => s + c.valueCents, 0);
  // Prefer the real generated access code; fall back to a derived placeholder
  // only when persistence didn't run (e.g. previews/tests without a backend).
  const code = persisted?.kids[0]?.accessCode ?? joinCodeFor(data.familyName);

  return (
    <OBShell footer={<OBPrimary onPress={onFinish}>Go to dashboard</OBPrimary>}>
      <View style={{ paddingTop: 20 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            backgroundColor: giving[200],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={38} color={giving[800]} strokeWidth={3} />
        </View>
        <Text style={[typography.text.h1, { color: scheme.fg, fontSize: 34, marginTop: 20 }]}>
          You&apos;re all set.
        </Text>
        <Text style={[typography.text.body, { color: scheme.fgMuted, marginTop: 10 }]}>
          {data.kids.length} {data.kids.length === 1 ? "kid" : "kids"} · {data.chores.length} chores · up to{" "}
          {formatMoney(totalCents, currency)}/day.
        </Text>

        <View
          style={{
            marginTop: 22,
            padding: 18,
            borderRadius: 18,
            backgroundColor: scheme.bgRaised,
            borderColor: scheme.border,
            borderWidth: 1,
          }}
        >
          <Text style={[typography.text.overline, { color: scheme.fgFaint }]}>Kid join code</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={{ fontFamily: typography.family.display.bold, fontSize: 34, letterSpacing: 4, color: scheme.fg }}>
              {code}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: scheme.bgSunken,
              }}
            >
              <ChevronRight size={14} color={scheme.fgMuted} strokeWidth={2} />
              <Text style={[typography.text.label, { color: scheme.fgMuted }]}>Share</Text>
            </View>
          </View>
          <Text style={[typography.text.caption, { color: scheme.fgFaint, marginTop: 8 }]}>
            Your kids enter this in the app to join the family.
          </Text>
        </View>
      </View>
    </OBShell>
  );
}

/* ---------- 10. Kid: enter code ---------- */

function OBKidCode({
  code,
  setCode,
  onNext,
  onBack,
}: {
  code: string;
  setCode: (c: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { scheme, typography, palette } = useChoreyTheme();
  const cells = 6;
  const chars = code.padEnd(cells, " ").slice(0, cells).split("");
  const onType = (v: string) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, cells));

  return (
    <OBShell
      onBack={onBack}
      footer={
        <OBPrimary onPress={onNext} disabled={code.length < cells}>
          {code.length < cells ? "Enter your code" : "Join family"}
        </OBPrimary>
      }
    >
      <OBTitle title="Enter your code." subtitle="Ask a parent for the 6-character join code." />
      <View>
        <View style={{ flexDirection: "row", gap: 8, justifyContent: "space-between" }}>
          {chars.map((ch, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 58,
                borderRadius: 12,
                backgroundColor: scheme.bgRaised,
                borderWidth: 1.5,
                borderColor: i === code.length ? palette.accent[600] : palette.border.mid,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: typography.family.display.bold, fontSize: 26, color: scheme.fg }}>
                {ch.trim()}
              </Text>
            </View>
          ))}
        </View>
        {/* hidden input overlay */}
        <OBField label={undefined} value={code} onChange={onType} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use a sample code"
        onPress={() => setCode("CHRVR1")}
        style={{ marginTop: 16 }}
      >
        <Text
          style={[
            typography.text.bodySm,
            { color: scheme.fgFaint, textDecorationLine: "underline" },
          ]}
        >
          Use a sample code
        </Text>
      </Pressable>
    </OBShell>
  );
}

/* ---------- 11. Kid: avatar ---------- */

function OBKidAvatar({
  data,
  patch,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  patch: (p: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { typography } = useChoreyTheme();
  const toneStyle = useToneStyle(data.kidTone);
  const ready = !!data.kidName.trim();

  return (
    <OBShell
      onBack={onBack}
      footer={
        <OBPrimary onPress={onNext} disabled={!ready}>
          That&apos;s me
        </OBPrimary>
      }
    >
      <OBTitle title="Make it yours." subtitle="Pick a color and tell us your name." />
      <View style={{ alignItems: "center", marginBottom: 22 }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            backgroundColor: toneStyle.avatarBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: typography.family.display.bold, fontSize: 44, color: toneStyle.text }}>
            {(data.kidName.trim()[0] || "?").toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", marginBottom: 24 }}>
        {KID_TONES.map((t) => (
          <ColorSwatch
            key={t.tone}
            tone={t.tone}
            label={t.label}
            selected={data.kidTone === t.tone}
            onPress={() => patch({ kidTone: t.tone })}
          />
        ))}
      </View>
      <OBField label="Your name" value={data.kidName} onChange={(v) => patch({ kidName: v })} placeholder="e.g. Mia" />
    </OBShell>
  );
}

/* ---------- 12. Kid: how it works ---------- */

function OBKidHow({
  data,
  onFinish,
  onBack,
}: {
  data: OnboardingData;
  onFinish: () => void;
  onBack: () => void;
}) {
  const { scheme, typography, bucketInk } = useChoreyTheme();
  const rows = [
    { tone: "spend" as const, Icon: Gift, title: "Spend", body: "Yours to use on your wishlist." },
    { tone: "savings" as const, Icon: Lock, title: "Save", body: "Grows over time. Stays locked." },
    { tone: "giving" as const, Icon: Heart, title: "Give", body: "You give it to a cause you care about." },
  ];
  const tintFor = (tone: "spend" | "savings" | "giving") =>
    tone === "spend" ? scheme.tint.allowance : tone === "savings" ? scheme.tint.savings : scheme.tint.giving;

  return (
    <OBShell onBack={onBack} footer={<OBPrimary onPress={onFinish}>Start earning</OBPrimary>}>
      <OBTitle
        title={data.kidName.trim() ? `Welcome, ${data.kidName.trim()}!` : "How it works."}
        subtitle="Every chore you finish pays you. Your money splits three ways."
      />
      <View style={{ gap: 12 }}>
        {rows.map((r) => {
          const ramp = bucketTokens[r.tone].ramp;
          return (
            <View
              key={r.title}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                padding: 16,
                borderRadius: 16,
                backgroundColor: tintFor(r.tone),
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  backgroundColor: ramp[200],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <r.Icon size={24} color={ramp[800]} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.text.h3, { color: bucketInk(r.tone), fontSize: 16 }]}>{r.title}</Text>
                <Text style={[typography.text.caption, { color: scheme.fgMuted, marginTop: 1 }]}>{r.body}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </OBShell>
  );
}
