import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/types";

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  session_id: string | null;
  event_type: string;
  event_data: Json;
  page_url: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
}

// Track events
export async function trackEvent(
  eventType: string,
  eventData: Record<string, unknown> = {},
  userId?: string
) {
  const sessionId = getOrCreateSessionId();

  await supabase.from("analytics_events").insert([{
    user_id: userId || null,
    session_id: sessionId,
    event_type: eventType,
    event_data: eventData as Json,
    page_url: window.location.href,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
  }]);
}

function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

// Common event trackers
export const Analytics = {
  pageView: (pageName: string) => trackEvent("page_view", { page: pageName }),
  
  productView: (productId: string, productName: string) =>
    trackEvent("product_view", { product_id: productId, product_name: productName }),
  
  addToCart: (productId: string, quantity: number, price: number) =>
    trackEvent("add_to_cart", { product_id: productId, quantity, price }),
  
  removeFromCart: (productId: string) =>
    trackEvent("remove_from_cart", { product_id: productId }),
  
  checkout: (cartTotal: number, itemCount: number) =>
    trackEvent("checkout_start", { cart_total: cartTotal, item_count: itemCount }),
  
  purchase: (orderId: string, total: number, itemCount: number) =>
    trackEvent("purchase", { order_id: orderId, total, item_count: itemCount }),
  
  search: (query: string, resultsCount: number) =>
    trackEvent("search", { query, results_count: resultsCount }),
  
  signUp: (userId: string) => trackEvent("sign_up", {}, userId),
  
  signIn: (userId: string) => trackEvent("sign_in", {}, userId),
};

// Admin analytics hooks
export function useAnalyticsSummary(days: number = 30) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["analytics-summary", days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_type, created_at")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Group by event type
      const eventCounts: Record<string, number> = {};
      data.forEach((event) => {
        eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
      });

      // Group by day for chart
      const dailyEvents: Record<string, number> = {};
      data.forEach((event) => {
        const day = event.created_at.split("T")[0];
        dailyEvents[day] = (dailyEvents[day] || 0) + 1;
      });

      return {
        eventCounts,
        dailyEvents,
        totalEvents: data.length,
      };
    },
    enabled: isAdmin,
  });
}

export function useFunnelAnalytics(days: number = 30) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["funnel-analytics", days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_type, session_id")
        .gte("created_at", startDate.toISOString())
        .in("event_type", ["page_view", "product_view", "add_to_cart", "checkout_start", "purchase"]);

      if (error) throw error;

      // Count unique sessions per funnel step
      const funnel = {
        page_view: new Set<string>(),
        product_view: new Set<string>(),
        add_to_cart: new Set<string>(),
        checkout_start: new Set<string>(),
        purchase: new Set<string>(),
      };

      data.forEach((event) => {
        if (event.session_id && funnel[event.event_type as keyof typeof funnel]) {
          funnel[event.event_type as keyof typeof funnel].add(event.session_id);
        }
      });

      return {
        pageViews: funnel.page_view.size,
        productViews: funnel.product_view.size,
        addToCarts: funnel.add_to_cart.size,
        checkouts: funnel.checkout_start.size,
        purchases: funnel.purchase.size,
      };
    },
    enabled: isAdmin,
  });
}

export function useTopProducts(days: number = 30, limit: number = 10) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["top-products", days, limit],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_data")
        .eq("event_type", "product_view")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Count product views
      const productViews: Record<string, { id: string; name: string; count: number }> = {};
      
      data.forEach((event) => {
        const productId = (event.event_data as Record<string, unknown>)?.product_id as string;
        const productName = (event.event_data as Record<string, unknown>)?.product_name as string;
        
        if (productId) {
          if (!productViews[productId]) {
            productViews[productId] = { id: productId, name: productName || "Unknown", count: 0 };
          }
          productViews[productId].count++;
        }
      });

      return Object.values(productViews)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    enabled: isAdmin,
  });
}
