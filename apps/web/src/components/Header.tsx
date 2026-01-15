import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Menu, X, ShoppingBag, Heart, Search, User, LogOut, Dog, Award, GitCompare, Truck, HelpCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
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

const popularSearches = [
  "Summer dress",
  "Winter coat", 
  "Matching outfits",
  "Pet accessories",
  "Twinning sets",
  "Rainy day",
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartCount, wishlistItems } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { data: products = [] } = useProducts();

  // Generate autocomplete suggestions based on products and popular searches
  const suggestions = searchQuery.trim()
    ? [
        ...popularSearches.filter(s => 
          s.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        ...products
          .filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.category?.name && p.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map(p => p.name)
          .slice(0, 3)
      ].slice(0, 6)
    : popularSearches;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      setShowSuggestions(true);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Sync search query with URL when on shop page
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (window.location.pathname === "/shop") {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(true);
    // Navigate to shop page with search query in real-time
    if (value.trim()) {
      navigate(`/shop?search=${encodeURIComponent(value)}`, { replace: true });
    } else {
      navigate("/shop", { replace: true });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigate(`/shop?search=${encodeURIComponent(suggestion)}`, { replace: true });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 shadow-soft backdrop-blur-md"
            : "bg-transparent"
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
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="underline-animation font-body text-sm tracking-wide text-foreground transition-colors hover:text-foreground/70"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Expandable Search */}
              <div ref={searchContainerRef} className="relative flex items-center">
                <div className={`flex items-center overflow-hidden transition-all duration-300 ease-out ${
                  isSearchOpen 
                    ? "w-64 sm:w-80 border border-border bg-background rounded-sm" 
                    : "w-0"
                }`}>
                  <Search className="ml-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search products..."
                    className="w-full bg-transparent py-2.5 pl-2 pr-8 font-body text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearchChange("")}
                      className="absolute right-10 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSearchOpen) {
                      setIsSearchOpen(false);
                      setShowSuggestions(false);
                      setSearchQuery("");
                    } else {
                      setIsSearchOpen(true);
                    }
                  }}
                  className={`p-1 text-foreground transition-colors hover:text-foreground/70 ${isSearchOpen ? "ml-2" : ""}`}
                  aria-label="Search"
                >
                  {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </button>

                {/* Suggestions Dropdown */}
                {isSearchOpen && showSuggestions && (
                  <div className="absolute left-0 right-8 top-full mt-1 bg-background border border-border shadow-lg z-50 max-h-64 overflow-y-auto">
                    {!searchQuery.trim() && (
                      <div className="px-3 py-2 border-b border-border">
                        <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">Popular Searches</span>
                      </div>
                    )}
                    {suggestions.length > 0 ? (
                      suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-body text-sm transition-colors hover:bg-muted"
                        >
                          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{suggestion}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center">
                        <p className="font-body text-sm text-muted-foreground">No suggestions found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

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

        {/* Mobile Menu */}
        <div
          className={`fixed inset-0 top-20 bg-background transition-all duration-300 lg:hidden ${
            isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
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
      </header>
    </>
  );
}
