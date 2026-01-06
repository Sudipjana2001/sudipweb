import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

export interface InstagramPost {
  id: string;
  image_url: string;
  caption: string | null;
  post_url: string;
  likes_count: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useInstagramPosts() {
  return useQuery({
    queryKey: ["instagram-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_posts")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as InstagramPost[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllInstagramPosts() {
  return useQuery({
    queryKey: ["all-instagram-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_posts")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as InstagramPost[];
    },
  });
}
