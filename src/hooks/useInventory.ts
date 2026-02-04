import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  sku: string | null;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  unit_cost: number;
  selling_price: number | null;
  supplier: string | null;
  last_restocked: string | null;
  opening_stock: number | null;
  purchases_in: number | null;
  stock_out: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryLot {
  id: string;
  inventory_item_id: string;
  brand: string;
  batch_code: string | null;
  expiry_date: string | null;
  quantity: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
}

export interface StockAlert {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  minStock: number;
  level: 'critical' | 'warning';
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  inventory_lot_id: string | null;
  item_name: string;
  brand: string;
  transaction_type: string;
  direction: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_value: number;
  batch_code: string | null;
  expiry_date: string | null;
  transaction_date: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export const useInventoryItems = () => {
  return useQuery({
    queryKey: ["inventory_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as InventoryItem[];
    },
  });
};

export const useInventoryTransactions = () => {
  return useQuery({
    queryKey: ["inventory_transactions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("inventory_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InventoryTransaction[];
    },
  });
};

export const useInventoryLots = () => {
  return useQuery({
    queryKey: ["inventory_lots"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("inventory_lots")
        .select("*")
        .order("expiry_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as InventoryLot[];
    },
  });
};

export const getStockLevel = (item: InventoryItem): 'out-of-stock' | 'low' | 'adequate' | 'full' => {
  if (item.current_stock === 0) return 'out-of-stock';
  if (item.current_stock < item.min_stock) return 'low';
  if (item.current_stock >= item.max_stock * 0.8) return 'full';
  return 'adequate';
};

export const getStockAlerts = (items: InventoryItem[]): StockAlert[] => {
  return items
    .filter(item => item.current_stock < item.min_stock)
    .map(item => ({
      id: `alert-${item.id}`,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      currentStock: item.current_stock,
      minStock: item.min_stock,
      level: (item.current_stock < item.min_stock * 0.5 ? 'critical' : 'warning') as 'critical' | 'warning',
      createdAt: new Date().toISOString(),
    }))
    .sort((a, b) => (a.level === 'critical' ? -1 : 1));
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryItem> }) => {
      const { data, error } = await supabase
        .from("inventory_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_items"] });
      toast.success("Inventory updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update inventory: " + error.message);
    },
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_items"] });
      toast.success("Inventory item added");
    },
    onError: (error) => {
      toast.error("Failed to add inventory item: " + error.message);
    },
  });
};

export const useCreateInventoryLot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lot: Omit<InventoryLot, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await (supabase as any)
        .from("inventory_lots")
        .insert(lot)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_lots"] });
    },
    onError: (error) => {
      toast.error("Failed to add inventory lot: " + error.message);
    },
  });
};

export const useUpdateInventoryLot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryLot> }) => {
      const { data, error } = await (supabase as any)
        .from("inventory_lots")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_lots"] });
    },
    onError: (error) => {
      toast.error("Failed to update inventory lot: " + error.message);
    },
  });
};

export const useCreateInventoryTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Omit<InventoryTransaction, "id" | "created_at">) => {
      const { data, error } = await (supabase as any)
        .from("inventory_transactions")
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
    },
    onError: (error) => {
      toast.error("Failed to record inventory transaction: " + error.message);
    },
  });
};
