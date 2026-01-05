import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  applies_to: "all" | "category" | "collection" | "product";
  applies_to_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CouponUse {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string | null;
  discount_applied: number;
  created_at: string;
}

export function useCoupons() {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
  });
}

export function useActiveCoupons() {
  return useQuery({
    queryKey: ["active-coupons"],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .or(`expires_at.is.null,expires_at.gt.${now}`);

      if (error) throw error;
      return data as Coupon[];
    },
  });
}

export function useValidateCoupon() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      code,
      orderAmount,
    }: {
      code: string;
      orderAmount: number;
    }): Promise<{ valid: boolean; coupon?: Coupon; discount?: number; message?: string }> => {
      const now = new Date().toISOString();

      // Find coupon
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !coupon) {
        return { valid: false, message: "Invalid coupon code" };
      }

      // Check dates
      if (coupon.starts_at > now) {
        return { valid: false, message: "This coupon is not yet active" };
      }

      if (coupon.expires_at && coupon.expires_at < now) {
        return { valid: false, message: "This coupon has expired" };
      }

      // Check total uses
      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        return { valid: false, message: "This coupon has reached its usage limit" };
      }

      // Check minimum order
      if (orderAmount < coupon.min_order_amount) {
        return {
          valid: false,
          message: `Minimum order amount is $${coupon.min_order_amount}`,
        };
      }

      // Check user usage limit
      if (user && coupon.max_uses_per_user) {
        const { count } = await supabase
          .from("coupon_uses")
          .select("id", { count: "exact" })
          .eq("coupon_id", coupon.id)
          .eq("user_id", user.id);

        if ((count || 0) >= coupon.max_uses_per_user) {
          return { valid: false, message: "You have already used this coupon" };
        }
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === "percentage") {
        discount = (orderAmount * coupon.discount_value) / 100;
      } else {
        discount = Math.min(coupon.discount_value, orderAmount);
      }

      return { valid: true, coupon: coupon as Coupon, discount };
    },
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      coupon_id,
      order_id,
      discount_applied,
    }: {
      coupon_id: string;
      order_id?: string;
      discount_applied: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Record usage
      await supabase.from("coupon_uses").insert({
        coupon_id,
        user_id: user.id,
        order_id: order_id || null,
        discount_applied,
      });

      // Increment uses_count
      const { data: coupon } = await supabase
        .from("coupons")
        .select("uses_count")
        .eq("id", coupon_id)
        .single();

      await supabase
        .from("coupons")
        .update({ uses_count: (coupon?.uses_count || 0) + 1 })
        .eq("id", coupon_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

// Admin functions
export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coupon: Omit<Coupon, "id" | "uses_count" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("coupons")
        .insert({ ...coupon, code: coupon.code.toUpperCase() })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon created!");
    },
    onError: (error) => {
      toast.error("Failed to create coupon", { description: error.message });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Coupon> & { id: string }) => {
      const { data, error } = await supabase
        .from("coupons")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon updated!");
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deleted");
    },
  });
}
