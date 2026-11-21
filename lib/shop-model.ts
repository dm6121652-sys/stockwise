export type Product = { id: string; name: string; category: string; price: number; stock: number; threshold: number };
export type SaleLine = { productId: string; name: string; quantity: number; unitPrice: number };
export type Sale = { id: string; createdAt: string; lines: SaleLine[]; total: number; payment: string; synced: boolean; seller?: string };

export function money(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

export function saleNumber() {
  return `SW-${Math.floor(Date.now() / 1000).toString().slice(-6)}`;
}
