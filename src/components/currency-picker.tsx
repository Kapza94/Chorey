import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { Check, Search } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { useKeyboardHeight } from "@/components/use-keyboard-height";
import { fieldStyle } from "@/components/field-style";
import { COUNTRIES } from "@/features/money/countries";
import { resolveCurrencyFormat } from "@/features/money/currency";

type CurrencyRow = { code: string; symbol: string };

// A friendlier label for the big multi-country currencies (the bundled dataset
// is alphabetical, so the first country would read "Åland Islands" for EUR).
// Everything else falls back to its single country name.
const CURRENCY_REGION: Record<string, string> = {
  USD: "United States",
  EUR: "Eurozone",
  GBP: "United Kingdom",
  XOF: "West Africa (CFA franc)",
  XAF: "Central Africa (CFA franc)",
  XCD: "East Caribbean",
};

type CurrencyEntry = CurrencyRow & {
  /** short display name of the country/region this currency belongs to */
  region: string;
  /** lowercase code + all country names, for search matching */
  search: string;
};

/**
 * Every distinct currency in the bundled country dataset, de-duplicated by ISO
 * code and sorted alphabetically. Each entry carries the country it belongs to
 * (so people who don't know the code can find it) plus a search haystack of
 * every country name using it. Kept module-level so the list is built once.
 */
const CURRENCIES: CurrencyEntry[] = (() => {
  const byCode = new Map<string, { symbol: string; countries: string[] }>();
  for (const country of COUNTRIES) {
    const entry = byCode.get(country.cur);
    if (entry) {
      entry.countries.push(country.name);
    } else {
      byCode.set(country.cur, { symbol: country.symbol, countries: [country.name] });
    }
  }
  return [...byCode.entries()]
    .map(([code, { symbol, countries }]) => ({
      code,
      symbol,
      region:
        CURRENCY_REGION[code] ??
        (countries.length > 1 ? `${countries[0]} & more` : countries[0]),
      search: `${code} ${countries.join(" ")}`.toLowerCase(),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
})();

type Props = {
  visible: boolean;
  /** currently selected ISO 4217 code, if any */
  selectedCode?: string | null;
  onSelect: (currency: CurrencyRow) => void;
  onClose: () => void;
};

/**
 * A searchable currency picker styled like {@link CountryPicker}. Currency
 * defaults to the family's country but is chosen independently here — a family
 * in one country may pay their child out in another currency.
 */
export function CurrencyPicker({ visible, selectedCode, onSelect, onClose }: Props) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const [query, setQuery] = useState("");
  const keyboardHeight = useKeyboardHeight();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return CURRENCIES;
    }
    return CURRENCIES.filter((c) => c.search.includes(q));
  }, [query]);

  const close = () => {
    setQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={close}
        style={{ flex: 1, backgroundColor: "rgba(42, 32, 24, 0.32)" }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: keyboardHeight,
          maxHeight: "85%",
          backgroundColor: scheme.bgModal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 22,
          paddingTop: 14,
          paddingBottom: 16,
          ...scheme.shadow.lg,
        }}
      >
        <View
          style={{
            width: 38,
            height: 4,
            borderRadius: radius.pill,
            backgroundColor: palette.border.strong,
            alignSelf: "center",
            marginBottom: 14,
          }}
        />
        <Text style={[typography.text.h2, { color: scheme.fg, marginBottom: 12 }]}>
          Choose your currency
        </Text>

        {/* Search */}
        <View style={{ position: "relative", marginBottom: 10 }}>
          <View
            style={{
              position: "absolute",
              left: 12,
              top: 0,
              bottom: 0,
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Search size={16} color={scheme.fgFaint} strokeWidth={2} />
          </View>
          <TextInput
            accessibilityLabel="Search currencies"
            value={query}
            onChangeText={setQuery}
            placeholder="Search by currency or country"
            placeholderTextColor={scheme.fgFaint}
            autoCorrect={false}
            autoCapitalize="none"
            style={[
              fieldStyle(scheme, typography.family.body.regular),
              { paddingLeft: 36 },
            ]}
          />
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <Text
              style={[
                typography.text.body,
                { color: scheme.fgFaint, paddingVertical: 20, textAlign: "center" },
              ]}
            >
              No currencies match “{query.trim()}”.
            </Text>
          }
          renderItem={({ item }) => {
            const selected = item.code === selectedCode;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.code}
                accessibilityState={{ selected }}
                onPress={() => {
                  onSelect(item);
                  close();
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 13,
                  borderBottomWidth: 1,
                  borderBottomColor: scheme.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.text.label, { color: scheme.fg }]}>
                    {item.code}
                  </Text>
                  <Text
                    style={[
                      typography.text.caption,
                      { color: scheme.fgFaint, marginTop: 1 },
                    ]}
                  >
                    {item.region}
                  </Text>
                </View>
                {resolveCurrencyFormat(item.code).symbol !== item.code ? (
                  <Text style={[typography.text.body, { color: scheme.fgFaint }]}>
                    {resolveCurrencyFormat(item.code).symbol}
                  </Text>
                ) : null}
                {selected ? (
                  <Check size={16} color={palette.accent[600]} strokeWidth={2.6} />
                ) : (
                  <View style={{ width: 16 }} />
                )}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}
