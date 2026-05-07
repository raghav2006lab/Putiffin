import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingBag, LogOut, Shield, ChefHat } from "lucide-react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold text-primary">
          <span className="text-3xl">🪔</span>
          <span>PU Tiffin</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm">Home</Button>
          </Link>
          <Link to="/menu">
            <Button variant="ghost" size="sm">Menu</Button>
          </Link>
          <Link to="/orders">
            <Button variant="ghost" size="sm">Track Order</Button>
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-1 border-primary/50 text-primary hover:bg-primary/5">
                <Shield className="h-4 w-4" /> Admin Panel
              </Button>
            </Link>
          )}

          <Link to="/cart" className="relative">
            <Button variant="secondary" size="sm" className="gap-2 shadow-sm">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--spice)] px-1 text-xs font-bold text-white">
                  {count}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-sm font-medium">Hi, {user.full_name.split(' ')[0]}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => { signOut(); navigate({ to: "/" }); }}
                className="gap-1"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : isAdmin ? (
             <Button
              variant="ghost"
              size="sm"
              onClick={() => { signOut(); navigate({ to: "/" }); }}
              className="gap-1"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                <ChefHat className="h-4 w-4" /> Login / Signup
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
