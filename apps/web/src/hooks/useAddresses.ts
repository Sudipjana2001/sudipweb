import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/client";
import { Database } from "@/integrations/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type SavedAddress = Database["public"]["Tables"]["saved_addresses"]["Row"];
export type AddressInsert = Database["public"]["Tables"]["saved_addresses"]["Insert"];
export type AddressUpdate = Database["public"]["Tables"]["saved_addresses"]["Update"];

export function useAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("saved_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    } else {
      setAddresses(data || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const addAddress = async (address: Omit<AddressInsert, "user_id">) => {
    if (!user) return null;

    // If this is the first address, make it default automatically
    const isFirst = addresses.length === 0;
    const isDefault = address.is_default !== undefined ? address.is_default : isFirst;

    // If setting as default, we need to unset others first
    if (isDefault) {
      await supabase
        .from("saved_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true);
    }

    const { data, error } = await supabase
      .from("saved_addresses")
      .insert({
        ...address,
        user_id: user.id,
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding address:", error);
      toast.error("Failed to add address");
      return null;
    }

    await fetchAddresses();
    return data;
  };

  const updateAddress = async (id: string, updates: AddressUpdate) => {
    if (!user) return false;

    if (updates.is_default) {
      await supabase
        .from("saved_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true);
    }

    const { error } = await supabase
      .from("saved_addresses")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating address:", error);
      toast.error("Failed to update address");
      return false;
    }

    await fetchAddresses();
    return true;
  };

  const deleteAddress = async (id: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("saved_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
      return false;
    }

    await fetchAddresses();
    return true;
  };

  const setDefaultAddress = async (id: string) => {
    return updateAddress(id, { is_default: true });
  };

  return {
    addresses,
    isLoading,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}
