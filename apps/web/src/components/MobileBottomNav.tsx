import { Home, Images, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

type MobileNavItem = {
  label: string;
  icon: typeof Home;
  badge?: number;
  href: () => string;
  isActive: (pathname: string) => boolean;
};

const hiddenExactPaths = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/checkout",
]);

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname.startsWith(prefix));

const isShopPath = (pathname: string) =>
  pathname === "/shop" ||
  pathname.startsWith("/collection/") ||
  startsWithAny(pathname, ["/product/", "/summer", "/winter", "/rainy"]);

const isAccountPath = (pathname: string) =>
  [
    "/profile",
    "/orders",
    "/tracking",
    "/pets",
    "/loyalty",
    "/support",
    "/faq",
    "/returns",
    "/referrals",
    "/subscriptions",
    "/wishlist",
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cartCount } = useCart();

  if (
    hiddenExactPaths.has(location.pathname) ||
    location.pathname.startsWith("/admin")
  ) {
    return null;
  }

  const items: MobileNavItem[] = [
    {
      label: "Home",
      icon: Home,
      href: () => "/",
      isActive: (pathname) => pathname === "/",
    },
    {
      label: "Shop",
      icon: LayoutGrid,
      href: () => "/shop",
      isActive: isShopPath,
    },
    {
      label: "Community",
      icon: Images,
      href: () => "/gallery",
      isActive: (pathname) => pathname === "/gallery",
    },
    {
      label: "Cart",
      icon: ShoppingBag,
      badge: cartCount,
      href: () => "/cart",
      isActive: (pathname) => pathname === "/cart" || pathname === "/checkout",
    },
    {
      label: "Account",
      icon: User,
      href: () => (user ? "/profile" : "/login"),
      isActive: isAccountPath,
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const isActive = item.isActive(location.pathname);
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.href())}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-1 transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full transition-opacity",
                  isActive ? "bg-foreground opacity-100" : "opacity-0",
                )}
              />
              <span className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.35]")} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 font-body text-[10px] leading-none text-background">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "font-body text-[11px] leading-none",
                  isActive ? "font-medium" : "font-normal",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
