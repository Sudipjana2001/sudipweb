import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useFAQs() {
  return useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("sort_order");

      if (error) throw error;
      return data as FAQ[];
    },
  });
}

export function useAllFAQs() {
  return useQuery({
    queryKey: ["all-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("category")
        .order("sort_order");

      if (error) throw error;
      return data as FAQ[];
    },
  });
}
