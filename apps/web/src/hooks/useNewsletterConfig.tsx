import { useQuery } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabaseUntyped";

export interface NewsletterConfig {
  id: string;
  badge_text: string;
  headline: string;
  description: string;
  is_active: boolean;
  updated_at: string;
}

export function useNewsletterConfig() {
  return useQuery({
    queryKey: ["newsletter-config"],
    queryFn: async () => {
      const { data, error } = await fromTable("newsletter_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as NewsletterConfig | null) ?? null;
    },
    staleTime: 5 * 60 * 1000, 
  });
}
