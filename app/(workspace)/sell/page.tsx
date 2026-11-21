"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Glyph } from "@/components/brand";
import { money, Product, SaleLine, saleNumber } from "@/lib/shop-model";
import { cacheCloudProducts, getShopContext, loadCloudProducts, PendingSale, queueSale, recordCloudSale, syncOutbox } from "@/lib/cloud";

export default function SellPage() {
  const [products, setProducts] = useState<Product[]>([]); const [cart, setCart] = useState<Record<string, number>>({}); const [search, setSearch] = useState(""); const [payment, setPayment] = useState("Cash"); const [message, setMessage] = useState(""); const [online, setOnline] = useState(true);const[loadError,setLoadError]=useState("");
  const [shopId,setShopId]=useState("");
  const [sellerName,setSellerName]=useState("");
  useEffect(() => { let alive=true; const refresh=async()=>{try{const shop=await getShopContext();if(!shop)throw new Error("No shop is linked to this account.");if(navigator.onLine)await syncOutbox(shop.id);const rows=await loadCloudProducts(shop.id);if(alive){setShopId(shop.id);setSellerName(shop.fullName);setProducts(rows);setLoadError("")}}catch(error){if(alive)setLoadError(error instanceof Error?error.message:"Could not load products. Check your connection and try again.")}};const status=()=>{setOnline(navigator.onLine);if(navigator.onLine)void refresh()};void refresh();window.addEventListener("online",status);window.addEventListener("offline",status);return()=>{alive=false;window.removeEventListener("online",status);window.removeEventListener("offline",status)}; }, []);
  const filtered = useMemo(() => products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const lines: SaleLine[] = Object.entries(cart).map(([id, quantity]) => { const p = products.find(item => item.id === id)!; return { productId: id, name: p.name, quantity, unitPrice: p.price }; });
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  function change(product: Product, delta: number) { setCart(current => { const count = Math.max(0, Math.min(product.stock, (current[product.id] || 0) + delta)); const next = { ...current }; if (count) next[product.id] = count; else delete next[product.id]; return next; }); setMessage(""); }
  async function checkout() {
    if (!lines.length) return;
    if (!shopId) { setMessage("Your shop is still loading. Please try again in a moment."); return; }
    const createdAt = new Date().toISOString(); const saleId = saleNumber();
      const queued: PendingSale = { reference: crypto.randomUUID(), shopId, payment, createdAt, createdByName: sellerName, lines: lines.map(line => ({ productId: line.productId, quantity: line.quantity, name: line.name, unitPrice: line.unitPrice })) };
      if (online) {
        try { await recordCloudSale(queued); setProducts(await loadCloudProducts(shopId)); setMessage(`Sale ${saleId} recorded.`); }
        catch (error) {
          if (!navigator.onLine || error instanceof TypeError) {
            queueSale(queued); const local=products.map(p=>({...p,stock:p.stock-(cart[p.id]||0)}));cacheCloudProducts(shopId,local);setProducts(local);setMessage(`Sale ${saleId} saved on this device. It will sync when you reconnect.`);
          } else { setMessage(error instanceof Error?error.message:"Could not complete this sale. Please retry."); return; }
        }
      } else {
        queueSale(queued);const local=products.map(p=>({...p,stock:p.stock-(cart[p.id]||0)}));cacheCloudProducts(shopId,local);setProducts(local);setMessage(`Sale ${saleId} saved on this device. It will sync when you reconnect.`);
      }
    setCart({});
  }
  return <><div className="page-heading sell-heading"><div><span className="eyebrow">CHECKOUT</span><h1>Record a sale</h1><p>Add each item to the sale. Stock updates when you complete checkout.</p></div><Link href="/dashboard" className="quiet-link">Back to overview</Link></div>{loadError&&<p className="form-message" role="alert">{loadError}</p>}<div className="checkout-layout"><section className="panel product-picker"><div className="picker-top"><div><h2>Choose products</h2><p>{products.filter(p=>p.stock>0).length} products available</p></div><label className="search-field"><Glyph name="search" size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products" aria-label="Search products"/></label></div><div className="picker-grid">{filtered.map(product=><button className="pick-product" key={product.id} onClick={()=>change(product,1)} disabled={!product.stock}><span className="pick-monogram">{product.name.slice(0,2).toUpperCase()}</span><b>{product.name}</b><small>{product.stock} in stock</small><strong>{money(product.price)}</strong><span className="pick-add"><Glyph name="plus" size={16}/></span></button>)}</div>{!filtered.length&&<div className="empty-panel">No products match that search.</div>}</section><aside className="panel cart-panel"><div className="cart-heading"><div><h2>Current sale</h2><p>{lines.reduce((n,line)=>n+line.quantity,0)} items</p></div><span className={online?"tiny-online":"tiny-offline"}><i/>{online?"Online":"Offline"}</span></div><div className="cart-items">{lines.map(line=><div className="cart-line" key={line.productId}><div><b>{line.name}</b><small>{money(line.unitPrice)} each</small><div className="quantity-control"><button onClick={()=>change(products.find(p=>p.id===line.productId)!, -1)} aria-label={`Remove one ${line.name}`}>−</button><span>{line.quantity}</span><button onClick={()=>change(products.find(p=>p.id===line.productId)!, 1)} aria-label={`Add one ${line.name}`}>+</button></div></div><strong>{money(line.quantity*line.unitPrice)}</strong></div>)}{!lines.length&&<div className="cart-empty"><Glyph name="products" size={23}/><b>Your sale is empty</b><span>Choose products to add them here.</span></div>}</div><div className="cart-bottom"><label className="payment-select">Payment method<select value={payment} onChange={e=>setPayment(e.target.value)}><option>Cash</option><option>Transfer</option><option>Card</option><option>Other</option></select></label><div className="cart-total"><span>Total</span><b>{money(total)}</b></div><button className="button checkout-button" onClick={()=>void checkout()} disabled={!lines.length}>Complete sale <Glyph name="arrow" size={17}/></button>{message&&<p className="checkout-message" role="status">{message}</p>}<p className="offline-note">{online?"Sales save to your shop here and sync when you reconnect.":"Sale is saved on this device and queues to sync when you reconnect."}</p></div></aside></div></>;
}
