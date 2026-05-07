import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getOrdersByPhone } from "@/lib/api";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

type OrderItem = { name: string; variant?: string | null; price: number; qty: number };
type Order = {
  _id: string;
  createdAt: string;
  order_number: number;
  customer_name: string;
  phone: string;
  address: string;
  hostel: string;
  room_number: string | null;
  total_amount: number;
  status: string;
  items: OrderItem[];
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[var(--curry)] text-primary",
  preparing: "bg-[var(--saffron)] text-white",
  out_for_delivery: "bg-blue-500 text-white",
  delivered: "bg-[var(--mint)] text-primary",
  cancelled: "bg-destructive text-destructive-foreground",
};

function OrdersPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error("Enter a valid 10-digit mobile number");
    setLoading(true);
    try {
      const data = await getOrdersByPhone(phone);
      setOrders(data);
      setSearched(true);
      if (data.length === 0) toast.info("No orders found for this number");
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const downloadReceipt = (o: Order) => {
    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt #${o.order_number}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:400px;margin:40px auto;padding:20px;color:#333}
  h1{text-align:center;color:#6b1d1d;margin-bottom:4px}
  .brand{text-align:center;font-size:14px;color:#888;margin-bottom:20px}
  .divider{border-top:2px dashed #ddd;margin:12px 0}
  table{width:100%;border-collapse:collapse}
  td{padding:4px 0;font-size:14px}
  .right{text-align:right}
  .bold{font-weight:bold}
  .total{font-size:20px;color:#6b1d1d}
  .footer{text-align:center;font-size:12px;color:#999;margin-top:20px}
</style></head><body>
  <h1>🪔 PU Tiffin</h1>
  <div class="brand">Home Food Delivery · Punjab University</div>
  <div class="divider"></div>
  <table>
    <tr><td class="bold">Order #</td><td class="right">${o.order_number}</td></tr>
    <tr><td class="bold">Date</td><td class="right">${new Date(o.createdAt).toLocaleString()}</td></tr>
    <tr><td class="bold">Name</td><td class="right">${o.customer_name}</td></tr>
    <tr><td class="bold">Phone</td><td class="right">${o.phone}</td></tr>
    <tr><td class="bold">Address</td><td class="right">${o.address}</td></tr>
    <tr><td class="bold">Hostel</td><td class="right">${o.hostel}${o.room_number ? ` · Room ${o.room_number}` : ""}</td></tr>
  </table>
  <div class="divider"></div>
  <table>
    <tr><td class="bold">Item</td><td class="bold right">Qty</td><td class="bold right">Amount</td></tr>
    ${o.items.map((it) => `<tr><td>${it.name}${it.variant ? ` (${it.variant})` : ""}</td><td class="right">${it.qty}</td><td class="right">₹${it.price * it.qty}</td></tr>`).join("")}
  </table>
  <div class="divider"></div>
  <table>
    <tr><td>Subtotal</td><td class="right">₹${o.total_amount}</td></tr>
    <tr><td>Delivery</td><td class="right" style="color:green">FREE</td></tr>
    <tr><td class="bold total">Grand Total</td><td class="right bold total">₹${o.total_amount}</td></tr>
  </table>
  <div class="divider"></div>
  <div class="footer">Payment: Cash on Delivery<br>Thank you for ordering with PU Tiffin! 🙏</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PU_Tiffin_Receipt_${o.order_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl font-bold">Track Orders</h1>
        <p className="mt-2 text-muted-foreground">Enter your phone number to view your orders</p>

        <form onSubmit={search} className="mt-6 flex gap-3">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            maxLength={10}
            type="tel"
            className="max-w-xs"
          />
          <Button type="submit" disabled={loading} className="gap-2 bg-primary text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </form>

        {searched && orders.length === 0 && (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
            <div className="text-5xl">📋</div>
            <p className="mt-3 text-muted-foreground">No orders found for this number</p>
            <Link to="/menu" className="mt-4 mr-2">
              <Button className="bg-primary text-primary-foreground">Order now</Button>
            </Link>
            <Link to="/" className="mt-4">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="rounded-2xl border-2 border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-primary">#{o.order_number}</span>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="font-semibold">{o.hostel}{o.room_number ? ` · Room ${o.room_number}` : ""}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${STATUS_STYLES[o.status] ?? "bg-muted"}`}>
                  {o.status.replace(/_/g, " ")}
                </span>
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {o.items.map((it, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{it.name}{it.variant ? ` (${it.variant})` : ""} × {it.qty}</span>
                    <span className="text-muted-foreground">₹{it.price * it.qty}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <div>
                  <span className="text-sm text-muted-foreground">Grand Total</span>
                  <span className="ml-2 font-display text-xl font-bold text-primary">₹{o.total_amount}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => downloadReceipt(o)} className="gap-1">
                  <Download className="h-4 w-4" /> Receipt
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
