/**
 * Chorey design tokens — the single source of truth.
 *
 * Ported from the design handoff (`design_handoff_chorey/colors_and_type.css`).
 * Every screen pulls colors, type, spacing, radii, shadows, and motion from here
 * (directly or via the theme hook). Nothing in the UI should hard-code a hex, a
 * font family, or a `$` — those live here or in the currency formatter.
 *
 * Design rules baked in:
 *   - Surfaces are warm creams, never pure #FFF. Dark mode is coffee-bean brown, never blue-black.
 *   - The 40/40/20 trio (peach / lilac / sage) is brand DNA — load-bearing, never decorative.
 *   - The primary CTA uses the peach/allowance family.
 */

/* ============================================================
   RAW PALETTE — the literal swatches. Theme-independent.
   ============================================================ */

/** Warm off-white neutrals (light mode). Numbered low→high elevation. */
const cream = {
  0: "#ECE3D1", // deepest cream — section divider / sunken
  1: "#F1E9D9", // sunken / hover
  2: "#F6EFE3", // canvas — the page background
  3: "#FBF7EE", // raised — cards, sheets
  4: "#FFFCF5", // highest — modals, tooltips
} as const;

/** Coffee-bean browns for warm-dark mode. Never blue-black. */
const ink = {
  0: "#14110D", // deepest
  1: "#1C1814", // canvas (dark page)
  2: "#25201A", // raised
  3: "#2F2922", // highest
  4: "#3B342B", // hairline / border on dark
} as const;

/** Warm near-black text (light). */
const fg = {
  1: "#2A2018", // primary
  2: "#5C4E3F", // secondary
  3: "#8A7B6A", // tertiary / meta
  4: "#B5A693", // disabled / placeholder
} as const;

/** On-dark text. */
const fgDark = {
  1: "#F4ECDC",
  2: "#C8B9A2",
  3: "#97876F",
  4: "#5F5446",
} as const;

export type Ramp = {
  100: string;
  200: string;
  400: string; // primary swatch
  600: string; // readable text-on-cream
  800: string; // deep — type / borders
  /** soft-tint background substitute used in dark mode */
  tintDark: string;
};

/** The 40/40/20 trio. Brand colors — constant across themes (only the 100 tint shifts in dark). */
const allowance: Ramp = {
  100: "#FBEAE0",
  200: "#F4CDB9",
  400: "#E8B4A0",
  600: "#C58A72",
  800: "#7E4F3A",
  tintDark: "#3A2A22",
};
const savings: Ramp = {
  100: "#ECE5F5",
  200: "#D9CDEC",
  400: "#C8B8E0",
  600: "#8E7AB5",
  800: "#4F4078",
  tintDark: "#2A2536",
};
const giving: Ramp = {
  100: "#E4EEE5",
  200: "#C9DDCD",
  400: "#A8C9B5",
  600: "#6F9881",
  800: "#3F5E4C",
  tintDark: "#243029",
};

/** Functional accent — same family as allowance/peach, for the primary CTA. */
const accent = {
  100: "#FBEAE0",
  400: "#E8B4A0",
  600: "#C58A72", // primary button bg
  800: "#7E4F3A",
} as const;

/** Semantic. Each pairs a -600 ink with a -100 tint (light) and a dark tint. */
const semantic = {
  success: { 600: "#6F9881", 100: "#E4EEE5", tintDark: "#243029" },
  warning: { 600: "#C28F3F", 100: "#FAEEDC", tintDark: "#3A2E1E" },
  danger: { 600: "#B26B65", 100: "#F5DDDC", tintDark: "#3A2424" },
  info: { 600: "#6E8E9D", 100: "#DEE9EE", tintDark: "#1F2A30" },
} as const;

/** Hairlines & borders (warm, low alpha). */
const border = {
  soft: "rgba(42, 32, 24, 0.06)",
  mid: "rgba(42, 32, 24, 0.12)",
  strong: "rgba(42, 32, 24, 0.20)",
  softDark: "rgba(244, 236, 220, 0.08)",
  midDark: "rgba(244, 236, 220, 0.16)",
} as const;

