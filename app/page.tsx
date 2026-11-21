"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import GlobeStudy from "@/components/globe-study";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return diagonal ? (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 10h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/></>,
    chart: <><path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 6-7"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1H3Zm13-9a3 3 0 1 0-1-5.8M18 14a5 5 0 0 1 3 4.6v1.4h-3"/></>,
    signal: <><path d="M3 9a13 13 0 0 1 18 0M6.5 12.5a8 8 0 0 1 11 0M10 16a3 3 0 0 1 4 0"/><path d="M12 20h.01"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const products = [
  { name: "Golden Penny Pasta", category: "Groceries · 400g", qty: 34, price: "₦1,250", tone: "gold", initials: "GP" },
  { name: "Peak Milk Sachet", category: "Dairy · 16g", qty: 8, price: "₦150", tone: "blue", initials: "PM" },
  { name: "Power Oil", category: "Cooking oil · 1L", qty: 3, price: "₦3,800", tone: "green", initials: "PO" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDemo, setActiveDemo] = useState<"today" | "stock" | "staff">("today");
  const [navState, setNavState] = useState<"top" | "shown" | "hidden">("top");
  const [typedBrand, setTypedBrand] = useState("Stockwise");

  useEffect(() => {
    let lastY = window.scrollY;
    let travel = 0;
    let direction = 0;
    const handleScroll = () => {
      const nextY = window.scrollY;
      const delta = nextY - lastY;
      lastY = nextY;
      if (nextY < 90) {
        travel = 0;
        direction = 0;
        setNavState("top");
        return;
      }
      if (Math.abs(delta) < 2) return;
      const nextDirection = delta > 0 ? 1 : -1;
      if (nextDirection !== direction) travel = 0;
      direction = nextDirection;
      travel += delta;
      if (direction > 0 && travel > 18) setNavState("hidden");
      if (direction < 0 && travel < -16) setNavState("shown");
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const word = "Stockwise";
    let current = word;
    let timer: ReturnType<typeof setTimeout>;
    const write = () => {
      if (current.length < word.length) {
        current = word.slice(0, current.length + 1);
        setTypedBrand(current);
        timer = setTimeout(write, 115);
      } else timer = setTimeout(erase, 2500);
    };
    const erase = () => {
      if (current.length > 0) {
        current = current.slice(0, -1);
        setTypedBrand(current);
        timer = setTimeout(erase, 72);
      } else timer = setTimeout(write, 500);
    };
    timer = setTimeout(erase, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main>
      <header className={`site-header${navState === "top" ? "" : " site-header-floating"}${navState === "hidden" ? " is-hidden" : ""}`}>
        <a className="brand" href="#top" aria-label="Stockwise home"><Mark /><span>stockwise</span></a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen}>
          <span /><span />
        </button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#offline" onClick={() => setMenuOpen(false)}>Offline mode</a>
        </nav>
        <div className="nav-actions"><ThemeToggle compact/><Link className="login-link" href="/login">Log in</Link><Link className="button button-small" href="/signup">Get started</Link></div>
      </header>

      <section className="hero section-wrap" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> FOR THE PEOPLE BEHIND THE COUNTER</div>
          <h1><span className="hero-line hero-line-one">Your shop moves fast.</span><br /><span className="hero-line hero-line-two"><span className="hero-typewriter" aria-hidden="true">{typedBrand}</span><span className="sr-only">Stockwise</span> keeps up.</span></h1>
          <p className="hero-description">Record each item in a sale. Watch the shelf count update. See what needs topping up before it’s gone. Internet drops? Keep selling; Stockwise catches up when you’re back.</p>
          <div className="hero-actions"><Link href="/signup" className="button">Set up your shop</Link><a href="#how-it-works" className="text-link">Take a quick look</a></div>
          <div className="hero-note"><span className="avatar-stack"><i>O</i><i>A</i><i>K</i></span><span>Made for the people who keep shops running.</span></div>
        </div>
        <div className="hero-visual" aria-label="Preview of the Stockwise inventory dashboard">
          <div className="app-window">
            <aside className="mock-sidebar"><div className="mock-brand"><Mark /><span>stockwise</span></div><div className="mock-shop"><span className="shop-avatar">M</span><span><b>Mama T’s Store</b><small>Owner account</small></span><span className="chevron">⌄</span></div>
              <div className="mock-nav-label">WORKSPACE</div><div className="mock-nav active"><Icon name="chart"/> Overview</div><div className="mock-nav"><Icon name="box"/> Products</div><div className="mock-nav"><Icon name="chart"/> Sales</div><div className="mock-nav"><Icon name="people"/> Team</div>
              <div className="mock-sidebar-bottom"><div className="sync-indicator"><i /> All changes synced</div><div className="mock-user"><span className="user-avatar">AT</span><span><b>Amara T.</b><small>Shop owner</small></span><span className="dots">•••</span></div></div>
            </aside>
            <div className="mock-main"><div className="mock-topbar"><span>Good morning, Amara</span><span className="today-label"><Icon name="clock" /> Today, 20 Nov</span></div>
              <div className="mock-title-row"><div><h3>Your shop at a glance</h3><p>Here’s what’s happening today.</p></div><button className="mock-sale-button"><Icon name="plus"/> <span>Record a sale</span></button></div>
              <div className="metric-grid"><div className="metric-card"><span>Today’s sales</span><strong>₦186,400</strong><small className="positive">↗ 12.8% <em>vs yesterday</em></small><div className="sparkline"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div><div className="metric-card"><span>Items sold</span><strong>42</strong><small className="subtle">Across 18 transactions</small><div className="metric-icon teal"><Icon name="chart" /></div></div><div className="metric-card"><span>Low stock</span><strong>3 <small>items</small></strong><small className="warning-text">Need your attention</small><div className="metric-icon amber"><Icon name="box" /></div></div></div>
              <div className="stock-panel"><div className="panel-heading"><div><h4>Stock to watch</h4><p>A few items are running low.</p></div><a href="#features">View all <Arrow /></a></div><div className="stock-table"><div className="stock-head"><span>PRODUCT</span><span>IN STOCK</span><span>SELLING PRICE</span></div>{products.map((product) => <div className="stock-row" key={product.name}><div className="product-cell"><span className={`product-icon ${product.tone}`}>{product.initials}</span><span><b>{product.name}</b><small>{product.category}</small></span></div><span className={product.qty < 10 ? "qty-low" : "qty-normal"}>{product.qty} <small>left</small></span><span className="price-cell">{product.price}</span></div>)}</div></div>
            </div>
          </div>
          <div className="float-card float-sync"><span className="sync-badge"><Icon name="check" /></span><span><b>You’re all caught up</b><small>Sales synced just now</small></span></div>
          <div className="float-card float-alert"><span className="alert-badge">!</span><span><b>Stock running low</b><small>Power Oil · 3 left</small></span><span className="alert-arrow"><Arrow diagonal /></span></div>
        </div>
      </section>

      <section className="trust-strip"><div className="section-wrap trust-inner"><span>ONE SIMPLE TOOL FOR YOUR EVERYDAY</span><div><span><Icon name="box" /> Inventory</span><span><Icon name="chart" /> Sales</span><span><Icon name="people" /> Your team</span><span><Icon name="signal" /> Offline mode</span></div></div></section>

      <section className="feature-showcase section-wrap" id="features">
        <div className="showcase-heading"><div><div className="eyebrow">ONE CLEAR VIEW OF YOUR SHOP</div><h2>From the counter<br /><span>to the stockroom.</span></h2></div><p>Sales, shelves and staff actions live together. Tap around the preview to see how the day comes together.</p></div>
        <div className="demo-window">
          <div className="demo-window-bar"><span className="window-dots"><i/><i/><i/></span><span className="demo-address">stockwise / mama-ts-store</span><span className="demo-online"><i/> SHOP OPEN</span></div>
          <div className="demo-layout">
            <aside className="demo-sidebar"><div className="demo-brand"><Mark/><span>stockwise</span></div><span className="demo-nav-caption">YOUR SHOP</span>
              <button className={activeDemo==="today"?"demo-nav selected":"demo-nav"} onClick={()=>setActiveDemo("today")}><i className="demo-nav-mark mark-today"/>Today</button>
              <button className={activeDemo==="stock"?"demo-nav selected":"demo-nav"} onClick={()=>setActiveDemo("stock")}><i className="demo-nav-mark mark-stock"/>Stockroom<span className="nav-counter">3</span></button>
              <button className={activeDemo==="staff"?"demo-nav selected":"demo-nav"} onClick={()=>setActiveDemo("staff")}><i className="demo-nav-mark mark-staff"/>The team</button>
              <div className="demo-sidebar-bottom"><span className="demo-avatar">AT</span><span><b>Amara’s shop</b><small>Owner view</small></span></div>
            </aside>
            <div className="demo-center">
              <div className="demo-page-head"><div><span className="demo-date">THURSDAY · 20 NOVEMBER</span><h3>{activeDemo==="today"?"A good day at the counter.":activeDemo==="stock"?"Here’s what’s on the shelf.":"Everyone knows their part."}</h3><p>{activeDemo==="today"?"Sales are moving. Here’s the latest.":activeDemo==="stock"?"A quick count, without walking every aisle.":"Staff can sell. You stay in control."}</p></div><span className="demo-streak">DAY 05 <b>IN A ROW</b></span></div>
              {activeDemo==="today"&&<div className="demo-today-view"><article className="demo-focus-card"><div className="demo-card-meta"><span>SALES SO FAR</span><span>VIEW 04 / 25</span></div><div className="demo-sale-focus"><small>THE COUNTER</small><strong>₦186,400</strong><span>42 items · 18 sales</span></div><div className="demo-latest-sale"><span className="receipt-mark">04</span><span><b>Golden Penny Pasta</b><small>2 sold · just now</small></span><strong>−2 <i>on shelf</i></strong></div><Link href="/signup" className="demo-action">See what else Stockwise does <Arrow/></Link></article><aside className="demo-weekly"><span className="demo-side-label">A STEADY WEEK</span><div className="week-dots">{["M","T","W","T","F","S","S"].map((d,i)=><span key={`${d}-${i}`} className={i<5?"week-day done":"week-day"}><i>{i<5?"✓":""}</i><small>{d}</small></span>)}</div><div className="week-divider"/><span className="demo-side-label">SELLING TODAY</span><div className="mini-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><small className="bars-caption">A little busier than yesterday</small></aside></div>}
              {activeDemo==="stock"&&<div className="demo-stock-view"><div className="demo-stock-banner"><span>3 ITEMS NEED A TOP-UP</span><b>Before the shelf is empty.</b></div>{products.map((product,index)=><div className="demo-stock-item" key={product.name}><span className="demo-stock-number">0{index+1}</span><span className={`demo-product-tag ${product.tone}`}>{product.initials}</span><span className="demo-stock-name"><b>{product.name}</b><small>{product.category}</small></span><span className={product.qty<10?"demo-stock-qty urgent":"demo-stock-qty"}>{product.qty}<small>left</small></span><span className="demo-stock-line"><i style={{width:`${Math.max(10,product.qty/34*100)}%`}}/></span></div>)}</div>}
              {activeDemo==="staff"&&<div className="demo-staff-view"><div className="staff-shift-head"><span>ON SHIFT</span><b>3 people</b></div><div className="staff-person"><span className="staff-initials initial-a">AT</span><span><b>Amara Thomas</b><small>Shop owner · full access</small></span><span className="owner-tag">OWNER</span></div><div className="staff-person"><span className="staff-initials initial-b">JK</span><span><b>Joy Kalu</b><small>Sales · checkout access</small></span><span className="staff-online"><i/>At the counter</span></div><div className="staff-person"><span className="staff-initials initial-c">MO</span><span><b>Musa Okafor</b><small>Sales · checkout access</small></span><span className="staff-online"><i/>On shift</span></div><p className="staff-footnote">Every sale has a name and a time attached.</p></div>}
            </div>
          </div>
        </div>
      </section>

      <section className="reach-section" aria-labelledby="reach-title">
        <div className="section-wrap reach-inner">
          <div className="reach-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> FOR SMALL SHOPS, EVERYWHERE</div>
            <h2 id="reach-title">Your shop.<br /><span>Wherever you are.</span></h2>
            <p>From a neighborhood counter to the other side of the world, Stockwise helps small business owners keep stock and sales in reach. When a connection drops, sales stay on the device until it returns.</p>
          </div>
          <div className="reach-globe" role="img" aria-label="A rotating globe with country markers for Nigeria, Kenya, the United Kingdom, India, and Brazil">
            <GlobeStudy background="transparent" baseColor="#e3cbb4" phrase="SMALLSHOPS·EVERYWHERE·STOCKWISE·" density={66} speed={30} hover={45} globe={{ drift: 55, radius: 140 }} pointer={{ pins: 0, zoom: 35, light: 25 }} places={[{ name: "NIGERIA", lat: 9.08, lon: 8.68 }, { name: "KENYA", lat: 0.1, lon: 37.9 }, { name: "UNITED KINGDOM", lat: 55, lon: -3 }, { name: "INDIA", lat: 20, lon: 78.9 }, { name: "BRAZIL", lat: -14, lon: -51.9 }]} />
          </div>
          <div className="reach-points">
            <div><span>01</span><p><b>Work from where you are</b><small>Check the shop from the counter or while you’re away.</small></p></div>
            <div><span>02</span><p><b>Keep going when service drops</b><small>Record sales offline and sync again when you’re connected.</small></p></div>
          </div>
          <span className="globe-caption"><i/> MADE FOR SMALL SHOPS, WORLDWIDE</span>
        </div>
      </section>

      <section className="offline-section" id="offline"><div className="section-wrap offline-inner"><div className="offline-copy"><div className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> BUILT FOR REAL SHOP DAYS</div><h2>The network drops.<br /><span>Your shop doesn’t.</span></h2><p>Keep recording sales if your connection goes down. Stockwise keeps them safe on your device and syncs them when you’re back online, so your day can keep moving.</p><div className="offline-points"><div><span><Icon name="check" /></span> Sales saved safely on your device</div><div><span><Icon name="check" /></span> Stock updates when you reconnect</div></div></div>
          <div className="offline-visual"><div className="offline-card"><div className="offline-card-head"><span className="offline-brand"><Mark /> Stockwise</span><span className="offline-status"><i /> Offline mode</span></div><div className="offline-card-title"><span>Sale recorded</span><b>Just now</b></div><div className="offline-item"><span className="offline-item-icon">GP</span><span><b>Golden Penny Pasta</b><small>2 × ₦1,250</small></span><strong>₦2,500</strong></div><div className="offline-total"><span>Total</span><b>₦2,500</b></div><div className="offline-queued"><span>↗</span> Saved on this device <i>Will sync when online</i></div></div><div className="offline-orbit orbit-one"/><div className="offline-orbit orbit-two"/></div>
        </div></section>

      <section className="sale-flow-section section-wrap" id="how-it-works"><div className="flow-heading"><div><div className="eyebrow">ONE SALE. EVERYTHING UPDATED.</div><h2>Sell a couple.<br/><span>The shelf count follows.</span></h2><p>No end-of-day maths. No sticky note to remember later. Each item sale keeps the stock count honest.</p><a href="/signup" className="text-link">Put your shop in order <Arrow/></a></div><div className="flow-total"><span>SALE TOTAL</span><strong>₦3,100</strong><small>Cash · just now</small></div></div>
        <div className="sale-flow"><div className="flow-progress"><i/></div><article className="flow-beat beat-stock"><span className="beat-number">01</span><span className="beat-label">ON THE SHELF</span><div className="beat-product"><span className="beat-product-mark">GP</span><span><b>Golden Penny Pasta</b><small>Before checkout</small></span><strong>34 <small>in stock</small></strong></div><p>You start with a clear count.</p></article><article className="flow-beat beat-sale"><span className="beat-number">02</span><span className="beat-label">AT THE COUNTER</span><div className="sale-ticket"><div><span>Golden Penny Pasta</span><b>2 × ₦1,250</b></div><div><span>Peak Milk Sachet</span><b>4 × ₦150</b></div><div className="ticket-divider"/><div className="ticket-total"><span>Total</span><b>₦3,100</b></div></div><p>Tap the items the customer picked.</p></article><article className="flow-beat beat-update"><span className="beat-number">03</span><span className="beat-label">BACK ON THE SHELF</span><div className="updated-count"><span>Golden Penny Pasta</span><strong>32 <small>left</small></strong><i>−2 sold</i></div><div className="flow-alert"><i/><span><b>Milk is running low</b><small>8 left · add it to your next order</small></span></div><p>Counts change. Low stock gets flagged.</p></article></div>
      </section>

      <section className="cta-section section-wrap" id="get-started"><div className="cta-box"><div className="cta-mark"><Mark /></div><div className="cta-copy"><div className="eyebrow eyebrow-light">A BETTER WAY TO KEEP TRACK</div><h2>Make room for the good part of running a shop.</h2><p>Start with your products. We’ll help you keep everything else in order.</p></div><Link href="/signup" className="button button-white">Create your account</Link><div className="cta-decoration cta-decoration-one"/><div className="cta-decoration cta-decoration-two"/></div></section>

      <footer className="site-footer section-wrap"><a className="brand footer-brand" href="#top"><Mark /><span>stockwise</span></a><span className="footer-note">A little more clarity, every day.</span><div className="footer-links"><a href="#features">Features</a><a href="#offline">Offline mode</a><a href="mailto:hello@stockwise.app">Contact</a></div><span className="copyright">© 2026 Stockwise</span></footer>
    </main>
  );
}
