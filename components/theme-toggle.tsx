"use client";

import { Glyph } from "@/components/brand";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return <button className={compact ? "theme-toggle compact" : "theme-toggle"} type="button" onClick={toggleTheme} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}><Glyph name={theme === "dark" ? "sun" : "moon"} size={18}/>{!compact && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}</button>;
}
