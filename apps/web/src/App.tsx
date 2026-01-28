import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CompareBar } from "@/components/CompareBar";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Collection from "./pages/Collection";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Orders from "./pages/Orders";
import Documentation from "./pages/Documentation";
import Pets from "./pages/Pets";
import Loyalty from "./pages/Loyalty";
import Compare from "./pages/Compare";
import FAQ from "./pages/FAQ";
import Tracking from "./pages/Tracking";
import Gallery from "./pages/Gallery";
import Referrals from "./pages/Referrals";
import Subscriptions from "./pages/Subscriptions";
import Returns from "./pages/Returns";
import Support from "./pages/Support";
import Profile from "./pages/Profile";
import ProductReviewsPage from "./pages/ProductReviewsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/collection/:slug" element={<Collection />} />
              <Route path="/summer" element={<Collection />} />
              <Route path="/winter" element={<Collection />} />
              <Route path="/rainy" element={<Collection />} />
              <Route path="/product/:slug" element={<Product />} />
              <Route path="/product/:slug/reviews" element={<ProductReviewsPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/pets" element={<Pets />} />
              <Route path="/loyalty" element={<Loyalty />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/support" element={<Support />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CompareBar />
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
