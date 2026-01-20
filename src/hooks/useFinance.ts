import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FinanceTransaction {
  id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  payment_status: string;
  payment_method: string | null;
  reference: string | null;
  room_number: string | null;
  booking_id: string | null;
  vendor: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  total_cost: number;
  etims_amount: number | null;
  non_etims_amount: number | null;
  supplier: string | null;
  reference: string | null;
  payment_method: string;
  status: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export const useFinanceTransactions = () => {
  return useQuery({
    queryKey: ["finance_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as FinanceTransaction[];
    },
  });
};

export const useExpenses = () => {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Expense[];
    },
  });
};

export const calculateFinanceSummary = (transactions: FinanceTransaction[]): FinanceSummary => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const pendingPayments = transactions
    .filter(t => t.payment_status === 'pending' || t.payment_status === 'overdue')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    pendingPayments,
  };
};

export const calculateCategoryBreakdown = (
  transactions: FinanceTransaction[], 
  type: 'income' | 'expense'
): CategoryBreakdown[] => {
  const filtered = transactions.filter(t => t.type === type);
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  
  const byCategory: Record<string, { amount: number; count: number }> = {};
  
  filtered.forEach(t => {
    if (!byCategory[t.category]) {
      byCategory[t.category] = { amount: 0, count: 0 };
    }
    byCategory[t.category].amount += t.amount;
    byCategory[t.category].count++;
  });

  return Object.entries(byCategory)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const useCreateFinanceTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Omit<FinanceTransaction, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance_transactions"] });
      toast.success("Transaction recorded successfully");
    },
    onError: (error) => {
      toast.error("Failed to record transaction: " + error.message);
    },
  });
};
