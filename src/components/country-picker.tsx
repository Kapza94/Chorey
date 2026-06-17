import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { Check, Search } from "lucide-react-native";

import { useChoreyTheme } from "@/theme/use-chorey-theme";
import { fieldStyle } from "@/components/field-style";
import { COUNTRIES, type CountryInfo } from "@/features/money/countries";
import { resolveCurrencyFormat } from "@/features/money/currency";

type Props = {
  visible: boolean;
  /** currently selected ISO 3166-1 alpha-2 code, if any */
  selectedCode?: string | null;
  onSelect: (country: CountryInfo) => void;
  onClose: () => void;
};

/**
 * A searchable, full-list country picker styled in the Chorey toybox language.
 *
 * The list spans every country (see `countries.ts`), so typing-to-filter — by
 * name, country code, or currency — replaces endless scrolling. Selecting a
 * country resolves the family's local currency upstream.
 */
export function CountryPicker({ visible, selectedCode, onSelect, onClose }: Props) {
  const { scheme, typography, palette, radius } = useChoreyTheme();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return COUNTRIES;
    }
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.cur.toLowerCase().includes(q),
    );
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
          bottom: 0,
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
          Choose your country
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
            accessibilityLabel="Search countries"
            value={query}
            onChangeText={setQuery}
            placeholder="Search by country or currency"
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
              No countries match “{query.trim()}”.
            </Text>
          }
          renderItem={({ item }) => {
            const selected = item.code === selectedCode;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.name}
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
                <Text style={[typography.text.body, { flex: 1, color: scheme.fg }]}>
                  {item.name}
                </Text>
                <Text style={[typography.text.body, { color: scheme.fgFaint }]}>
                  {item.cur} ({resolveCurrencyFormat(item.cur).symbol})
                </Text>
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
