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
import AdminChat from "./pages/AdminChat";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { AdminRoute, UserRoute } from "@/components/AdminRoute";
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
              {/* Auth routes - accessible to everyone */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Admin-only routes */}
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/admin/chat" element={<AdminRoute><AdminChat /></AdminRoute>} />

              {/* User routes - admin users get redirected to /admin */}
              <Route path="/" element={<UserRoute><Index /></UserRoute>} />
              <Route path="/shop" element={<UserRoute><Shop /></UserRoute>} />
              <Route path="/collection/:slug" element={<UserRoute><Collection /></UserRoute>} />
              <Route path="/summer" element={<UserRoute><Collection /></UserRoute>} />
              <Route path="/winter" element={<UserRoute><Collection /></UserRoute>} />
              <Route path="/rainy" element={<UserRoute><Collection /></UserRoute>} />
              <Route path="/product/:slug" element={<UserRoute><Product /></UserRoute>} />
              <Route path="/product/:slug/reviews" element={<UserRoute><ProductReviewsPage /></UserRoute>} />
              <Route path="/cart" element={<UserRoute><Cart /></UserRoute>} />
              <Route path="/checkout" element={<UserRoute><Checkout /></UserRoute>} />
              <Route path="/wishlist" element={<UserRoute><Wishlist /></UserRoute>} />
              <Route path="/about" element={<UserRoute><About /></UserRoute>} />
              <Route path="/contact" element={<UserRoute><Contact /></UserRoute>} />
              <Route path="/orders" element={<UserRoute><Orders /></UserRoute>} />
              <Route path="/pets" element={<UserRoute><Pets /></UserRoute>} />
              <Route path="/loyalty" element={<UserRoute><Loyalty /></UserRoute>} />
              <Route path="/compare" element={<UserRoute><Compare /></UserRoute>} />
              <Route path="/faq" element={<UserRoute><FAQ /></UserRoute>} />
              <Route path="/tracking" element={<UserRoute><Tracking /></UserRoute>} />
              <Route path="/gallery" element={<UserRoute><Gallery /></UserRoute>} />
              <Route path="/referrals" element={<UserRoute><Referrals /></UserRoute>} />
              <Route path="/subscriptions" element={<UserRoute><Subscriptions /></UserRoute>} />
              <Route path="/returns" element={<UserRoute><Returns /></UserRoute>} />
              <Route path="/support" element={<UserRoute><Support /></UserRoute>} />
              <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />
              <Route path="/privacy" element={<UserRoute><Privacy /></UserRoute>} />
              <Route path="/terms" element={<UserRoute><Terms /></UserRoute>} />
              <Route path="/docs" element={<UserRoute><Documentation /></UserRoute>} />
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