export const palette = {
  cream,
  ink,
  fg,
  fgDark,
  allowance,
  savings,
  giving,
  accent,
  semantic,
  border,
} as const;

/* ============================================================
   RADII — soft, but never candy-pill on cards.
   ============================================================ */
const radius = {
  xs: 6,
  sm: 10,
  md: 14, // default card / input
  lg: 20, // sheets, big buckets
  xl: 28, // hero cards
  pill: 999, // buttons only
} as const;

/* ============================================================
   SPACING — 4-pt grid.
   ============================================================ */
const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/* ============================================================
   TYPOGRAPHY
   ============================================================ */

/**
 * Font family names. These strings MUST match the keys registered with `useFonts`
 * in `src/theme/use-chorey-fonts.ts`. Money always uses the body family with
 * tabular figures (set `fontVariant: ["tabular-nums"]` on the <Text>).
 */
const fontFamily = {
  display: {
    regular: "Bricolage_400Regular",
    medium: "Bricolage_500Medium",
    semibold: "Bricolage_600SemiBold",
    bold: "Bricolage_700Bold",
    extra: "Bricolage_800ExtraBold",
  },
  body: {
    regular: "Jakarta_400Regular",
    medium: "Jakarta_500Medium",
    semibold: "Jakarta_600SemiBold",
    bold: "Jakarta_700Bold",
    extra: "Jakarta_800ExtraBold",
  },
  mono: {
    regular: "JetBrainsMono_400Regular",
    medium: "JetBrainsMono_500Medium",
  },
} as const;

/** Type scale in logical px. */
const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 22,
  xl: 28,
  "2xl": 36,
  "3xl": 48,
  "4xl": 64,
  "5xl": 88,
} as const;

const lineHeightRatio = {
  tight: 1.05,
  snug: 1.2,
  normal: 1.45,
  loose: 1.65,
} as const;

/**
 * Letter-spacing. CSS uses em; RN uses absolute points, so these are the em
 * multipliers — multiply by the element's fontSize. The presets below do this.
 */
const trackingEm = {
  tight: -0.02,
  normal: 0,
  wide: 0.04,
  caps: 0.1,
} as const;

const round = (n: number) => Math.round(n * 100) / 100;

type TextPreset = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: "uppercase";
  fontVariant?: ["tabular-nums"];
};

const preset = (
  family: string,
  size: number,
  lh: keyof typeof lineHeightRatio,
  trackKey: keyof typeof trackingEm = "normal",
  extra: Partial<TextPreset> = {},
): TextPreset => ({
  fontFamily: family,
  fontSize: size,
  lineHeight: round(size * lineHeightRatio[lh]),
  letterSpacing: round(size * trackingEm[trackKey]),
  ...extra,
});

/**
 * Semantic type presets — spread directly onto <Text style={…}>.
 * Mirrors the `.t-*` classes in colors_and_type.css.
 */
const text = {
  /** huge balances, splash numbers */
  display: preset(fontFamily.display.semibold, fontSize["5xl"], "tight", "tight"),
  /** page titles */
  h1: preset(fontFamily.display.semibold, fontSize["3xl"], "tight", "tight"),
  /** section titles */
  h2: preset(fontFamily.body.bold, fontSize.xl, "snug", "tight"),
  /** card titles */
  h3: preset(fontFamily.body.bold, fontSize.md, "snug"),
  body: preset(fontFamily.body.regular, fontSize.base, "normal"),
  bodySm: preset(fontFamily.body.regular, fontSize.sm, "normal"),
  /** form labels, list meta */
  label: preset(fontFamily.body.semibold, fontSize.sm, "snug"),
  caption: preset(fontFamily.body.medium, fontSize.xs, "snug"),
  /** tiny caps labels */
  overline: preset(fontFamily.body.bold, fontSize.xs, "snug", "caps", {
    textTransform: "uppercase",
  }),
  /** dollar amounts in lists */
  money: preset(fontFamily.body.bold, fontSize.base, "snug", "tight", {
    fontVariant: ["tabular-nums"],
  }),
  /** the big balance number */
  moneyHero: preset(fontFamily.display.bold, fontSize["4xl"], "tight", "tight", {
    fontVariant: ["tabular-nums"],
  }),
  mono: preset(fontFamily.mono.regular, fontSize.sm, "snug"),
} as const;

