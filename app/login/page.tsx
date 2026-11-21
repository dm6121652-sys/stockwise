"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Mark } from "@/components/brand";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(""); setBusy(true);
    const supabase = getSupabase();
    if (!supabase) { setMessage("Account sign-in will be available when the shop’s secure account service is connected."); setBusy(false); return; }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setMessage(error.message); setBusy(false); return; }
      if (!data.session) { setMessage("Sign-in completed without a session. Please try again."); setBusy(false); return; }
      window.location.assign("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn’t reach the sign-in service. Check your connection and try again.");
      setBusy(false);
    }
  }
  return <main className="auth-layout"><aside className="auth-aside"><Link href="/" className="auth-brand"><Mark/><span>stockwise</span></Link><div className="auth-quote"><div className="auth-rule"/><h1>A little more clarity, every day.</h1><p>Keep your stock, sales, and team in order. Even when the network isn’t.</p><span className="auth-shop-label">BUILT FOR INDEPENDENT SHOPS</span></div><span className="auth-aside-foot">© 2026 Stockwise</span></aside><section className="auth-main"><div className="auth-form-wrap"><span className="auth-mobile-logo"><Mark/> stockwise</span><div className="auth-heading"><span className="eyebrow">WELCOME BACK</span><h2>Sign in to your shop</h2><p>Use the email and password linked to your account.</p></div><form onSubmit={submit} className="auth-form"><label>Email address<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourshop.com"/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/></label><button className="button auth-submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}<span>→</span></button>{message && <p className="form-message" role="alert">{message}</p>}</form><div className="auth-divider"><span>NEW TO STOCKWISE?</span></div><Link className="outline-button" href="/signup">Create an owner account</Link><p className="auth-legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p></div></section></main>;
}
