import type { Metadata } from "next";
import "./globals.css";
import "./product.css";
import { AppProviders } from "@/components/app-providers";

export const metadata: Metadata = {
  title: "Stockwise — A sharper view of your shop.",
  description:
    "A clear, simple way for independent shops to track stock, record sales, and keep the team in sync—even when the internet drops.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/stockwise-app-icon.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/stockwise-app-icon.png",
    apple: "/stockwise-app-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