const typography = {
  family: fontFamily,
  size: fontSize,
  lineHeightRatio,
  trackingEm,
  text,
} as const;

/* ============================================================
   SHADOWS — warm, low, never blue. RN shadow props.
   Most surfaces sit on a single hairline (shadow-xs).
   Dark mode fades shadows out and leans on color contrast.
   ============================================================ */
export type ChoreyShadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

const SHADOW_INK = "#2A2018";

const shadowLight = {
  xs: { shadowColor: SHADOW_INK, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 0, elevation: 0 },
  sm: { shadowColor: SHADOW_INK, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: SHADOW_INK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  lg: { shadowColor: SHADOW_INK, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 32, elevation: 6 },
} as const satisfies Record<string, ChoreyShadow>;

const shadowDark = {
  xs: { shadowColor: "#000000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 0, elevation: 0 },
  sm: { shadowColor: "#000000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: "#000000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.32, shadowRadius: 12, elevation: 2 },
  lg: { shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 32, elevation: 6 },
} as const satisfies Record<string, ChoreyShadow>;

/* ============================================================
   MOTION — easing as bezier tuples (for Reanimated `Easing.bezier(...)`).
   ============================================================ */
const motion = {
  easing: {
    /** default */
    out: [0.22, 0.61, 0.36, 1] as const,
    /** small bounce — chore-check ONLY */
    spring: [0.34, 1.56, 0.64, 1] as const,
  },
  duration: {
    fast: 140, // press
    base: 220, // open/close + chore-check spring
    slow: 360, // full-screen transitions
  },
  /** press feedback */
  pressScale: 0.97,
} as const;

/* ============================================================
   TOYBOX — the tile language: ink outlines + solid offset shadows.
   Cards read as physical tiles sitting on the page; pressing a
   button drops it onto its shadow (translateY by `offset`).
   ============================================================ */
const toybox = {
  /** outline weight on tiles, buttons, avatars, stickers */
  borderWidth: 2,
  /** solid shadow drop — also the press-down travel distance */
  offset: 3,
  /** default tile corner */
  radius: 16,
  /** squircle corner for avatars */
  squircle: 13,
  /** sticker badges sit slightly off-axis */
  stickerRotate: "-1.5deg",
} as const;

/** Solid offset shadow (no blur) — the toybox tile drop. */
const toyShadow = (color: string, drop: number): ChoreyShadow => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: drop },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: drop,
});

/* ============================================================
   SCHEMES — semantic surface/text tokens per color mode.
   Use the theme hook to get the active scheme.
   ============================================================ */
export type ColorScheme = "light" | "dark";

