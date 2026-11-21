"use client";

import { useEffect, useMemo, useState } from "react";
import { Glyph } from "@/components/brand";
import { getShopContext, loadCloudSales } from "@/lib/cloud";
import { money, Sale } from "@/lib/shop-model";

export default function PerformancePage() {
  const [sales, setSales] = useState<Sale[]>([]); const [loadError, setLoadError] = useState("");
  useEffect(() => { let alive = true; void getShopContext().then(async shop => { if (!shop) throw new Error("No shop is linked to this account."); if (shop.role !== "owner") throw new Error("Performance reports are for administrators."); const rows = await loadCloudSales(shop.id); if (alive) { setSales(rows); setLoadError(""); } }).catch(error => { if (alive) setLoadError(error instanceof Error ? error.message : "Could not load sales performance."); }); return () => { alive = false; }; }, []);
  const performance = useMemo(() => {
    const byProduct = new Map<string, { name: string; units: number; revenue: number }>();
    for (const sale of sales.filter(row => row.synced)) for (const line of sale.lines) {
      const item = byProduct.get(line.productId) || { name: line.name, units: 0, revenue: 0 };
      item.units += line.quantity; item.revenue += line.quantity * line.unitPrice; byProduct.set(line.productId, item);
    }
    return [...byProduct.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue);
  }, [sales]);
  const soldUnits = performance.reduce((sum, product) => sum + product.units, 0);
  const recordedRevenue = sales.filter(sale => sale.synced).reduce((sum, sale) => sum + sale.total, 0);
  const best = performance[0]; const highestRevenue = Math.max(1, ...performance.map(product => product.revenue));
  return <><div className="page-heading"><div><span className="eyebrow">SHOP PERFORMANCE</span><h1>What’s moving?</h1><p>See which products are earning their shelf space.</p></div><span className="date-filter"><Glyph name="sales" size={16}/> Last 100 sales</span></div>{loadError && <p className="form-message" role="alert">{loadError}</p>}<section className="performance-lead"><div className="performance-feature"><span className="performance-kicker">BEST SELLER BY UNITS</span><div className="performance-rank">01</div><div><h2>{best?.name || "Your first sale is waiting"}</h2><p>{best ? `${best.units} units moved across recorded transactions.` : "Record sales to see which products customers reach for."}</p></div><span className="performance-medal"><Glyph name="products" size={24}/></span></div><div className="performance-stats"><article><span>Sales reviewed</span><b>{sales.filter(sale => sale.synced).length}</b><small>Most recent transactions</small></article><article><span>Units moved</span><b>{soldUnits}</b><small>Across tracked products</small></article><article><span>Recorded revenue</span><b>{money(recordedRevenue)}</b><small>From those sales</small></article></div></section><section className="panel performance-panel"><div className="panel-title"><div><h2>Products customers choose</h2><p>Ranked by quantity sold. Revenue shows what each item brought in.</p></div><span className="performance-kicker">TOP PERFORMERS</span></div>{performance.length ? <div className="performance-list">{performance.slice(0, 8).map((product, index) => <article className="performance-row" key={product.name}><span className="performance-index">{String(index + 1).padStart(2, "0")}</span><span className="performance-product"><b>{product.name}</b><span className="performance-bar"><i style={{ width: `${Math.max(5, product.revenue / highestRevenue * 100)}%` }}/></span></span><span className="performance-units"><b>{product.units}</b><small>units</small></span><span className="performance-revenue"><b>{money(product.revenue)}</b><small>sales value</small></span></article>)}</div> : <div className="performance-empty"><Glyph name="sales" size={25}/><b>No sales to compare yet</b><span>Complete a sale and your best-moving products will appear here.</span></div>}</section><p className="performance-footnote">Counts include synced sales in your most recent 100 transactions. Offline sales appear after they sync.</p></>;
}
