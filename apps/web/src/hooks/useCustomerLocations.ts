import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

interface LocationData {
  city: string;
  state: string | null;
  country: string;
  count: number;
  revenue: number;
}

interface ShippingAddress {
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export function useCustomerLocations() {
  return useQuery({
    queryKey: ["customer-locations"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("shipping_address, total")
        .not("shipping_address", "is", null);

      if (error) throw error;

      // Aggregate by location
      const locationMap = new Map<string, LocationData>();

      orders?.forEach((order) => {
        const address = order.shipping_address as ShippingAddress | null;
        if (!address?.city) return;

        const key = `${address.city}-${address.state || ""}-${address.country || "India"}`;
        const existing = locationMap.get(key);

        if (existing) {
          existing.count += 1;
          existing.revenue += order.total || 0;
        } else {
          locationMap.set(key, {
            city: address.city,
            state: address.state || null,
            country: address.country || "India",
            count: 1,
            revenue: order.total || 0,
          });
        }
      });

      return Array.from(locationMap.values()).sort((a, b) => b.count - a.count);
    },
  });
}

export function useLocationStats() {
  const { data: locations = [] } = useCustomerLocations();

  const totalOrders = locations.reduce((sum, loc) => sum + loc.count, 0);
  const totalRevenue = locations.reduce((sum, loc) => sum + loc.revenue, 0);
  const uniqueCities = locations.length;
  const topCity = locations[0];

  // Group by state
  const stateMap = new Map<string, { count: number; revenue: number }>();
  locations.forEach((loc) => {
    const state = loc.state || "Unknown";
    const existing = stateMap.get(state);
    if (existing) {
      existing.count += loc.count;
      existing.revenue += loc.revenue;
    } else {
      stateMap.set(state, { count: loc.count, revenue: loc.revenue });
    }
  });

  const byState = Array.from(stateMap.entries())
    .map(([state, data]) => ({ state, ...data }))
    .sort((a, b) => b.count - a.count);

  return {
    totalOrders,
    totalRevenue,
    uniqueCities,
    topCity,
    byState,
    byCity: locations.slice(0, 20),
  };
}