export type ChoreyScheme = {
  bgPage: string;
  bgRaised: string;
  bgSunken: string;
  bgModal: string;
  fg: string;
  fgMuted: string;
  fgFaint: string;
  fgDisabled: string;
  border: string;
  borderHover: string;
  /** soft-tint backgrounds for the trio + semantic, shifted for dark mode */
  tint: {
    allowance: string;
    savings: string;
    giving: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  shadow: Record<"xs" | "sm" | "md" | "lg", ChoreyShadow>;
  /** toybox tile tokens — ink outline color + solid offset shadows */
  toy: {
    border: string;
    shadow: ChoreyShadow;
    shadowSm: ChoreyShadow;
  };
};

const lightScheme: ChoreyScheme = {
  bgPage: cream[2],
  bgRaised: cream[3],
  bgSunken: cream[1],
  bgModal: cream[4],
  fg: fg[1],
  fgMuted: fg[2],
  fgFaint: fg[3],
  fgDisabled: fg[4],
  border: border.soft,
  borderHover: border.mid,
  tint: {
    allowance: allowance[100],
    savings: savings[100],
    giving: giving[100],
    success: semantic.success[100],
    warning: semantic.warning[100],
    danger: semantic.danger[100],
    info: semantic.info[100],
  },
  shadow: shadowLight,
  toy: {
    border: fg[1],
    shadow: toyShadow(fg[1], toybox.offset),
    shadowSm: toyShadow(fg[1], 2),
  },
};

const darkScheme: ChoreyScheme = {
  bgPage: ink[1],
  bgRaised: ink[2],
  bgSunken: ink[0],
  bgModal: ink[3],
  fg: fgDark[1],
  fgMuted: fgDark[2],
  fgFaint: fgDark[3],
  fgDisabled: fgDark[4],
  border: border.softDark,
  borderHover: border.midDark,
  tint: {
    allowance: allowance.tintDark,
    savings: savings.tintDark,
    giving: giving.tintDark,
    success: semantic.success.tintDark,
    warning: semantic.warning.tintDark,
    danger: semantic.danger.tintDark,
    info: semantic.info.tintDark,
  },
  shadow: shadowDark,
  // The toybox tile language, translated for the near-black dark canvas: a solid
  // *light* offset reads as the "tile dropped on its shadow" here, where a dark
  // shadow (light mode's move) would vanish into the page. Border is a crisp warm
  // light ink — the dark-mode analog of light mode's dark ink outline.
  toy: {
    border: fgDark[2],
    shadow: toyShadow(fgDark[2], toybox.offset),
    shadowSm: toyShadow(fgDark[2], 2),
  },
};

export const schemes: Record<ColorScheme, ChoreyScheme> = {
  light: lightScheme,
  dark: darkScheme,
};

/* ============================================================
   BUCKETS — the 40/40/20 model. Names are fixed product logic.
   `color`/`softColor` retained for back-compat with existing screens.
   ============================================================ */
export const buckets = {
  spend: {
    key: "spend",
    label: "Spend",
    percent: 40,
    ramp: allowance,
    color: allowance[400],
    softColor: allowance[100],
    textColor: allowance[600],
  },
  savings: {
    key: "savings",
    label: "Savings",
    percent: 40,
    ramp: savings,
    color: savings[400],
    softColor: savings[100],
    textColor: savings[600],
  },
  giving: {
    key: "giving",
    label: "Giving",
    percent: 20,
    ramp: giving,
    color: giving[400],
    softColor: giving[100],
    textColor: giving[600],
  },
} as const;

export type ChoreyBucket = keyof typeof buckets;

/* ============================================================
   THE THEME OBJECT
   New code: prefer `choreyTheme.palette`, `.typography.text`, `.schemes`, etc.
   Legacy `colors`/`radii`/`spacing`/`shadows` are kept (mapped to the
   design-authoritative values) so existing screens keep compiling while
   they are rebuilt screen-by-screen.
   ============================================================ */
export const choreyTheme = {
  palette,
  radius,
  space,
  typography,
  motion,
  schemes,
  buckets,
  toybox,
  shadow: { light: shadowLight, dark: shadowDark },

  // ---- Legacy compatibility surface (design-authoritative values) ----
  colors: {
    cream1: cream[3], // card surface
    cream2: cream[2], // page
    cream3: cream[0], // deep
    surface: cream[4], // modal / highest
    surfaceWarm: cream[3],
    ink1: fg[1], // primary text
    ink2: fg[2], // secondary text
    inkMuted: fg[3], // meta
    borderSoft: border.soft,
    borderMedium: border.mid,
    primary: accent[600], // peach CTA (was green — design is authoritative)
    primaryPressed: accent[800],
    primarySoft: accent[100],
    success: semantic.success[600],
    danger: semantic.danger[600],
    spend: allowance[400],
    spendSoft: allowance[100],
    savings: savings[400],
    savingsSoft: savings[100],
    giving: giving[400],
    givingSoft: giving[100],
  },
  radii: {
    xs: radius.xs,
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    xl: radius.xl,
    pill: radius.pill,
  },
  spacing: {
    xs: space[1],
    sm: space[2],
    md: space[3],
    lg: space[4],
    xl: space[6],
    xxl: space[8],
  },
  shadows: {
    card: shadowLight.md,
    button: shadowLight.sm,
  },
} as const;

export type ChoreyTheme = typeof choreyTheme;
