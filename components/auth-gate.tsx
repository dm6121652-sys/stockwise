"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { Mark } from "@/components/brand";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "error" | "unconfigured">("checking");
  useEffect(() => {
    let alive = true;
    const supabase = getSupabase();
    if (!supabase) { setStatus("unconfigured"); return; }
    const timeout = window.setTimeout(() => {
      if (alive) setStatus("error");
    }, 12000);
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      window.clearTimeout(timeout);
      if (error || !data.session) router.replace("/login");
      else setStatus("ready");
    }).catch(() => {
      if (!alive) return;
      window.clearTimeout(timeout);
      router.replace("/login");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive && !session) router.replace("/login");
    });
    return () => { alive = false; window.clearTimeout(timeout); listener.subscription.unsubscribe(); };
  }, [router]);
  if (status === "checking") return <div className="loading-screen"><Mark /><span>Opening your shop…</span></div>;
  if (status === "unconfigured") return <div className="loading-screen"><Mark /><span>Shop data is not connected.</span><span>Set the Supabase project URL and public key, then restart Stockwise.</span><Link className="preview-link" href="/login">Go to sign in</Link></div>;
  if (status === "error") return <div className="loading-screen"><Mark /><span>Your shop is taking longer to open.</span><span>Refresh to retry, or sign in again.</span><button className="outline-button" onClick={() => window.location.reload()}>Refresh dashboard</button><Link className="preview-link" href="/login">Back to sign in</Link></div>;
  return <>{children}</>;
}
