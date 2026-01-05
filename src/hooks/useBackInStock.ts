import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BackInStockAlert {
  id: string;
  user_id: string;
  product_id: string;
  email: string;
  size: string | null;
  is_notified: boolean;
  created_at: string;
  notified_at: string | null;
}

export function useBackInStockAlerts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["back-in-stock-alerts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("back_in_stock_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BackInStockAlert[];
    },
    enabled: !!user,
  });
}

export function useCreateBackInStockAlert() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, email, size }: { productId: string; email: string; size?: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("back_in_stock_alerts")
        .upsert({
          user_id: user.id,
          product_id: productId,
          email,
          size: size || null,
        }, {
          onConflict: "user_id,product_id,size",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["back-in-stock-alerts"] });
      toast.success("Alert created!", {
        description: "We'll notify you when this item is back in stock.",
      });
    },
    onError: (error) => {
      toast.error("Failed to create alert", { description: error.message });
    },
  });
}

export function useDeleteBackInStockAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("back_in_stock_alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["back-in-stock-alerts"] });
      toast.success("Alert removed");
    },
  });
}

export function useIsAlertSet(productId: string, size?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["back-in-stock-alert", productId, size, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      let query = supabase
        .from("back_in_stock_alerts")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId);
        
      if (size) {
        query = query.eq("size", size);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}
