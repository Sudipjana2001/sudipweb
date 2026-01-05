import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

export interface DeliverySlot {
  id: string;
  date: string;
  time_slot: string;
  max_orders: number;
  current_orders: number;
  is_available: boolean;
  created_at: string;
}

export function useDeliverySlots() {
  return useQuery({
    queryKey: ["delivery-slots"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("delivery_slots")
        .select("*")
        .eq("is_available", true)
        .gte("date", today)
        .order("date")
        .order("time_slot");

      if (error) throw error;
      return data as DeliverySlot[];
    },
  });
}

export function useAvailableSlots(date?: string) {
  return useQuery({
    queryKey: ["delivery-slots", date],
    queryFn: async () => {
      if (!date) return [];
      
      const { data, error } = await supabase
        .from("delivery_slots")
        .select("*")
        .eq("date", date)
        .eq("is_available", true)
        .lt("current_orders", supabase.rpc as unknown as number); // Will filter in frontend

      if (error) throw error;
      return (data as DeliverySlot[]).filter(slot => slot.current_orders < slot.max_orders);
    },
    enabled: !!date,
  });
}
