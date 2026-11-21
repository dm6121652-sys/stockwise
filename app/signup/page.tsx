"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Glyph, Mark } from "@/components/brand";
import { getSupabase } from "@/lib/supabase";

type AccountType = "owner" | "staff";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const supabase = getSupabase();
    if (!supabase) {
      setMessage("Account storage is not connected yet. Add your Supabase project settings and restart Stockwise.");
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          shop_name: accountType === "owner" ? shop : "",
          invite_code: accountType === "staff" ? inviteCode.trim() : "",
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    if (data.session) router.replace("/dashboard");
    else setMessage("Check your email to confirm your account, then sign in to finish setting up your shop.");
    setBusy(false);
  }

  return (
    <main className="auth-layout">
      <aside className="auth-aside">
        <Link href="/" className="auth-brand"><Mark/><span>stockwise</span></Link>
        <div className="auth-quote">
          <div className="auth-rule"/>
          <h1>Start with the essentials.</h1>
          <p>Set up your shop once. Then let every sale keep your stock up to date.</p>
          <span className="auth-shop-label">A CLEAR START FOR YOUR SHOP</span>
        </div>
        <span className="auth-aside-foot">© 2026 Stockwise</span>
      </aside>

      <section className="auth-main">
        <div className="auth-form-wrap">
          <span className="auth-mobile-logo"><Mark/> stockwise</span>
          <div className="auth-heading">
            <span className="eyebrow">GET STARTED</span>
            <h2>{accountType === "owner" ? "Let’s get your shop in order." : "Join your shop team."}</h2>
            <p>{accountType === "owner" ? "A few details now. A clearer view of your shop next." : "Enter the invite code your shop owner shared with you."}</p>
          </div>

          <div className="account-switch" role="group" aria-label="Choose account type">
            <button type="button" aria-pressed={accountType === "owner"} className={accountType === "owner" ? "selected" : ""} onClick={() => setAccountType("owner")}>
              <Glyph name="overview" size={16}/> Owner
            </button>
            <button type="button" aria-pressed={accountType === "staff"} className={accountType === "staff" ? "selected" : ""} onClick={() => setAccountType("staff")}>
              <Glyph name="team" size={16}/> Staff
            </button>
          </div>

          <form onSubmit={submit} className="auth-form">
            <label>Your name<input required value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Amara Thomas" autoComplete="name"/></label>
            {accountType === "owner" ? (
              <label>Shop name<input required value={shop} onChange={event => setShop(event.target.value)} placeholder="e.g. Mama T’s Store"/></label>
            ) : (
              <label>Shop invite code<input required value={inviteCode} onChange={event => setInviteCode(event.target.value)} placeholder="Paste the code from your owner" autoComplete="off"/></label>
            )}
            <label>Email address<input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@yourshop.com" autoComplete="email"/></label>
            <label>Password<input type="password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password"/></label>
            <button className="button auth-submit" disabled={busy}>
              {busy ? "Creating account…" : accountType === "owner" ? "Create account" : "Join the shop"}
            </button>
            {message && <p className="form-message" role="status">{message}</p>}
          </form>

          <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
          <p className="auth-legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
        </div>
      </section>
    </main>
  );
}
