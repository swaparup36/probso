import type { Appearance } from "@clerk/types"

export const clerkAppearance: Appearance = {
  variables: {
    colorNeutral: "#ffffff",
    colorPrimary: "#c7c4f7",
    colorPrimaryForeground: "#000000",
    colorBackground: "#0a0a0c",
    colorForeground: "#ffffff",
    colorMutedForeground: "#8d8d97",
    colorMuted: "#141418",
    colorBorder: "#2a2a31",
    colorRing: "#c7c4f7",
    colorShadow: "#000000",
    colorInput: "#131317",
    colorInputForeground: "#ffffff",
    colorDanger: "#ff6b6b",
    colorSuccess: "#7ee0a8",
    colorWarning: "#f5c563",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-poppins), Poppins, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    card: "bg-card border border-border shadow-none",
    headerTitle: "font-display text-white font-medium",
    formButtonPrimary: "normal-case font-medium shadow-none",
    footerActionLink: "text-primary hover:text-white",
  },
}
