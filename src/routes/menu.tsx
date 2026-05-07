import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMenu, getRestaurantConfig } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/menu")({ component: MenuPage });

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

function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const { add } = useCart();

  useEffect(() => {
    Promise.all([
      getMenu().then(setItems).catch(() => []),
      getRestaurantConfig().then((cfg) => setIsOpen(cfg.is_open)).catch(() => setIsOpen(false)),
    ]).finally(() => setLoading(false));
  }, []);

  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, it) => {
    (acc[it.category] ||= []).push(it);
    return acc;
  }, {});

  const labels: Record<string, string> = {
    thali: "Thalis",
    main: "Main course",
    sides: "Sides",
    beverage: "Beverages",
    dessert: "Desserts",
  };

  return (
    <div className="min-h-screen">
      <Header />

      {isOpen === false && (
        <div className="bg-destructive/10 border-b border-destructive/20">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3 text-destructive">
            <XCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-semibold">
              Restaurant is currently closed. You can browse the menu but cannot place orders.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">Today's Menu</h1>
        <p className="mt-2 text-muted-foreground">Fresh & home-cooked. Free delivery to PU & all Hostels.</p>

        {loading && (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="mt-12 rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
            <div className="text-5xl">🍳</div>
            <p className="mt-3 text-muted-foreground">No items available right now. Check back soon!</p>
          </div>
        )}

        <div className="mt-8 space-y-10">
          {Object.entries(grouped).map(([cat, list]) => (
            <section key={cat}>
              <h2 className="mb-4 font-display text-2xl font-bold text-primary">
                {labels[cat] ?? cat}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {list.map((it) => (
                  <MenuCard key={it._id} item={it} onAdd={add} isOpen={isOpen ?? false} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuCard({
  item,
  onAdd,
  isOpen,
}: {
  item: MenuItem;
  onAdd: (i: import("@/lib/cart-context").CartItem) => void;
  isOpen: boolean;
}) {
  const weighted = item.is_weighted && item.weight_options && item.weight_options.length > 0;
  const [variant, setVariant] = useState<string>(weighted ? item.weight_options![0].label : "");

  const selected = weighted ? item.weight_options!.find((w) => w.label === variant) : null;
  const price = weighted && selected ? Math.round((item.price * selected.grams) / 100) : item.price;

  const handleAdd = () => {
    if (!isOpen) return toast.error("Restaurant is closed right now");
    onAdd({
      id: weighted ? `${item._id}-${variant}` : item._id,
      menu_id: item._id,
      name: item.name,
      emoji: item.emoji,
      price,
      qty: 1,
      variantLabel: weighted ? variant : undefined,
    });
    toast.success(`${item.name} added`);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border-2 border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm)]">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--curry)] text-4xl">
          {item.emoji ?? "🍽️"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-xl font-bold leading-tight">{item.name}</h3>
            <div className="text-right">
              <div className="font-display text-2xl font-extrabold text-primary">₹{price}</div>
              <div className="text-xs text-muted-foreground">{weighted ? `₹${item.price}/100g` : `per ${item.unit}`}</div>
            </div>
          </div>
          {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}

          <div className="mt-3 flex items-center gap-2">
            {weighted && (
              <Select value={variant} onValueChange={setVariant}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {item.weight_options!.map((w) => (
                    <SelectItem key={w.label} value={w.label}>{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={handleAdd}
              size="sm"
              disabled={!isOpen}
              className="ml-auto gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
