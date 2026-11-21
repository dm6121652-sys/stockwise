import { getSupabase } from "@/lib/supabase";
import { Product, Sale } from "@/lib/shop-model";

export type ShopContext = { id: string; name: string; role: "owner" | "employee"; userId: string; fullName: string; email: string };
export type CloudInvite = { email: string; invite_code: string; created_at: string };
const OUTBOX_KEY = "stockwise.outbox.v1";
const SHOP_CACHE_KEY = "stockwise.shop-context.v1";
let shopContextMemory: ShopContext | null = null;
const productCacheKey = (shopId: string) => `stockwise.products.${shopId}.v1`;
const salesCacheKey = (shopId: string) => `stockwise.sales.${shopId}.v1`;

export function cloudErrorMessage(error: unknown, fallback: string): string {
  const detail = error && typeof error === "object" ? error as { message?: unknown; code?: unknown; status?: unknown } : null;
  const message = typeof detail?.message === "string" ? detail.message : error instanceof Error ? error.message : "";
  const code = String(detail?.code || "");
  if (["PGRST205", "PGRST202", "42P01"].includes(code) || /schema cache|could not find the table|function .* does not exist/i.test(message)) {
    return "The Stockwise tables or functions are missing from this Supabase project. Run the SQL migration in supabase/migrations/202611200001_stockwise_core.sql in the project’s SQL Editor, then try again.";
  }
  if (code === "23503" && /shop_memberships_user_id_fkey/i.test(message)) {
    return "Your account was created before Stockwise’s profile trigger. Run supabase/migrations/202611210001_backfill_profiles_for_existing_users.sql in the Supabase SQL Editor, then try again.";
  }
  if (detail?.status === 404 || /\b404\b|not found/i.test(message)) {
    return "Supabase returned 404 for the shop data. Check that the app’s Supabase URL points to the right project and that its Stockwise SQL migration has been run.";
  }
  if (/failed to fetch|network|fetch failed|load failed/i.test(message)) {
    return "Could not reach Supabase. Check your internet connection and the Supabase project URL, then try again.";
  }
  return message || fallback;
}

export function cacheCloudProducts(shopId:string,products:Product[]){window.localStorage.setItem(productCacheKey(shopId),JSON.stringify(products));}

export function getCachedShopContext() { return shopContextMemory; }
export function clearShopContext() { shopContextMemory = null; }

export async function getShopContext(forceRefresh = false): Promise<ShopContext | null> {
  if (!forceRefresh && shopContextMemory) return shopContextMemory;
  const supabase = getSupabase(); if (!supabase) return null;
  const { data: userData } = await supabase.auth.getSession(); const user = userData.session?.user;
  if (!user) return null;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    try { const cached=JSON.parse(window.localStorage.getItem(SHOP_CACHE_KEY)||"null") as ShopContext|null;if(cached?.userId===user.id){shopContextMemory=cached;return cached;} } catch {}
    return null;
  }
  const { data: memberships, error } = await supabase.from("shop_memberships").select("shop_id,role").eq("user_id", user.id).limit(1);
  if (error) throw new Error(cloudErrorMessage(error, "Could not load your shop membership."));
  let membership: { shop_id: string; role: "owner" | "employee" } | undefined = memberships?.[0];
  if (!membership) {
    const label = String(user.user_metadata?.shop_name || "My shop");
    const created = await (supabase as any).rpc("create_shop", { p_name: label });
    if (created.error) throw new Error(cloudErrorMessage(created.error, "Could not create your shop."));
    const { data } = await supabase.from("shop_memberships").select("shop_id,role").eq("user_id", user.id).limit(1);
    membership = data?.[0];
  }
  if (!membership) return null;
  const { data: shop, error: shopError } = await supabase.from("shops").select("id,name").eq("id", membership.shop_id).single();
  if (shopError) throw new Error(cloudErrorMessage(shopError, "Could not load your shop details."));
  const context={ id: shop.id, name: shop.name, role: membership.role as "owner"|"employee", userId: user.id, fullName: user.user_metadata?.full_name || user.email || "Shop member", email: user.email || "" };
  shopContextMemory=context;
  window.localStorage.setItem(SHOP_CACHE_KEY,JSON.stringify(context));
  return context;
}

