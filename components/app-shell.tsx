"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { Mark, Glyph } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSupabase } from "@/lib/supabase";
import { clearShopContext, getShopContext } from "@/lib/cloud";
import type { ShopContext } from "@/lib/cloud";

const links = [
  { href: "/dashboard", label: "Overview", mobileLabel: "Home", icon: "overview" as const },
  { href: "/products", label: "Products", mobileLabel: "Stock", icon: "products" as const },
  { href: "/sell", label: "Record a sale", mobileLabel: "Sell", icon: "sales" as const },
  { href: "/sales", label: "Sales history", mobileLabel: "Sales", icon: "clock" as const },
];
type WorkspaceState = "loading" | "ready" | "error";

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname(); const router = useRouter();
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>("loading");
  const [workspaceError, setWorkspaceError] = useState("");
  const [shop, setShop] = useState<ShopContext | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shopRef = useRef<ShopContext | null>(null);
  const loadWorkspace = useCallback(async () => {
    if (!shopRef.current) setWorkspaceState("loading");
    setWorkspaceError("");
    try {
      const context = await getShopContext(true);
      if (!context) throw new Error("No shop is linked to this account yet. Sign in again or contact your shop owner.");
      shopRef.current = context; setShop(context); setWorkspaceState("ready");
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "We couldn’t load your shop. Check your connection and try again.");
      if (!shopRef.current) setWorkspaceState("error");
    }
  }, []);
  useEffect(() => {
    const update = () => { if (navigator.onLine) void loadWorkspace(); };
    const profileUpdated = (event: Event) => { const name = (event as CustomEvent<string>).detail; setShop(current => current ? { ...current, fullName: name } : current); };
    void loadWorkspace();
    window.addEventListener("online", update); window.addEventListener("offline", update);
    window.addEventListener("stockwise:profile", profileUpdated);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); window.removeEventListener("stockwise:profile", profileUpdated); };
  }, [loadWorkspace]);
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileMenuOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", closeOnEscape); };
  }, [mobileMenuOpen]);
  async function signOut() { await getSupabase()?.auth.signOut(); clearShopContext(); router.replace("/login"); }

  const isOwner = shop?.role === "owner";
  const restricted = !isOwner && (pathname === "/team" || pathname === "/performance");
  const visibleLinks = isOwner ? [...links, { href: "/performance", label: "Performance", mobileLabel: "Insights", icon: "sales" as const }, { href: "/team", label: "Team", mobileLabel: "Team", icon: "team" as const }] : links;
  const initials = (shop?.fullName || "").split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();
  const firstName = shop?.fullName.trim().split(/\s+/)[0] || "there";

  if (workspaceState === "loading") return <AuthGate><div className="loading-screen"><Mark/><span>Opening your shop…</span></div></AuthGate>;
  if (workspaceState === "error") return <AuthGate><div className="loading-screen workspace-error"><Mark/><h1>Your shop couldn’t load</h1><p>{workspaceError}</p><button className="outline-button" onClick={() => void loadWorkspace()}>Try again</button><button className="preview-link" onClick={() => void signOut()}>Sign out</button></div></AuthGate>;

  return (
    <AuthGate>
      <div className="app-layout">
        <aside className="app-sidebar">
          <Link href="/" className="app-logo"><Mark/><span>stockwise</span></Link>
          <div className="workspace-switch"><span className="workspace-avatar">{shop?.name.slice(0,1).toUpperCase()}</span><span><b>{shop?.name}</b><small>Shop workspace</small></span><span className="workspace-chevron"/></div>
          <span className="sidebar-label">WORKSPACE</span>
          <nav className="app-nav">{visibleLinks.map(link => <Link key={link.href} href={link.href} className={pathname === link.href ? "app-nav-link active" : "app-nav-link"}><Glyph name={link.icon}/><span>{link.label}</span></Link>)}</nav>
          <div className="sidebar-bottom"><div className="account-row"><button className="profile-button" type="button" onClick={() => router.push("/settings")} aria-label="Open profile settings"><span className="account-avatar">{initials}</span><span><b>{shop?.fullName}</b><small>{isOwner ? "Administrator" : "Sales staff"}</small></span></button><button aria-label="Sign out" onClick={() => void signOut()}><Glyph name="logout" size={16}/></button></div></div>
        </aside>

        <section className="app-content">
          <header className="app-topbar">
            <button className="workspace-menu-button" type="button" aria-label={mobileMenuOpen ? "Close workspace menu" : "Open workspace menu"} aria-expanded={mobileMenuOpen} aria-controls="workspace-drawer" onClick={() => setMobileMenuOpen(open => !open)}>
              <span/><span/><span/>
            </button>
            <div className="mobile-greeting">Hello, <b>{firstName}</b></div>
            <div className="topbar-title">{title}</div>
            <div className="topbar-right"><ThemeToggle compact/><button className="topbar-profile" type="button" onClick={() => router.push("/settings")} aria-label="Open profile settings"><span className="account-avatar">{initials}</span></button></div>
          </header>

          {mobileMenuOpen && <button className="workspace-drawer-backdrop" aria-label="Close workspace menu" onClick={() => setMobileMenuOpen(false)}/>}
          <aside id="workspace-drawer" className={mobileMenuOpen ? "workspace-drawer is-open" : "workspace-drawer"} role={mobileMenuOpen ? "dialog" : undefined} aria-modal={mobileMenuOpen || undefined} aria-label="Workspace navigation" aria-hidden={!mobileMenuOpen} inert={!mobileMenuOpen}>
            <div className="workspace-drawer-head"><Link href="/" className="app-logo" onClick={() => setMobileMenuOpen(false)}><Mark/><span>stockwise</span></Link><button type="button" autoFocus className="drawer-close" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>×</button></div>
            <div className="workspace-drawer-shop"><span className="workspace-avatar">{shop?.name.slice(0,1).toUpperCase()}</span><span><b>{shop?.name}</b><small>{isOwner ? "Administrator" : "Sales staff"}</small></span></div>
            <span className="sidebar-label">YOUR WORKSPACE</span>
            <nav className="drawer-nav" aria-label="Shop sections">
              <span className="drawer-section-label">SHOP WORKSPACE</span>
              {visibleLinks.map(link => <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className={pathname === link.href ? "drawer-link active" : "drawer-link"} aria-current={pathname === link.href ? "page" : undefined}><Glyph name={link.icon}/><span>{link.label}</span></Link>)}
            </nav>
            <div className="drawer-account">
              <button type="button" className="drawer-profile" onClick={() => { setMobileMenuOpen(false); router.push("/settings"); }}><span className="account-avatar">{initials}</span><span><b>{shop?.fullName}</b><small>{isOwner ? "Administrator · Settings" : "Sales staff · Settings"}</small></span><Glyph name="settings" size={17}/></button>
              <button type="button" className="drawer-signout" onClick={() => void signOut()}><Glyph name="logout" size={17}/> Sign out</button>
            </div>
          </aside>

          <main className="app-page">{restricted ? <section className="panel access-panel"><span className="eyebrow">ADMINISTRATOR AREA</span><h1>This section is for the shop owner.</h1><p>Your staff access includes stock, sales recording, and sales history.</p><Link className="button" href="/dashboard">Back to overview</Link></section> : children}</main>
        </section>
      </div>
    </AuthGate>
  );
}
