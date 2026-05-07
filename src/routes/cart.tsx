import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { placeOrder, getRestaurantConfig } from "@/lib/api";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Minus, Plus, ShoppingBag, CheckCircle, Phone, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({ component: CartPage });

const HOSTELS = [
  ...Array.from({ length: 8 }, (_, i) => `BH-${i + 1}`),
  ...Array.from({ length: 11 }, (_, i) => `GH-${i + 1}`),
  "Maharana Pratap Hostel",
  "PU (Main Campus)",
  "Other",
];

const orderSchema = z.object({
  customer_name: z.string().trim().min(1, "Name required").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  address: z.string().trim().min(1, "Address required").max(200),
  hostel: z.string().min(1, "Pick your hostel"),
  room_number: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(300).optional(),
});

function CartPage() {
  const { items, total, setQty, remove, clear, count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Auth state from context
  // Phone state
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  const phoneVerified = true; // Hardcode to true as requested to remove verification requirement

  // Order placed state
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  useEffect(() => {
    getRestaurantConfig()
      .then((cfg) => setIsOpen(cfg.is_open))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // No longer blocking for verification
  }, [user]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isOpen) return toast.error("Restaurant is currently closed");
    if (items.length === 0) return toast.error("Cart is empty");

    const fd = new FormData(e.currentTarget);
    const phoneInput = fd.get("phone") as string;
    const parsed = orderSchema.safeParse({
      customer_name: fd.get("customer_name"),
      phone: phoneInput,
      address: fd.get("address"),
      hostel: fd.get("hostel"),
      room_number: fd.get("room_number") || undefined,
      notes: fd.get("notes") || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    try {
      const order = await placeOrder({
        customer_name: parsed.data.customer_name,
        phone: parsed.data.phone,
        phone_verified: false,
        address: parsed.data.address,
        hostel: parsed.data.hostel,
        room_number: parsed.data.room_number ?? null,
        notes: parsed.data.notes ?? null,
        items: items.map((i) => ({
          menu_id: i.menu_id,
          name: i.name,
          variant: i.variantLabel ?? null,
          price: i.price,
          qty: i.qty,
        })),
        total_amount: total,
        status: "pending",
      });
      setPlacedOrder(order);
      toast.success("Order placed! 🎉 Pay on delivery.");
      clear();
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  // Generate receipt HTML and download
  const downloadReceipt = () => {
    if (!placedOrder) return;
    const o = placedOrder;
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
    ${o.items.map((it: any) => `<tr><td>${it.name}${it.variant ? ` (${it.variant})` : ""}</td><td class="right">${it.qty}</td><td class="right">₹${it.price * it.qty}</td></tr>`).join("")}
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

  // Order placed success screen
  if (placedOrder) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mint)]/20">
            <CheckCircle className="h-10 w-10 text-[var(--mint)]" />
          </div>
          <h1 className="font-display text-4xl font-bold">Order Placed! 🎉</h1>
          <p className="mt-2 text-muted-foreground">Order #{placedOrder.order_number} · Pay on delivery</p>

          <div className="mt-6 rounded-2xl border-2 border-border bg-card p-5 text-left">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            {placedOrder.items.map((it: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span>{it.name}{it.variant ? ` (${it.variant})` : ""} × {it.qty}</span>
                <span>₹{it.price * it.qty}</span>
              </div>
            ))}
            <div className="border-t border-border mt-2 pt-2 flex justify-between font-display text-xl font-bold text-primary">
              <span>Grand Total</span>
              <span>₹{placedOrder.total_amount}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={downloadReceipt} size="lg" className="w-full gap-2 bg-primary text-primary-foreground">
              <Download className="h-5 w-5" /> Download Receipt
            </Button>
            <Link to="/menu">
              <Button variant="outline" size="lg" className="w-full">Order more</Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="lg" className="w-full">Go to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl font-bold">Your Cart</h1>

        {count === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Your cart is empty</p>
            <Link to="/menu" className="mt-4 mr-2">
              <Button className="bg-primary text-primary-foreground">Browse menu</Button>
            </Link>
            <Link to="/" className="mt-4">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--curry)] text-3xl">
                    {it.emoji ?? "🍽️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{it.name}{it.variantLabel && <span className="text-muted-foreground"> · {it.variantLabel}</span>}</div>
                    <div className="text-sm text-muted-foreground">₹{it.price} × {it.qty}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(it.id, it.qty - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-semibold">{it.qty}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(it.id, it.qty + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="font-display text-lg font-bold text-primary w-20 text-right">₹{it.price * it.qty}</div>
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              {/* Grand Total Card */}
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
                <div className="flex justify-between items-center">
                  <span className="font-display text-lg font-bold">Grand Total</span>
                  <span className="font-display text-3xl font-extrabold text-primary">₹{total}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Free delivery · Cash on delivery</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4 rounded-2xl border-2 border-border bg-card p-6 h-fit shadow-[var(--shadow-warm)]">
              <h2 className="font-display text-2xl font-bold">Delivery Details</h2>

              <div>
                <Label htmlFor="customer_name">Name</Label>
                <Input id="customer_name" name="customer_name" required maxLength={80} placeholder="Your name" defaultValue={user?.full_name || ""} />
              </div>

              {/* Phone Display */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  required
                />
                <p className="text-[10px] text-muted-foreground italic">
                  * Our delivery executive will call this number.
                </p>
              </div>

              <div>
                <Label htmlFor="address">Delivery Address / Specific Location</Label>
                <Input id="address" name="address" required maxLength={200} placeholder="Room number, block, or specific address if 'Other'" />
              </div>
              <div>
                <Label htmlFor="hostel">Hostel</Label>
                <Select name="hostel" required>
                  <SelectTrigger id="hostel"><SelectValue placeholder="Select hostel" /></SelectTrigger>
                  <SelectContent>
                    {HOSTELS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="room_number">Room number (optional)</Label>
                <Input id="room_number" name="room_number" maxLength={20} placeholder="e.g. 204" />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" name="notes" maxLength={300} placeholder="Less spicy, extra roti..." />
              </div>

              <div className="border-t border-border pt-4 space-y-1">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{total}</span></div>
                <div className="flex justify-between text-sm text-[var(--mint)] font-semibold"><span>Delivery</span><span>FREE</span></div>
                <div className="flex justify-between font-display text-2xl font-bold text-primary pt-2"><span>Grand Total</span><span>₹{total}</span></div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !isOpen || !user}
                className="w-full bg-primary text-primary-foreground shadow-[var(--shadow-warm)] hover:bg-primary/90"
                size="lg"
              >
                {!user ? "Login to order" : !isOpen ? "Restaurant Closed" : submitting ? "Placing order..." : `Place order · ₹${total}`}
              </Button>
              {!user && (
                <Link to="/auth" className="block text-center mt-2">
                  <Button variant="outline" className="w-full border-2">Login/Signup</Button>
                </Link>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
