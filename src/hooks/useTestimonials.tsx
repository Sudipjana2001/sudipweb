import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

export interface Testimonial {
  id: string;
  customer_name: string;
  location: string | null;
  rating: number;
  review_text: string;
  pet_name: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials_cms")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Testimonial[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllTestimonials() {
  return useQuery({
    queryKey: ["all-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials_cms")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Testimonial[];
    },
  });
}
