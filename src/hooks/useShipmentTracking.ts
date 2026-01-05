import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ShipmentEvent {
  id: string;
  order_id: string;
  status: string;
  location: string | null;
  description: string | null;
  event_time: string;
  created_at: string;
}

export interface OrderWithTracking {
  id: string;
  order_number: string;
  status: string;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  shipping_address: {
    full_name?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  } | null;
  shipment_events?: ShipmentEvent[];
}

export function useShipmentTracking(orderId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["shipment-tracking", orderId],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          tracking_number,
          carrier,
          created_at,
          shipping_address,
          shipment_events(*)
        `)
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as OrderWithTracking | null;
    },
    enabled: !!user && !!orderId,
  });
}

export function useOrdersWithTracking() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orders-with-tracking", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          tracking_number,
          carrier,
          created_at,
          shipping_address
        `)
        .eq("user_id", user.id)
        .in("status", ["shipped", "processing", "confirmed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as OrderWithTracking[];
    },
    enabled: !!user,
  });
}
