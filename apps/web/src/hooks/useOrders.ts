import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/client";
import type { Database } from "@/integrations/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  getAbandonedCartSessionId,
  markTrackedAbandonedCartRecovered,
} from "@/hooks/useAbandonedCarts";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  size: string | null;
  pet_size: string | null;
  unit_price: number;
  total_price: number;
}

export interface OrderPayment {
  payment_method: string;
  payment_status: string;
  created_at: string;
}

export interface OrderCouponUse {
  discount_applied: number;
  coupon?: { code: string } | null;
}

export interface ShippingAddress {
  full_name: string;
  firstName?: string;
  lastName?: string;
  address: string;
  city: string;
  postal_code: string;
  postalCode?: string;
  country: string;
  phone: string;
  email?: string;
}

export interface BillingAddress {
  full_name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  payment_method: string | null;
  payment_status?: string | null;
  shipping_address: ShippingAddress | null;
  billing_address: BillingAddress | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  gift_wrap?: boolean | null;
  gift_message?: string | null;
  gift_wrap_price?: number | null;
  items?: OrderItem[];
  payments?: OrderPayment[];
  coupon_uses?: OrderCouponUse[];
}

export function useOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          items:order_items(*),
          payments:payments(payment_method,payment_status,created_at),
          coupon_uses:coupon_uses(discount_applied, coupon:coupons(code))
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Order[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`orders-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders", user.id] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders", user.id] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coupon_uses",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders", user.id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export function useOrder(orderId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          items:order_items(*),
          payments:payments(payment_method,payment_status,created_at),
          coupon_uses:coupon_uses(discount_applied, coupon:coupons(code))
        `,
        )
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Order | null;
    },
    enabled: !!user && !!orderId,
  });

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-realtime-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coupon_uses",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  return query;
}

interface CreateOrderInput {
  items: {
    productId: string;
    productName: string;
    productImage: string | null;
    quantity: number;
    size: string | null;
    petSize: string | null;
    unitPrice: number;
  }[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  notes?: string;
  giftWrap?: boolean;
  giftMessage?: string;
  giftWrapPrice?: number;
  clearUserCart?: boolean;
}

export function useCreateOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      if (!user) throw new Error("Must be logged in");

      // Create order
      const orderData: Database["public"]["Tables"]["orders"]["Insert"] = {
        user_id: user.id,
        status: "confirmed",
        subtotal: input.subtotal,
        shipping_cost: input.shippingCost,
        tax: input.tax,
        total: input.total,
        payment_method: input.paymentMethod || "cod",
        shipping_address: input.shippingAddress as unknown as Record<
          string,
          unknown
        >,
        billing_address: (input.billingAddress ||
          input.shippingAddress) as unknown as Record<string, unknown>,
        notes: input.notes,
        gift_wrap: input.giftWrap || false,
        gift_message: input.giftMessage || null,
        gift_wrap_price: input.giftWrapPrice || 0,
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = input.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_image: item.productImage,
        quantity: item.quantity,
        size: item.size,
        pet_size: item.petSize,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        // Best-effort rollback to avoid orphan orders when items insert fails.
        await supabase.from("orders").delete().eq("id", order.id);
        throw itemsError;
      }

      // Clear cart
      if (input.clearUserCart !== false) {
        const { error: clearCartError } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);
        if (clearCartError) {
          console.warn(
            "Order placed but failed to clear cart items:",
            clearCartError,
          );
        }

        try {
          await markTrackedAbandonedCartRecovered({
            userId: user.id,
            sessionId: getAbandonedCartSessionId(),
            orderId: order.id,
          });
        } catch (error) {
          console.warn(
            "Order placed but failed to mark abandoned cart recovered:",
            error,
          );
        }
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
