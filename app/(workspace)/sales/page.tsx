"use client";

import { useEffect, useState } from "react";
import { Glyph } from "@/components/brand";
import { money, Sale } from "@/lib/shop-model";
import { getShopContext, loadCloudSales } from "@/lib/cloud";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]); const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let alive = true;
    const refresh = async () => { try { const shop = await getShopContext(); if (!shop) throw new Error("No shop is linked to this account."); const rows = await loadCloudSales(shop.id); if (alive) { setSales(rows); setLoadError(""); } } catch (error) { if (alive) setLoadError(error instanceof Error ? error.message : "Could not load sales. Check your connection and try again."); } };
    const handle = () => void refresh(); void refresh(); window.addEventListener("stockwise:data", handle); window.addEventListener("online", handle);
    return () => { alive = false; window.removeEventListener("stockwise:data", handle); window.removeEventListener("online", handle); };
  }, []);
  return <><div className="page-heading"><div><span className="eyebrow">TRANSACTIONS</span><h1>Sales history</h1><p>Review the sales recorded by your shop.</p></div><span className="date-filter"><Glyph name="clock" size={16}/> All sales</span></div>{loadError && <p className="form-message" role="alert">{loadError}</p>}<section className="panel recent-panel sales-history-panel"><div className="panel-title"><div><h2>Recent transactions</h2><p>{sales.length} sales {sales.some(sale => !sale.synced) ? "including offline sales awaiting sync" : "recorded in this shop"}</p></div><span className="chart-period">MOST RECENT</span></div><div className="data-table"><div className="data-head"><span>SALE</span><span>ITEMS</span><span>DATE & TIME</span><span>PAYMENT</span><span>RECORDED BY</span><span>TOTAL</span></div>{sales.map((sale, index) => <div className="data-row" key={`${sale.id}-${index}`}><b className="sale-id">{sale.id}</b><span>{sale.lines.reduce((count, line) => count + line.quantity, 0)} items</span><span>{new Date(sale.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span><span><i className="payment-dot"/>{sale.payment}{!sale.synced && <small className="pending-tag">Pending sync</small>}</span><span className="sale-seller">{sale.seller || "Staff member"}</span><b>{money(sale.total)}</b></div>)}{!sales.length && <div className="empty-panel">No sales recorded yet. Your completed sales will show here.</div>}</div></section></>;
}