export async function loadCloudProducts(shopId: string): Promise<Product[]> {
  const supabase = getSupabase()!;
  if(!navigator.onLine){try{return JSON.parse(window.localStorage.getItem(productCacheKey(shopId))||"[]") as Product[]}catch{return []}}
  const { data, error } = await supabase.from("products").select("id,name,category,price,stock,low_stock_threshold").eq("shop_id", shopId).eq("active", true).order("name");
  if (error) throw new Error(cloudErrorMessage(error, "Could not load products."));
  const products=(data || []).map(row => ({ id: row.id, name: row.name, category: row.category, price: Number(row.price), stock: row.stock, threshold: row.low_stock_threshold }));cacheCloudProducts(shopId,products);return products;
}

export async function loadCloudSales(shopId: string): Promise<Sale[]> {
  const supabase = getSupabase()!;
  if(!navigator.onLine){let cached:Sale[]=[];try{cached=JSON.parse(window.localStorage.getItem(salesCacheKey(shopId))||"[]")}catch{}return [...getOutbox().filter(sale=>sale.shopId===shopId).map(sale=>({id:`Pending-${sale.reference.slice(0,6)}`,createdAt:sale.createdAt,total:sale.lines.reduce((sum,line)=>sum+line.quantity*line.unitPrice,0),payment:sale.payment,synced:false,seller:sale.createdByName,lines:sale.lines.map(line=>({productId:line.productId,name:line.name,quantity:line.quantity,unitPrice:line.unitPrice}))})),...cached];}
  const { data, error } = await supabase.from("sales").select("id,client_reference,created_by,payment_method,total,created_at").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(cloudErrorMessage(error, "Could not load sales."));
  const ids = (data || []).map(row => row.id);
  const userIds = [...new Set((data || []).map(row => row.created_by).filter(Boolean))];
  const { data: profiles, error: profileError } = userIds.length ? await supabase.from("profiles").select("user_id,full_name,email").in("user_id", userIds) : { data: [], error: null };
  if (profileError) throw new Error(cloudErrorMessage(profileError, "Could not load the staff names for these sales."));
  const { data: items, error: itemError } = ids.length ? await supabase.from("sale_items").select("sale_id,product_id,product_name,quantity,unit_price").in("sale_id", ids) : { data: [], error: null };
  if (itemError) throw new Error(cloudErrorMessage(itemError, "Could not load sale items."));
  const complete = (data || []).map(row => { const seller = profiles?.find(profile => profile.user_id === row.created_by); return { id: row.id.slice(0, 8).toUpperCase(), createdAt: row.created_at, total: Number(row.total), payment: row.payment_method[0].toUpperCase() + row.payment_method.slice(1), synced: true, seller: seller?.full_name || seller?.email || "Staff member", lines: (items || []).filter(item => item.sale_id === row.id).map(item => ({ productId: item.product_id, name: item.product_name, quantity: item.quantity, unitPrice: Number(item.unit_price) })) }; });
  window.localStorage.setItem(salesCacheKey(shopId),JSON.stringify(complete));
  const queued = getOutbox().filter(sale => sale.shopId === shopId).map(sale => ({ id: `Pending-${sale.reference.slice(0,6)}`, createdAt: sale.createdAt, total: sale.lines.reduce((sum,line)=>sum+line.quantity*line.unitPrice,0), payment: sale.payment, synced: false, seller: sale.createdByName || "Pending sync", lines: sale.lines.map(line=>({ productId:line.productId,name:line.name,quantity:line.quantity,unitPrice:line.unitPrice })) }));
  return [...queued,...complete];
}

export async function addCloudProduct(shopId: string, input: Omit<Product, "id">) {
  const supabase = getSupabase()!;
  const { data, error } = await supabase.from("products").insert({ shop_id: shopId, name: input.name, category: input.category, price: input.price, stock: input.stock, low_stock_threshold: input.threshold }).select("id,name,category,price,stock,low_stock_threshold").single();
  if (error) throw new Error(cloudErrorMessage(error, "Could not add this product."));
  return { id: data.id, name: data.name, category: data.category, price: Number(data.price), stock: data.stock, threshold: data.low_stock_threshold } as Product;
}

