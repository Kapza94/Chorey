import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Check, ChevronRight, Gift, Heart, Lock, Plus, Sparkles, User } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { buckets as bucketTokens } from "@/theme/chorey-theme";
import {
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

const CHORE_PICKS = [
  { name: "Make the bed", valueCents: 100 },
  { name: "Dishes", valueCents: 250 },
  { name: "Walk the dog", valueCents: 300 },
  { name: "Take out trash", valueCents: 200 },
  { name: "Tidy room", valueCents: 200 },
  { name: "Homework done", valueCents: 150 },
  { name: "Set the table", valueCents: 100 },
  { name: "Water plants", valueCents: 100 },
];

const CHARITY_PICKS = [
  { name: "City Food Bank", desc: "Meals for local families", Icon: Gift },
  { name: "Animal Shelter", desc: "Care for rescue pets", Icon: Heart },
  { name: "Clean Oceans", desc: "Protect beaches & seas", Icon: Sparkles },
  { name: "Children's Hospital", desc: "Help kids get well", Icon: Heart },
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
  charities: string[];
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
      charities: string[];
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
  | "p_charity"
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
  charities: [],
  kidName: "",
  kidTone: "allowance",
};

function joinCodeFor(familyName: string) {
  return "CH" + (familyName.replace(/[^A-Za-z]/g, "").toUpperCase() + "KID").slice(0, 4);
}

/* ---------- flow controller ---------- */

export function OnboardingFlow({
  onComplete,
  initialStep = "welcome",
}: {
  onComplete?: (result: OnboardingResult) => void;
  initialStep?: Step;
}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [data, setData] = useState<OnboardingData>(INITIAL);
  const [code, setCode] = useState("");
  const patch = (next: Partial<OnboardingData>) => setData((d) => ({ ...d, ...next }));

  const finishParent = () => {
    const currency = currencyForCountry(data.country);
    onComplete?.({
      role: "parent",
      parentName: data.parentName.trim(),
      familyName: data.familyName.trim(),
      country: data.country,
      currency,
      kids: data.kids,
      split: balanceSplit(data.split.spend, data.split.give),
      cadence: data.cadence,
      budgetCents: data.budgetDollars * 100,
      chores: data.chores,
      charities: data.charities,
      joinCode: joinCodeFor(data.familyName),
    });
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
          onNext={() => setStep("p_charity")}
          onBack={() => setStep("p_split")}
        />
      );
    case "p_charity":
      return (
        <OBCharities
          data={data}
          patch={patch}
          onNext={() => setStep("p_done")}
          onBack={() => setStep("p_chores")}
        />
      );
    case "p_done":
      return <OBParentDone data={data} onFinish={finishParent} />;
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
  const { scheme, typography } = useChoreyTheme();
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
                <Text style={{ fontFamily: typography.family.display.bold, fontSize: 22, color: ramp[800] }}>
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
  const { scheme, typography, palette } = useChoreyTheme();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [tone, setTone] = useState<KidTone>("allowance");

  const addKid = () => {
    if (!name.trim()) return;
    patch({ kids: [...data.kids, { name: name.trim(), age, tone }] });
    setName("");
    setAge("");
    const idx = KID_TONES.findIndex((t) => t.tone === tone);
    setTone(KID_TONES[(idx + 1) % KID_TONES.length].tone);
  };

  return (
    <OBShell
      onBack={onBack}
      progress={{ index: 3, total: 4 }}
      footer={
        <OBPrimary onPress={onNext} disabled={data.kids.length === 0}>
          {data.kids.length ? "Continue" : "Add a kid to continue"}
        </OBPrimary>
      }
    >
      <OBTitle title="Add your kids." subtitle="Add one or more. They'll each get a join code." />

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
            <OBField
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Kid's name"
              returnKeyType="done"
              onSubmitEditing={addKid}
            />
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
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          {KID_TONES.map((t) => (
            <ColorSwatch key={t.tone} tone={t.tone} label={t.label} selected={tone === t.tone} onPress={() => setTone(t.tone)} />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={data.kids.length ? "Add another" : "Add kid"}
          onPress={addKid}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
            borderRadius: 999,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: palette.border.mid,
          }}
        >
          <Plus size={16} color={name.trim() ? scheme.fg : scheme.fgDisabled} strokeWidth={2} />
          <Text
            style={[
              typography.text.label,
              { color: name.trim() ? scheme.fg : scheme.fgDisabled },
            ]}
          >
            Add {data.kids.length ? "another" : "kid"}
          </Text>
        </Pressable>
      </View>
    </OBShell>
  );
}

function KidRow({ kid }: { kid: Kid }) {
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
      <Check size={18} color={bucketTokens.giving.ramp[600]} strokeWidth={2.6} />
    </View>
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
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5 }}>
            <Text style={{ fontFamily: typography.family.display.bold, fontSize: 34, color: scheme.fg }}>
              {symbol}
              {data.budgetDollars}
            </Text>
            <Text style={[typography.text.bodySm, { color: scheme.fgFaint }]}>
              / {data.cadence === "monthly" ? "month" : "week"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <OBStepButton
              symbol="−"
              label="Decrease budget"
              tone="spend"
              onPress={() => patch({ budgetDollars: Math.max(5, data.budgetDollars - 5) })}
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
  const { scheme, typography } = useChoreyTheme();
  const ramp = bucketTokens[tone].ramp;
  const tintKey = tone === "spend" ? "allowance" : tone;
  return (
    <View style={{ flex: 1, backgroundColor: scheme.tint[tintKey], borderRadius: 14, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 }}>
      <Text style={[typography.text.overline, { color: ramp[800], fontSize: 10, textAlign: "center" }]}>
        {label}
      </Text>
      <Text style={{ fontFamily: typography.family.display.bold, fontSize: 28, color: ramp[800], textAlign: "center" }}>
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
  const { scheme, typography, palette } = useChoreyTheme();
  const currency = currencyForCountry(data.country);
  const allowance = bucketTokens.spend.ramp;

  const toggle = (name: string) => {
    const has = data.chores.find((c) => c.name === name);
    if (has) {
      patch({ chores: data.chores.filter((c) => c.name !== name) });
    } else {
      const pick = CHORE_PICKS.find((c) => c.name === name);
      if (pick) patch({ chores: [...data.chores, pick] });
    }
  };

  const totalCents = data.chores.reduce((s, c) => s + c.valueCents, 0);

  return (
    <OBShell
      onBack={onBack}
      footer={
        <OBPrimary onPress={onNext} disabled={data.chores.length === 0}>
          {data.chores.length
            ? `Add ${data.chores.length} ${data.chores.length === 1 ? "chore" : "chores"}`
            : "Pick at least one"}
        </OBPrimary>
      }
    >
      <OBTitle title="First chores." subtitle="Tap to add a few. Edit the rewards anytime." />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
        {CHORE_PICKS.map((c) => {
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

      {data.chores.length > 0 ? (
        <View
          style={{
            marginTop: 22,
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

/* ---------- 8. Charities ---------- */

function OBCharities({
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
  const toggle = (name: string) => {
    if (data.charities.includes(name)) {
      patch({ charities: data.charities.filter((c) => c !== name) });
    } else {
      patch({ charities: [...data.charities, name] });
    }
  };

  return (
    <OBShell
      onBack={onBack}
      footer={
        <>
          <OBPrimary onPress={onNext} disabled={data.charities.length === 0}>
            {data.charities.length ? "Continue" : "Pick at least one"}
          </OBPrimary>
          <OBSecondary onPress={onNext}>Skip for now</OBSecondary>
        </>
      }
    >
      <OBTitle title="Where giving goes." subtitle="Pick the causes your kids can choose between for their 20%." />
      <View style={{ gap: 10 }}>
        {CHARITY_PICKS.map((c) => {
          const on = data.charities.includes(c.name);
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
    </OBShell>
  );
}

/* ---------- 9. Parent all set ---------- */

function OBParentDone({ data, onFinish }: { data: OnboardingData; onFinish: () => void }) {
  const { scheme, typography, palette } = useChoreyTheme();
  const giving = bucketTokens.giving.ramp;
  const currency = currencyForCountry(data.country);
  const totalCents = data.chores.reduce((s, c) => s + c.valueCents, 0);
  const code = joinCodeFor(data.familyName);

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
  const { scheme, typography } = useChoreyTheme();
  const rows = [
    { tone: "spend" as const, Icon: Gift, title: "Spend", body: "Yours to use on your wishlist." },
    { tone: "savings" as const, Icon: Lock, title: "Save", body: "Grows over time. Stays locked." },
    { tone: "giving" as const, Icon: Heart, title: "Give", body: "Goes to a cause you care about." },
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
                <Text style={[typography.text.h3, { color: ramp[800], fontSize: 16 }]}>{r.title}</Text>
                <Text style={[typography.text.caption, { color: scheme.fgMuted, marginTop: 1 }]}>{r.body}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </OBShell>
  );
}
