import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/client";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  images: string[] | null;
  sizes: string[] | null;
  pet_sizes: string[] | null;
  features: string[] | null;
  stock: number | null;
  is_featured: boolean | null;
  is_best_seller: boolean | null;
  is_new_arrival: boolean | null;
  is_active: boolean | null;
  category_id: string | null;
  collection_id: string | null;
  created_at: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  collection?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export function useProducts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          collection:collections(*)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["products", "best-sellers"] });
          queryClient.invalidateQueries({ queryKey: ["products", "new-arrivals"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          collection:collections(*)
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!slug,
  });
}

export function useProductById(id: string) {
  return useQuery({
    queryKey: ["product-by-id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          collection:collections(*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });
}

export function useProductsByCollection(collectionSlug: string) {
  return useQuery({
    queryKey: ["products", "collection", collectionSlug],
    queryFn: async () => {
      const { data: collection } = await supabase
        .from("collections")
        .select("id")
        .eq("slug", collectionSlug)
        .maybeSingle();

      if (!collection) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          collection:collections(*)
        `)
        .eq("collection_id", collection.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!collectionSlug,
  });
}

export function useBestSellers() {
  return useQuery({
    queryKey: ["products", "best-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          collection:collections(*)
        `)
        .eq("is_best_seller", true)
        .eq("is_active", true)
        .limit(6);

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useNewArrivals() {
  return useQuery({
    queryKey: ["products", "new-arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          collection:collections(*)
        `)
        .eq("is_new_arrival", true)
        .eq("is_active", true)
        .limit(6);

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Collection[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          collection:collections(*)
        `)
        .eq("is_active", true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data as Product[];
    },
    enabled: query.length > 0,
  });
}
