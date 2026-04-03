import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AdminRoute, UserRoute } from "@/components/AdminRoute";
import {
  createAppQueryClient,
  subscribeToPersistedCatalogCache,
} from "@/lib/queryCache";

const CompareBar = lazy(() =>
  import("@/components/CompareBar").then((module) => ({
    default: module.CompareBar,
  })),
);
const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const Collection = lazy(() => import("./pages/Collection"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminChat = lazy(() => import("./pages/AdminChat"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Orders = lazy(() => import("./pages/Orders"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Pets = lazy(() => import("./pages/Pets"));
const Loyalty = lazy(() => import("./pages/Loyalty"));
const Compare = lazy(() => import("./pages/Compare"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Tracking = lazy(() => import("./pages/Tracking"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Returns = lazy(() => import("./pages/Returns"));
const Support = lazy(() => import("./pages/Support"));
const Profile = lazy(() => import("./pages/Profile"));
const ProductReviewsPage = lazy(() => import("./pages/ProductReviewsPage"));

const queryClient = createAppQueryClient();

function QueryPersistenceBridge() {
  useEffect(() => subscribeToPersistedCatalogCache(queryClient), []);
  return null;
}

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6">
    <div className="w-full max-w-sm space-y-4">
      <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-[320px] animate-pulse rounded-xl bg-muted" />
      <div className="h-5 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-2/3 animate-pulse rounded-md bg-muted" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <QueryPersistenceBridge />
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Auth routes - accessible to everyone */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

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
            </Suspense>
            <Suspense fallback={null}>
              <CompareBar />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
