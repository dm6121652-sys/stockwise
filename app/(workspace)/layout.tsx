"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell";

const titles: Record<string, string> = {
  "/dashboard": "Shop floor",
  "/products": "Products",
  "/sell": "Record a sale",
  "/sales": "Sales history",
  "/team": "Team",
  "/performance": "Performance",
  "/settings": "Settings",
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <AppShell title={titles[pathname] || "Your shop"}>{children}</AppShell>;
}
