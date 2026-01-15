import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

export interface PromoBanner {
  id: string;
  badge_text: string;
  headline: string;
  subheadline: string | null;
  cta_text: string | null;
  cta_link: string | null;
  discount_percentage: number | null;
  end_date: string;
  background_color: string;
  text_color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePromoBanners() {
  return useQuery({
    queryKey: ["promo-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_banners")
        .select("*")
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString()) // Only get banners that haven't expired
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PromoBanner[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllPromoBanners() {
  return useQuery({
    queryKey: ["all-promo-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PromoBanner[];
    },
  });
}
