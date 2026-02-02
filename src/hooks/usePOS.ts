import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface POSItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  description: string | null;
  inventory_item_id: string | null;
  stock_quantity: number | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface POSTransaction {
  id: string;
  room_number: string | null;
  guest_id: string | null;
  guest_name: string | null;
  items: Json;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  status: string;
  staff_id: string | null;
  staff_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem extends POSItem {
  quantity: number;
}

export const usePOSItems = () => {
  return useQuery({
    queryKey: ["pos_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_items")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      return data as POSItem[];
    },
  });
};

export const usePOSTransactions = () => {
  return useQuery({
    queryKey: ["pos_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as POSTransaction[];
    },
  });
};

export const useCreatePOSTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Omit<POSTransaction, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("pos_transactions")
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos_transactions"] });
      toast.success("Transaction completed successfully");
    },
    onError: (error) => {
      toast.error("Failed to complete transaction: " + error.message);
    },
  });
};

export const useUpdatePOSTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<POSTransaction> }) => {
      const { data, error } = await supabase
        .from("pos_transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos_transactions"] });
    },
    onError: (error) => {
      toast.error("Failed to update POS transaction: " + error.message);
    },
  });
};
