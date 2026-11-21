"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "stockwise.theme.v1";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_KEY, theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<Theme>("dark");
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const selected: Theme = stored === "light" ? "light" : "dark";
    updateTheme(selected); document.documentElement.dataset.theme = selected;
  }, []);
  const setTheme = (selected: Theme) => { updateTheme(selected); applyTheme(selected); };
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
