import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { toast } from "sonner";
import { Json } from "@/integrations/types";

export interface DynamicPricingRule {
  id: string;
  name: string;
  rule_type: string;
  conditions: Json;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  applies_to_ids: string[];
  priority: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export function useDynamicPricingRules() {
  return useQuery({
    queryKey: ["dynamic-pricing-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dynamic_pricing_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as DynamicPricingRule[];
    },
  });
}

export function useCreatePricingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: {
      name: string;
      rule_type: string;
      conditions: Json;
      discount_type: string;
      discount_value: number;
      applies_to?: string;
      applies_to_ids?: string[];
      priority?: number;
      is_active?: boolean;
      starts_at?: string | null;
      ends_at?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("dynamic_pricing_rules")
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });
      toast.success("Pricing rule created");
    },
    onError: () => {
      toast.error("Failed to create pricing rule");
    },
  });
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      name: string;
      rule_type: string;
      conditions: Json;
      discount_type: string;
      discount_value: number;
      applies_to: string;
      applies_to_ids: string[];
      priority: number;
      is_active: boolean;
      starts_at: string | null;
      ends_at: string | null;
    }>) => {
      const { error } = await supabase
        .from("dynamic_pricing_rules")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });
      toast.success("Pricing rule updated");
    },
    onError: () => {
      toast.error("Failed to update pricing rule");
    },
  });
}

export function useDeletePricingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dynamic_pricing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });
      toast.success("Pricing rule deleted");
    },
    onError: () => {
      toast.error("Failed to delete pricing rule");
    },
  });
}
