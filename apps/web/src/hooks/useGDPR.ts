import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GDPRRequest {
  id: string;
  user_id: string;
  request_type: "export" | "delete";
  status: "pending" | "processing" | "completed" | "failed";
  data_url: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export function useMyGDPRRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["gdpr-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("gdpr_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GDPRRequest[];
    },
    enabled: !!user,
  });
}

export function useAllGDPRRequests() {
  return useQuery({
    queryKey: ["all-gdpr-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gdpr_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GDPRRequest[];
    },
  });
}

export function useCreateGDPRRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestType: "export" | "delete") => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("gdpr_requests")
        .insert({
          user_id: user.id,
          request_type: requestType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, requestType) => {
      queryClient.invalidateQueries({ queryKey: ["gdpr-requests"] });
      toast.success(
        requestType === "export"
          ? "Data export request submitted. You'll be notified when ready."
          : "Account deletion request submitted. We'll process this within 30 days."
      );
    },
    onError: () => {
      toast.error("Failed to submit request");
    },
  });
}

export function useUpdateGDPRRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      data_url,
      notes,
    }: {
      id: string;
      status: GDPRRequest["status"];
      data_url?: string;
      notes?: string;
    }) => {
      const updates: Partial<GDPRRequest> = { status };
      if (data_url) updates.data_url = data_url;
      if (notes) updates.notes = notes;
      if (status === "completed") updates.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from("gdpr_requests")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-gdpr-requests"] });
      queryClient.invalidateQueries({ queryKey: ["gdpr-requests"] });
      toast.success("Request updated");
    },
    onError: () => {
      toast.error("Failed to update request");
    },
  });
}

export function useExportUserData() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Fetch all user data
      const [
        { data: profile },
        { data: orders },
        { data: pets },
        { data: reviews },
        { data: wishlist },
        { data: addresses },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id),
        supabase.from("pets").select("*").eq("user_id", user.id),
        supabase.from("reviews").select("*").eq("user_id", user.id),
        supabase.from("wishlist_items").select("*, products(name, slug)").eq("user_id", user.id),
        supabase.from("saved_addresses").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        profile,
        orders,
        pets,
        reviews,
        wishlist,
        addresses,
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pawstyle-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return exportData;
    },
    onSuccess: () => {
      toast.success("Your data has been exported and downloaded");
    },
    onError: () => {
      toast.error("Failed to export data");
    },
  });
}
