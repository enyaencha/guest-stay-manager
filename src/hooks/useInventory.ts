import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  name: string;
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
