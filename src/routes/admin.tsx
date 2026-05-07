import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getAllMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getAllOrders,
  updateOrderStatus,
  getRestaurantConfig,
  setRestaurantConfig,
} from "@/lib/api";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Save, Power, Store, FileDown, Bell, TrendingUp, PieChart as PieChartIcon, Clock, CheckCircle, Phone } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type WeightOption = { label: string; grams: number };
type MenuItem = {
  _id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  unit: string;
  emoji: string | null;
  is_available: boolean;
  is_weighted: boolean;
  weight_options: WeightOption[] | null;
  sort_order: number;
};

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate({ to: "/auth" });
      toast.error("Admin login required");
    }
  }, [isAdmin, loading, navigate]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage restaurant, menu & orders</p>

        <RestaurantToggle />

        <Tabs defaultValue="menu" className="mt-6">
          <TabsList>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="menu" className="mt-6"><MenuManager /></TabsContent>
          <TabsContent value="orders" className="mt-6"><OrdersManager /></TabsContent>
          <TabsContent value="analytics" className="mt-6"><AnalyticsDashboard /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RestaurantToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRestaurantConfig()
      .then((cfg) => setIsOpen(cfg.is_open))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    try {
      const cfg = await setRestaurantConfig(!isOpen);
      setIsOpen(cfg.is_open);
      toast.success(cfg.is_open ? "Restaurant is now OPEN! 🟢" : "Restaurant is now CLOSED 🔴");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return null;

  return (
    <div className={`mt-6 rounded-2xl border-2 p-5 flex items-center justify-between transition-colors ${isOpen ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50"}`}>
      <div className="flex items-center gap-3">
        <Store className={`h-8 w-8 ${isOpen ? "text-green-600" : "text-red-500"}`} />
        <div>
          <div className="font-display text-xl font-bold">{isOpen ? "Restaurant is OPEN" : "Restaurant is CLOSED"}</div>
          <div className="text-sm text-muted-foreground">
            {isOpen ? "Accepting orders right now" : "Not accepting orders"}
          </div>
        </div>
      </div>
      <Button
        onClick={toggle}
        size="lg"
        className={`gap-2 ${isOpen ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"} text-white`}
      >
        <Power className="h-5 w-5" />
        {isOpen ? "Close Restaurant" : "Open Restaurant"}
      </Button>
    </div>
  );
}

function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllMenu();
      setItems(data);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addNew = async () => {
    try {
      await createMenuItem({
        name: "New Item",
        price: 50,
        category: "main",
        unit: "plate",
        emoji: "🍽️",
        sort_order: items.length + 1,
      });
      toast.success("Item added");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="space-y-4">
      <Button onClick={addNew} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" />Add new item</Button>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => <MenuEditor key={it._id} item={it} onChange={load} />)}
      </div>
    </div>
  );
}

function MenuEditor({ item, onChange }: { item: MenuItem; onChange: () => void }) {
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateMenuItem(item._id, {
        name: draft.name,
        description: draft.description,
        price: draft.price,
        category: draft.category,
        unit: draft.unit,
        emoji: draft.emoji,
        is_available: draft.is_available,
        is_weighted: draft.is_weighted,
        weight_options: draft.weight_options,
        sort_order: draft.sort_order,
      });
      toast.success("Saved");
      onChange();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const del = async () => {
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      await deleteMenuItem(item._id);
      toast.success("Deleted");
      onChange();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className={`rounded-2xl border-2 bg-card p-4 space-y-3 ${draft.is_available ? "border-border" : "border-red-200 bg-red-50/50"}`}>
      <div className="flex items-center gap-2">
        <Input className="text-2xl w-16" value={draft.emoji ?? ""} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} maxLength={4} />
        <Input className="font-semibold" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Price (₹)</Label>
          <Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-xs">Unit</Label>
          <Input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Category</Label>
          <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="thali">Thali</SelectItem>
              <SelectItem value="main">Main</SelectItem>
              <SelectItem value="sides">Sides</SelectItem>
              <SelectItem value="beverage">Beverage</SelectItem>
              <SelectItem value="dessert">Dessert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Sort order</Label>
          <Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Input value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={draft.is_available} onCheckedChange={(v) => setDraft({ ...draft, is_available: v })} />
          <span className={draft.is_available ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
            {draft.is_available ? "Available" : "Unavailable"}
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={draft.is_weighted} onCheckedChange={(v) => setDraft({ ...draft, is_weighted: v, weight_options: v ? (draft.weight_options ?? [{label:"100g",grams:100},{label:"200g",grams:200},{label:"500g",grams:500}]) : null })} />
          By weight (per 100g)
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button size="sm" variant="outline" onClick={del}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        <Button size="sm" onClick={save} disabled={saving} className="bg-primary text-primary-foreground gap-1"><Save className="h-4 w-4" />{saving ? "..." : "Save"}</Button>
      </div>
    </div>
  );
}

type Order = {
  _id: string;
  createdAt: string;
  order_number: number;
  customer_name: string;
  phone: string;
  phone_verified: boolean;
  address: string;
  hostel: string;
  room_number: string | null;
  total_amount: number;
  status: string;
  notes: string | null;
  items: Array<{ name: string; variant?: string | null; price: number; qty: number }>;
};

const STATUSES = ["pending", "preparing", "out_for_delivery", "delivered", "cancelled"];

