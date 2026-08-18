// Fixed palette for the mobile-app-style shell (header, bottom nav, stat
// cards). Deliberately independent of the desktop theme-variant tokens in
// globals.css: the goal is for mobile web to always look like the Flutter
// app's light/green identity, regardless of which of the 5 desktop theme
// variants (pmo-clarity, strategic-notebook, ...) is active.
export const mobileTheme = {
  headerFrom: "#0B3B34",
  headerTo: "#1F6E4A",
  accent: "#2E7D46",
  accentSoft: "#E8F5E3",
  accentSofter: "#F3FAF0",
  statusGood: "#4CAF50",
  statusGoodBg: "#E7F6E8",
  statusWarn: "#F5A623",
  statusWarnBg: "#FDF1DD",
  ink: "#0F2A22",
  muted: "#5B7A6E",
  border: "#E4EFE6",
  cardBg: "#FFFFFF",
  pageBg: "#F6FAF4",
}
