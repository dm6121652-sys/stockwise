export function Mark({ className = "" }: { className?: string }) {
  return <img className={`brand-mark ${className}`} src="/stockwise-emblem.png" alt="" aria-hidden="true"/>;
}

export function Glyph({ name, size = 18 }: { name: "overview" | "products" | "sales" | "team" | "settings" | "logout" | "search" | "arrow" | "plus" | "box" | "clock" | "sun" | "moon"; size?: number }) {
  const shapes: Record<string, React.ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    products: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/></>,
    sales: <><path d="M4 19V5m0 14h16"/><path d="m7 15 4-4 3 2 6-7"/></>,
    team: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1H3Zm13-9a3 3 0 1 0-1-5.8M18 14a5 5 0 0 1 3 4.6V20h-3"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1.9-1.1 1.9-1.4-.5a8 8 0 0 1-1.5.9l-.3 1.5h-2.2l-.3-1.5a8 8 0 0 1-1.5-.9l-1.4.5-1.1-1.9 1.1-.9a8 8 0 0 1 0-1.8l-1.1-.9 1.1-1.9 1.4.5a8 8 0 0 1 1.5-.9l.3-1.5h2.2l.3 1.5a8 8 0 0 1 1.5.9l1.4-.5 1.1 1.9-1.1.9a8 8 0 0 1-.1 1.7Z" transform="translate(-1 -1) scale(.94)"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    moon: <path d="M20.8 13A8.5 8.5 0 0 1 11 3.2 8.5 8.5 0 1 0 20.8 13Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