function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCount, setLastCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "today">("today");

  const playNotification = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.play().catch(e => console.log("Sound play error:", e));
  };

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAllOrders();
      if (lastCount > 0 && data.length > lastCount) {
        playNotification();
        toast("New Order Received! 🛎️", { position: "top-right" });
      }
      setOrders(data);
      setLastCount(data.length);
    } catch (err: any) {
      if (!silent) toast.error(err.message);
    }
    if (!silent) setLoading(false);
  };
  
  useEffect(() => { 
    load();
    const interval = setInterval(() => load(true), 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [lastCount]);

  const exportToCSV = () => {
    if (orders.length === 0) return toast.error("No orders to export");
    const headers = ["Order #", "Date", "Customer", "Phone", "Hostel", "Room", "Items", "Total", "Status"];
    const rows = orders.map(o => [
      o.order_number,
      new Date(o.createdAt).toLocaleString().replace(/,/g, ""),
      `"${o.customer_name.replace(/"/g, '""')}"`,
      o.phone,
      o.hostel,
      o.room_number || "",
      `"${o.items.map(it => `${it.name} x${it.qty}`).join("; ")}"`,
      o.total_amount,
      o.status
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateOrderStatus(id, status);
      toast.success("Updated");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  const filteredOrders = orders.filter(o => {
    if (filter === "all") return true;
    const today = new Date().toDateString();
    const orderDate = new Date(o.createdAt).toDateString();
    return today === orderDate;
  });

  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold">
            {filter === "today" ? "Today's Orders" : "All Orders"} ({filteredOrders.length})
          </h3>
          <p className="text-xs text-muted-foreground">Managing {filter === "today" ? "current day" : "total"} records</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-32 h-8 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1 h-8">
            <FileDown className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => load()} className="h-8">Refresh</Button>
        </div>
      </div>
      {filteredOrders.length === 0 && <p className="text-muted-foreground text-center py-10">No {filter === "today" ? "orders for today" : "orders yet"}</p>}
      {filteredOrders.map((o) => (
        <div key={o._id} className="group relative rounded-2xl border-2 border-border bg-card p-5 transition-all hover:border-[var(--spice)]/50 hover:shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-4 flex-1">
              {/* Header Info */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-display text-xl font-bold">
                  #{o.order_number}
                </div>
                <div>
                  <h4 className="text-xl font-bold">{o.customer_name}</h4>
                  <p className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                {o.phone_verified && (
                  <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    <CheckCircle className="h-3 w-3" /> Phone Verified
                  </span>
                )}
              </div>

              {/* Contact & Address - Made prominent */}
              <div className="grid gap-3 sm:grid-cols-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 p-1.5 rounded-md bg-white border border-border shadow-sm">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</p>
                    <p className="text-base font-semibold">{o.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 p-1.5 rounded-md bg-white border border-border shadow-sm">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Delivery Address</p>
                    <p className="text-sm font-semibold">{o.hostel}{o.room_number ? ` · Room ${o.room_number}` : ""}</p>
                    {o.address && <p className="text-sm text-muted-foreground mt-0.5 leading-tight">{o.address}</p>}
                  </div>
                </div>
              </div>

              {/* Items - Made prominent */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase px-1">Order Items</p>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-semibold">Item</th>
                        <th className="px-3 py-2 font-semibold text-center w-16">Qty</th>
                        <th className="px-3 py-2 font-semibold text-right w-24">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {o.items.map((it, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 font-medium">
                            {it.name}{it.variant ? <span className="ml-1 text-xs text-muted-foreground">({it.variant})</span> : ""}
                          </td>
                          <td className="px-3 py-2 text-center">{it.qty}</td>
                          <td className="px-3 py-2 text-right">₹{it.price * it.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {o.notes && (
                <div className="p-2 rounded-lg bg-orange-50 border border-orange-100 text-orange-800 text-sm italic">
                  " {o.notes} "
                </div>
              )}
            </div>

            {/* Sidebar Action */}
            <div className="w-full sm:w-auto flex flex-col gap-3 min-w-[200px]">
              <div className="space-y-1.5 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase text-center">Order Status</p>
                <Select value={o.status} onValueChange={(v) => handleUpdateStatus(o._id, v)}>
                  <SelectTrigger className="w-full bg-white font-semibold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ").charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center p-4 rounded-2xl bg-[var(--curry)]/10 border border-[var(--curry)]/20">
                <p className="text-[10px] font-bold text-[var(--curry-dark)] uppercase">Total Amount</p>
                <p className="font-display text-3xl font-extrabold text-primary">₹{o.total_amount}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  // Process data for charts
  const statusData = STATUSES.map(s => ({
    name: s.replace(/_/g, " ").charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " "),
    value: orders.filter(o => o.status === s).length
  })).filter(d => d.value > 0);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6b7280'];

  // Last 7 days trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString();
    return {
      date: dateStr,
      count: orders.filter(o => new Date(o.createdAt).toLocaleDateString() === dateStr).length,
      amount: orders.filter(o => new Date(o.createdAt).toLocaleDateString() === dateStr).reduce((sum, o) => sum + o.total_amount, 0)
    };
  }).reverse();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "preparing").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary"><TrendingUp className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Total Revenue</p>
            <p className="text-2xl font-bold">₹{totalRevenue}</p>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6 flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-xl text-orange-600"><Clock className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Active Orders</p>
            <p className="text-2xl font-bold">{pendingOrders}</p>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl text-green-600"><Bell className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-border bg-card p-6">
          <h4 className="flex items-center gap-2 font-display text-lg font-bold mb-4">
            <PieChartIcon className="h-5 w-5 text-primary" /> Order Status
          </h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-6">
          <h4 className="flex items-center gap-2 font-display text-lg font-bold mb-4">
            <TrendingUp className="h-5 w-5 text-primary" /> Last 7 Days (Orders)
          </h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar name="Orders" dataKey="count" fill="#6b1d1d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
