import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Truck, Clock, Heart, Utensils, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getRestaurantConfig } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    getRestaurantConfig()
      .then((cfg) => setIsOpen(cfg.is_open))
      .catch(() => setIsOpen(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      {isOpen === false && (
        <div className="bg-destructive/10 border-b border-destructive/20">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3 text-destructive">
            <XCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-semibold">
              Restaurant is currently closed. We are not accepting orders right now.
            </p>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[var(--mint)] animate-pulse" />
                Fresh tiffin · Delivered in all Hostels & PU
              </div>
              <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
                Ghar ka khana,
                <span className="block bg-gradient-to-r from-[var(--spice)] via-primary to-[var(--saffron)] bg-clip-text text-transparent">
                  delivered hot.
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Home-cooked thalis, lassi & jalebi made fresh daily. Order now and get it
                delivered to all Boys/Girls hostels, Maharana Pratap or in PU — fresh and hot.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/menu">
                  <Button size="lg" className="bg-primary text-primary-foreground shadow-[var(--shadow-warm)] hover:bg-primary/90">
                    <Utensils className="mr-2 h-5 w-5" /> See today's menu
                  </Button>
                </Link>
                <Link to="/orders">
                  <Button size="lg" variant="outline" className="border-2">
                    Track your order
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { icon: Truck, label: "Free delivery" },
                  { icon: Clock, label: "30 min hot" },
                  { icon: Heart, label: "Made with love" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="text-center">
                    <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--curry)] text-primary shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto aspect-square max-w-md rounded-[2rem] bg-gradient-to-br from-[var(--saffron)] via-[var(--spice)] to-primary p-1 shadow-[var(--shadow-glow)]">
                <div className="flex h-full w-full items-center justify-center rounded-[1.85rem] bg-card text-[14rem] leading-none">
                  🍛
                </div>
              </div>
              <div className="absolute -left-4 top-10 rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-warm)] border border-border">
                <div className="text-xs text-muted-foreground">Veg Thali</div>
                <div className="font-display text-xl font-bold text-primary">₹70</div>
              </div>
              <div className="absolute -right-2 bottom-12 rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-warm)] border border-border">
                <div className="text-xs text-muted-foreground">Jalebi</div>
                <div className="font-display text-xl font-bold text-primary">₹60/100g</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-3xl font-bold mb-2">Delivery Locations</h2>
          <p className="text-muted-foreground mb-6">Free delivery to all of these locations:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "All Boys Hostels", 
              "All Girls Hostels", 
              "Maharana Pratap Hostel", 
              "In PU (Punjab University)"
            ].map(h => (
              <span key={h} className="rounded-full border-2 border-border bg-background px-4 py-1.5 text-sm font-semibold">
                {h}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-primary py-12 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Have Questions?</h2>
          <p className="mb-8 opacity-90 text-lg">Contact us on WhatsApp for any queries</p>
          <a 
            href="https://wa.me/918699979219" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-display text-xl font-bold text-primary shadow-xl transition hover:scale-105 active:scale-95"
          >
            <span className="text-2xl">💬</span>
            86999-79219
          </a>
        </div>
      </section>
    </div>
  );
}
