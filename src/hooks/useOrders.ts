import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_address: ShippingAddress | null;
  billing_address: BillingAddress | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export function useOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Order[];
    },
    enabled: !!user,
  });
}

export function useOrder(orderId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Order | null;
    },
    enabled: !!user && !!orderId,
  });
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
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  notes?: string;
}

export function useCreateOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      if (!user) throw new Error("Must be logged in");

      // Create order
      const orderData = {
        user_id: user.id,
        subtotal: input.subtotal,
        shipping_cost: input.shippingCost,
        tax: input.tax,
        total: input.total,
        shipping_address: input.shippingAddress as unknown as Record<string, unknown>,
        billing_address: (input.billingAddress || input.shippingAddress) as unknown as Record<string, unknown>,
        notes: input.notes,
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData as any)
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

      if (itemsError) throw itemsError;

      // Clear cart
      await supabase.from("cart_items").delete().eq("user_id", user.id);

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Order placed successfully!");
    },
    onError: () => {
      toast.error("Failed to place order");
    },
  });
}
