import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

export interface Feature {
  id: string;
  icon_name: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useFeatures() {
  return useQuery({
    queryKey: ["features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("features")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Feature[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllFeatures() {
  return useQuery({
    queryKey: ["all-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("features")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Feature[];
    },
  });
}
