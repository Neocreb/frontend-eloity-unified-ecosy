/**
 * Marketplace Design System
 * Ensures consistent colors, spacing, typography, and shadows across all components
 */

/**
 * Color Palette
 */
export const colors = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6", // Primary blue
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  secondary: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#e0e0e0",
    400: "#bdbdbd",
    500: "#9e9e9e",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e", // Green
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#145231",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b", // Amber
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444", // Red
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  info: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9", // Cyan
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
  },
};

/**
 * Neutral colors for text and backgrounds
 */
export const neutral = {
  white: "#ffffff",
  black: "#000000",
  50: "#f9fafb",
  100: "#f3f4f6",
  200: "#e5e7eb",
  300: "#d1d5db",
  400: "#9ca3af",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  800: "#1f2937",
  900: "#111827",
};

/**
 * Spacing scale (in rem)
 */
export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
};

/**
 * Typography scale
 */
export const typography = {
  h1: {
    fontSize: "2.25rem", // 36px
    fontWeight: 700,
    lineHeight: "2.5rem",
  },
  h2: {
    fontSize: "1.875rem", // 30px
    fontWeight: 700,
    lineHeight: "2.25rem",
  },
  h3: {
    fontSize: "1.5rem", // 24px
    fontWeight: 600,
    lineHeight: "2rem",
  },
  h4: {
    fontSize: "1.25rem", // 20px
    fontWeight: 600,
    lineHeight: "1.75rem",
  },
  body: {
    fontSize: "1rem", // 16px
    fontWeight: 400,
    lineHeight: "1.5rem",
  },
  bodySmall: {
    fontSize: "0.875rem", // 14px
    fontWeight: 400,
    lineHeight: "1.25rem",
  },
  caption: {
    fontSize: "0.75rem", // 12px
    fontWeight: 400,
    lineHeight: "1rem",
  },
  button: {
    fontSize: "1rem", // 16px
    fontWeight: 500,
    lineHeight: "1.5rem",
  },
};

/**
 * Border radius
 */
export const borderRadius = {
  none: "0",
  sm: "0.125rem", // 2px
  base: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  full: "9999px",
};

/**
 * Shadow definitions
 */
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
};

/**
 * Transition/Animation timing
 */
export const transitions = {
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
  slower: "500ms",
};

/**
 * Component-specific spacing guidelines
 */
export const componentSpacing = {
  card: {
    padding: spacing[6], // 24px
    paddingMobile: spacing[4], // 16px
    gap: spacing[4], // 16px
  },
  button: {
    paddingX: spacing[4], // 16px
    paddingY: spacing[2], // 8px
    paddingSmall: spacing[2], // 8px
    paddingLarge: spacing[6], // 24px
  },
  input: {
    height: "2.5rem", // 40px
    padding: spacing[3], // 12px
  },
  badge: {
    paddingX: spacing[2], // 8px
    paddingY: spacing[1], // 4px
  },
  section: {
    padding: spacing[8], // 32px
    paddingMobile: spacing[4], // 16px
    gap: spacing[6], // 24px
  },
};

/**
 * Common component styles as strings for Tailwind
 */
export const componentStyles = {
  // Button styles
  button: {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400",
    outline: "border border-gray-300 text-gray-900 hover:bg-gray-50",
    ghost: "text-gray-900 hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
  },

  // Card styles
  card: "bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow",
  cardHover: "bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all",

  // Input styles
  input:
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  inputError:
    "w-full px-3 py-2 border border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",

  // Badge styles
  badge: {
    primary: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
  },

  // Text styles
  heading: "font-bold text-gray-900",
  subheading: "font-semibold text-gray-800",
  body: "text-gray-700",
  muted: "text-gray-600",
  caption: "text-gray-500 text-sm",

  // Layout styles
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
  flexCenter: "flex items-center justify-center",
  flexBetween: "flex items-center justify-between",
};

/**
 * Z-index scale
 */
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
};

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  mobile: "640px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1280px",
  ultraWide: "1536px",
};

/**
 * Common spacing combinations
 */
export const spacingCombinations = {
  // Section padding
  sectionPadding: `py-${spacing[8]} px-${spacing[6]}`,
  sectionPaddingMobile: `py-${spacing[4]} px-${spacing[4]}`,

  // Component gap
  cardGap: `gap-${spacing[4]}`,
  buttonGroupGap: `gap-${spacing[2]}`,

  // Common margins
  marginBottom: `mb-${spacing[4]}`,
  marginTop: `mt-${spacing[4]}`,
  marginX: `mx-${spacing[4]}`,
};

/**
 * Utility function to combine color and shade
 */
export const getColor = (
  colorName: keyof typeof colors | keyof typeof neutral,
  shade: string | number = 500
): string => {
  if (colorName in colors) {
    return colors[colorName as keyof typeof colors][
      shade as keyof (typeof colors)[keyof typeof colors]
    ];
  } else if (colorName in neutral) {
    return neutral[colorName as keyof typeof neutral];
  }
  return "#000000";
};

/**
 * Utility function to combine spacing
 */
export const getSpacing = (size: string | number): string => {
  return spacing[size as keyof typeof spacing] || "1rem";
};

/**
 * Create a consistent card className
 */
export const getCardClass = (hover = false): string => {
  return hover ? componentStyles.cardHover : componentStyles.card;
};

/**
 * Create a consistent button className
 */
export const getButtonClass = (
  variant: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" =
    "primary"
): string => {
  return componentStyles.button[variant];
};

/**
 * Create a consistent badge className
 */
export const getBadgeClass = (
  variant: "primary" | "secondary" | "success" | "warning" | "danger" = "primary"
): string => {
  return componentStyles.badge[variant];
};

/**
 * Design system export object
 */
export const designSystem = {
  colors,
  neutral,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  componentSpacing,
  componentStyles,
  zIndex,
  breakpoints,
  spacingCombinations,
  getColor,
  getSpacing,
  getCardClass,
  getButtonClass,
  getBadgeClass,
};

export default designSystem;
