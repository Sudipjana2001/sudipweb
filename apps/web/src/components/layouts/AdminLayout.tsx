import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package, ShoppingBag, Image, Zap, HelpCircle, Star, MessageCircle,
  Truck, Clock, RotateCcw, TrendingDown, Tag, Gift, DollarSign,
  ShoppingCart, AlertTriangle, CreditCard, PieChart, MapPin, Target,
  BarChart3, Shield, ScrollText, UserCheck, LogOut, Menu, X, ChevronDown,
  LayoutDashboard,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const adminNavGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    title: "Store",
    items: [
      { id: "products", label: "Products", icon: <Package className="h-4 w-4" /> },
      { id: "orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
      { id: "hero-slides", label: "Hero Slides", icon: <Image className="h-4 w-4" /> },
      { id: "promo-banners", label: "Promo Banners", icon: <Zap className="h-4 w-4" /> },
    ],
  },
  {
    title: "Content",
    items: [
      { id: "faqs", label: "FAQs", icon: <HelpCircle className="h-4 w-4" /> },
      { id: "features", label: "Features", icon: <Star className="h-4 w-4" /> },
      { id: "testimonials", label: "Testimonials", icon: <MessageCircle className="h-4 w-4" /> },
      { id: "newsletter", label: "Newsletter", icon: <MessageCircle className="h-4 w-4" /> },
      { id: "instagram", label: "Instagram", icon: <Image className="h-4 w-4" /> },
      { id: "gallery", label: "Gallery", icon: <Image className="h-4 w-4" /> },
    ],
  },
  {
    title: "Marketing",
    items: [
      { id: "coupons", label: "Coupons", icon: <Tag className="h-4 w-4" /> },
      { id: "flash-sales", label: "Flash Sales", icon: <Zap className="h-4 w-4" /> },
      { id: "bundles", label: "Bundles", icon: <Gift className="h-4 w-4" /> },
      { id: "pricing", label: "Pricing", icon: <DollarSign className="h-4 w-4" /> },
      { id: "campaigns", label: "Campaigns", icon: <Target className="h-4 w-4" /> },
      { id: "influencers", label: "Influencers", icon: <UserCheck className="h-4 w-4" /> },
    ],
  },
  {
    title: "Operations",
    items: [
      { id: "courier", label: "Courier", icon: <Truck className="h-4 w-4" /> },
      { id: "sla", label: "Delivery SLA", icon: <Clock className="h-4 w-4" /> },
      { id: "returns", label: "Returns", icon: <RotateCcw className="h-4 w-4" /> },
      { id: "rto", label: "RTO Analytics", icon: <TrendingDown className="h-4 w-4" /> },
      { id: "support", label: "Support", icon: <MessageCircle className="h-4 w-4" /> },
      { id: "abandoned", label: "Abandoned Carts", icon: <ShoppingCart className="h-4 w-4" /> },
      { id: "stock", label: "Stock Alerts", icon: <AlertTriangle className="h-4 w-4" /> },
    ],
  },
  {
    title: "Analytics",
    items: [
      { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
      { id: "revenue", label: "Revenue", icon: <PieChart className="h-4 w-4" /> },
      { id: "locations", label: "Locations", icon: <MapPin className="h-4 w-4" /> },
      { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
      { id: "satisfaction", label: "CSAT", icon: <Star className="h-4 w-4" /> },
    ],
  },
  {
    title: "System",
    items: [
      { id: "moderation", label: "Moderation", icon: <Shield className="h-4 w-4" /> },
      { id: "rate-limits", label: "Rate Limits", icon: <Shield className="h-4 w-4" /> },
      { id: "gdpr", label: "GDPR", icon: <Shield className="h-4 w-4" /> },
      { id: "logs", label: "Audit Logs", icon: <ScrollText className="h-4 w-4" /> },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AdminLayout({ children, activeSection, onSectionChange }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  const handleNavClick = (id: string) => {
    onSectionChange(id);
    setSidebarOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo / Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/50 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <span className="text-sm font-bold text-background">T</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Pebric</h2>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        {adminNavGroups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.title);
          return (
            <div key={group.title} className="mb-1">
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                {group.title}
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5 pb-2">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                          isActive
                            ? "bg-foreground text-background font-medium shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User / Sign Out */}
      <div className="shrink-0 border-t border-border/50 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
            {profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name || "Admin"}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email || ""}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col border-r border-border bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-4 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card/50 px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">
            {adminNavGroups.flatMap((g) => g.items).find((i) => i.id === activeSection)?.label || "Dashboard"}
          </h1>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
