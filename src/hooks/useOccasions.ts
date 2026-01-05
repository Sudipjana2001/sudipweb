import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

export interface OccasionTag {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

export function useOccasions() {
  return useQuery({
    queryKey: ["occasion-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occasion_tags")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as OccasionTag[];
    },
  });
}

export function useProductsByOccasion(occasionId: string) {
  return useQuery({
    queryKey: ["products-by-occasion", occasionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_occasions")
        .select(`
          product_id,
          products (*)
        `)
        .eq("occasion_id", occasionId);

      if (error) throw error;
      return data?.map(d => d.products) || [];
    },
    enabled: !!occasionId,
  });
}
