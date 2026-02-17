import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Heart, Search, User, LogOut, Dog, Award, GitCompare, Truck, HelpCircle, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const navLinks = [
  { name: "Home", href: "/" },
  { name: "Collections", href: "/shop" },
  { name: "Community", href: "/gallery" },
  { name: "Support", href: "/support" },
];



export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, wishlistItems } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();



  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);



  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled || isMobileMenuOpen
            ? "bg-background/80 backdrop-blur-md shadow-sm"
            : "bg-gradient-to-b from-background/90 via-background/50 to-transparent pt-2"
        }`}
      >

        {/* Main Header */}
        <div className="container mx-auto px-6">
          <div className="flex h-20 items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>

            {/* Logo */}
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
              <h1 className="font-display text-2xl font-medium tracking-tight text-foreground">
                Twinning
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:items-center lg:gap-8">
              {navLinks.map((link) => {
                const isActive = link.href === "/" 
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.href);
                  
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="group relative font-body text-sm tracking-wide text-foreground transition-colors hover:text-foreground/70"
                  >
                    {link.name}
                    <span 
                      className={`absolute bottom-0 left-0 h-px w-full bg-foreground transition-transform duration-300 ease-out origin-center ${
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`} 
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">


              {/* User Account */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden text-foreground transition-colors hover:text-foreground/70 sm:block" aria-label="Account">
                      <User className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/pets")}>
                      <Dog className="mr-2 h-4 w-4" />
                      My Pets
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/loyalty")}>
                      <Award className="mr-2 h-4 w-4" />
                      Rewards
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/tracking")}>
                      <Truck className="mr-2 h-4 w-4" />
                      Track Order
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/orders")}>
                      My Orders
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button 
                  onClick={() => navigate("/login")}
                  className="hidden text-foreground transition-colors hover:text-foreground/70 sm:block" 
                  aria-label="Account"
                >
                  <User className="h-5 w-5" />
                </button>
              )}

              <button 
                onClick={() => navigate("/wishlist")}
                className="relative text-foreground transition-colors hover:text-foreground/70" 
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center bg-foreground font-body text-xs text-background">
                    {wishlistItems.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => navigate("/cart")}
                className="relative text-foreground transition-colors hover:text-foreground/70" 
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center bg-foreground font-body text-xs text-background">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - outside header to avoid stacking context issues */}
      <div
        className={`fixed inset-0 top-20 z-[60] bg-background transition-all duration-300 lg:hidden overflow-y-auto ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <nav className="container mx-auto px-6 py-8">
          <ul className="space-y-6">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.href}
                  className="font-display text-2xl text-foreground transition-colors hover:text-foreground/70"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {user ? (
              <div className="space-y-4">
                <p className="font-body text-sm text-muted-foreground">
                  Signed in as {profile?.full_name || user.email}
                </p>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="block w-full border border-border px-6 py-3 font-body text-sm transition-colors hover:bg-muted"
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/pets");
                  }}
                  className="block w-full border border-border px-6 py-3 font-body text-sm transition-colors hover:bg-muted"
                >
                  My Pets
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/loyalty");
                  }}
                  className="block w-full border border-border px-6 py-3 font-body text-sm transition-colors hover:bg-muted"
                >
                  Rewards
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/tracking");
                  }}
                  className="block w-full border border-border px-6 py-3 font-body text-sm transition-colors hover:bg-muted"
                >
                  Track Order
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/orders");
                  }}
                  className="block w-full border border-border px-6 py-3 font-body text-sm transition-colors hover:bg-muted"
                >
                  My Orders
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate("/admin");
                    }}
                    className="block w-full border border-border px-6 py-3 font-body text-sm transition-colors hover:bg-muted"
                  >
                    Admin Dashboard
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="block w-full border border-destructive px-6 py-3 font-body text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <button 
                  className="flex-1 bg-foreground px-6 py-3 font-body text-sm text-background transition-colors hover:bg-foreground/90"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  Sign In
                </button>
                <button 
                  className="flex-1 border border-border px-6 py-3 font-body text-sm transition-colors hover:bg-muted"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/signup");
                  }}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