export async function adjustCloudStock(shopId: string, productId: string, delta: number) {
  const supabase = getSupabase()!;
  const { error } = await (supabase as any).rpc("adjust_stock", { p_shop_id: shopId, p_product_id: productId, p_delta: delta, p_reason: delta > 0 ? "delivery" : "correction" });
  if (error) throw new Error(cloudErrorMessage(error, "Could not adjust stock."));
}

export type PendingSale = { reference: string; shopId: string; payment: string; createdAt: string; createdByName?: string; lines: { productId: string; quantity: number; name: string; unitPrice: number }[] };
export function getOutbox(): PendingSale[] { try { return JSON.parse(window.localStorage.getItem(OUTBOX_KEY) || "[]") as PendingSale[]; } catch { return []; } }
export function queueSale(sale: PendingSale) { window.localStorage.setItem(OUTBOX_KEY, JSON.stringify([...getOutbox(), sale])); }
export async function syncOutbox(shopId: string) {
  const supabase = getSupabase(); if (!supabase || !navigator.onLine) return;
  const queue = getOutbox(); const remaining: PendingSale[] = [];
  for (const sale of queue) {
    if (sale.shopId !== shopId) { remaining.push(sale); continue; }
    const { error } = await (supabase as any).rpc("record_sale", { p_shop_id: shopId, p_client_reference: sale.reference, p_payment_method: sale.payment.toLowerCase(), p_items: sale.lines.map(line => ({ product_id: line.productId, quantity: line.quantity })) });
    if (error) remaining.push(sale);
  }
  window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(remaining));
}

export async function recordCloudSale(sale: PendingSale) {
  const supabase = getSupabase()!;
  const { data, error } = await (supabase as any).rpc("record_sale", { p_shop_id: sale.shopId, p_client_reference: sale.reference, p_payment_method: sale.payment.toLowerCase(), p_items: sale.lines.map(line => ({ product_id: line.productId, quantity: line.quantity })) });
  if (error) throw new Error(cloudErrorMessage(error, "Could not record this sale."));
  return String(data);
}

export async function inviteCloudEmployee(shopId: string, email: string): Promise<string> {
  const supabase = getSupabase()!;
  const { data, error } = await (supabase as any).rpc("invite_shop_employee", { p_shop_id: shopId, p_email: email });
  if (error) throw new Error(cloudErrorMessage(error, "Could not create the employee invite."));
  return String(data);
}

export async function loadCloudTeam(shopId: string) {
  const supabase = getSupabase()!;
  const { data, error } = await supabase.from("shop_memberships").select("role,profiles!shop_memberships_user_id_fkey(full_name,email)").eq("shop_id", shopId);
  if (error) throw new Error(cloudErrorMessage(error, "Could not load your team."));
  return (data || []).map(row => { const profile=Array.isArray(row.profiles)?row.profiles[0]:row.profiles;return { name: profile?.full_name || "Team member", email: profile?.email || "", role: row.role }; });
}

export async function loadCloudInvites(shopId: string): Promise<CloudInvite[]> {
  const supabase = getSupabase()!;
  const { data, error } = await supabase.from("shop_invitations").select("email,invite_code,created_at").eq("shop_id", shopId).is("accepted_by", null).order("created_at", { ascending: false });
  if (error) throw new Error(cloudErrorMessage(error, "Could not load invitations."));
  return data || [];
}

export async function updateProfileName(fullName: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Profile settings are unavailable until Supabase is connected.");
  const cleaned = fullName.trim();
  if (!cleaned) throw new Error("Enter your name before saving.");
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error(cloudErrorMessage(authError, "Could not confirm your account."));
  const { error: profileError } = await supabase.from("profiles").update({ full_name: cleaned }).eq("user_id", authData.user.id);
  if (profileError) throw new Error(cloudErrorMessage(profileError, "Could not update your profile."));
  const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name: cleaned } });
  if (metadataError) throw new Error(metadataError.message);
  try {
    const cached = JSON.parse(window.localStorage.getItem(SHOP_CACHE_KEY) || "null") as ShopContext | null;
    if (cached?.userId === authData.user.id) { const updated={ ...cached, fullName: cleaned }; window.localStorage.setItem(SHOP_CACHE_KEY, JSON.stringify(updated)); shopContextMemory=updated; }
  } catch {}
  window.dispatchEvent(new CustomEvent("stockwise:profile", { detail: cleaned }));
}
