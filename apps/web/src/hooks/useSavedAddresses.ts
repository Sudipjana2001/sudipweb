import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type SavedAddressInsert = Omit<SavedAddress, "id" | "user_id" | "created_at" | "updated_at">;

export function useSavedAddresses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["saved-addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("saved_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedAddress[];
    },
    enabled: !!user,
  });
}

export function useCreateSavedAddress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (address: SavedAddressInsert) => {
      if (!user) throw new Error("Not authenticated");
      
      // If setting as default, unset others first
      if (address.is_default) {
        await supabase
          .from("saved_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }
      
      const { data, error } = await supabase
        .from("saved_addresses")
        .insert({
          ...address,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      toast.success("Address saved!");
    },
    onError: (error) => {
      toast.error("Failed to save address", { description: error.message });
    },
  });
}

export function useUpdateSavedAddress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SavedAddressInsert> & { id: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      if (updates.is_default) {
        await supabase
          .from("saved_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }
      
      const { data, error } = await supabase
        .from("saved_addresses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      toast.success("Address updated!");
    },
  });
}

export function useDeleteSavedAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("saved_addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      toast.success("Address deleted");
    },
  });
}
