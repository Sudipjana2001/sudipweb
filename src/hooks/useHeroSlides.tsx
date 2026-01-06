import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

export interface HeroSlide {
  id: string;
  image_url: string;
  headline: string;
  subheadline: string | null;
  cta1_text: string | null;
  cta1_link: string | null;
  cta2_text: string | null;
  cta2_link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useHeroSlides() {
  return useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HeroSlide[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllHeroSlides() {
  return useQuery({
    queryKey: ["all-hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HeroSlide[];
    },
  });
}
