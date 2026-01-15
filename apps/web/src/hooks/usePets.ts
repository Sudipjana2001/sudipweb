import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  neck_cm: number | null;
  chest_cm: number | null;
  length_cm: number | null;
  photo_url: string | null;
  notes: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export type PetInsert = Omit<Pet, "id" | "created_at" | "updated_at">;
export type PetUpdate = Partial<PetInsert>;

export function usePets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Pet[];
    },
    enabled: !!user,
  });
}

export function usePet(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pet", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Pet;
    },
    enabled: !!user && !!id,
  });
}

export function useAddPet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pet: Omit<PetInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("pets")
        .insert({ ...pet, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet added successfully!");
    },
    onError: (error) => {
      toast.error("Failed to add pet", { description: error.message });
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: PetUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("pets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update pet", { description: error.message });
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet removed");
    },
    onError: (error) => {
      toast.error("Failed to remove pet", { description: error.message });
    },
  });
}

export function useSetPrimaryPet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (petId: string) => {
      if (!user) throw new Error("Not authenticated");

      // First, unset all primary flags
      await supabase
        .from("pets")
        .update({ is_primary: false })
        .eq("user_id", user.id);

      // Then set the new primary
      const { error } = await supabase
        .from("pets")
        .update({ is_primary: true })
        .eq("id", petId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Primary pet updated");
    },
  });
}

// Size recommendation based on pet measurements
export function getRecommendedSize(pet: Pet): string | null {
  if (!pet.chest_cm) return null;

  const chest = pet.chest_cm;
  
  if (pet.species === "dog") {
    if (chest < 35) return "XS";
    if (chest < 45) return "S";
    if (chest < 55) return "M";
    if (chest < 70) return "L";
    return "XL";
  }
  
  if (pet.species === "cat") {
    if (chest < 30) return "XS";
    if (chest < 35) return "S";
    if (chest < 40) return "M";
    return "L";
  }

  return null;
}
