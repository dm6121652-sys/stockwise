"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { ScrollMotion } from "@/components/scroll-motion";
import { ServiceWorker } from "@/components/service-worker";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ScrollMotion />
      <ServiceWorker />
      {children}
    </ThemeProvider>
  );
}
