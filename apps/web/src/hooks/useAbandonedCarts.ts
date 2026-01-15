import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { toast } from "sonner";

export interface AbandonedCart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  email: string | null;
  cart_items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  cart_total: number;
  abandoned_at: string;
  recovered_at: string | null;
  recovery_email_sent: boolean;
  order_id: string | null;
  created_at: string;
}

export function useAbandonedCarts() {
  return useQuery({
    queryKey: ["abandoned-carts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .is("recovered_at", null)
        .order("abandoned_at", { ascending: false });

      if (error) throw error;
      return data as AbandonedCart[];
    },
  });
}

export function useAbandonedCartStats() {
  return useQuery({
    queryKey: ["abandoned-cart-stats"],
    queryFn: async () => {
      const { data: all, error: allError } = await supabase
        .from("abandoned_carts")
        .select("id, cart_total, recovered_at");

      if (allError) throw allError;

      const total = all?.length || 0;
      const recovered = all?.filter((c) => c.recovered_at).length || 0;
      const totalValue = all?.reduce((sum, c) => sum + Number(c.cart_total), 0) || 0;
      const recoveredValue = all
        ?.filter((c) => c.recovered_at)
        .reduce((sum, c) => sum + Number(c.cart_total), 0) || 0;

      return {
        totalAbandoned: total,
        recoveredCount: recovered,
        recoveryRate: total > 0 ? ((recovered / total) * 100).toFixed(1) : "0",
        totalLostValue: totalValue - recoveredValue,
        recoveredValue,
      };
    },
  });
}

export function useMarkCartRecovered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, orderId }: { cartId: string; orderId: string }) => {
      const { error } = await supabase
        .from("abandoned_carts")
        .update({
          recovered_at: new Date().toISOString(),
          order_id: orderId,
        })
        .eq("id", cartId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-carts"] });
      queryClient.invalidateQueries({ queryKey: ["abandoned-cart-stats"] });
      toast.success("Cart marked as recovered");
    },
  });
}

export function useTrackAbandonedCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cart: {
      user_id?: string;
      session_id?: string;
      email?: string;
      cart_items: AbandonedCart["cart_items"];
      cart_total: number;
    }) => {
      const { error } = await supabase.from("abandoned_carts").insert({
        user_id: cart.user_id || null,
        session_id: cart.session_id || null,
        email: cart.email || null,
        cart_items: cart.cart_items,
        cart_total: cart.cart_total,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-carts"] });
    },
  });
}
