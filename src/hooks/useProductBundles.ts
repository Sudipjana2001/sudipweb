import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { toast } from "sonner";

export interface ProductBundle {
  id: string;
  name: string;
  description: string | null;
  product_ids: string[];
  bundle_price: number;
  original_price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export function useProductBundles() {
  return useQuery({
    queryKey: ["product-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProductBundle[];
    },
  });
}

export function useActiveBundles() {
  return useQuery({
    queryKey: ["active-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data as ProductBundle[];
    },
  });
}

export function useCreateBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bundle: Omit<ProductBundle, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("product_bundles")
        .insert(bundle)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-bundles"] });
      toast.success("Bundle created");
    },
    onError: () => {
      toast.error("Failed to create bundle");
    },
  });
}

export function useUpdateBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductBundle> & { id: string }) => {
      const { error } = await supabase
        .from("product_bundles")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-bundles"] });
      toast.success("Bundle updated");
    },
    onError: () => {
      toast.error("Failed to update bundle");
    },
  });
}

export function useDeleteBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_bundles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-bundles"] });
      toast.success("Bundle deleted");
    },
    onError: () => {
      toast.error("Failed to delete bundle");
    },
  });
}
