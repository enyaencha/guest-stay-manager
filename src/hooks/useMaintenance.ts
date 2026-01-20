import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MaintenanceIssue {
  id: string;
  room_id: string | null;
  room_number: string;
  room_name: string | null;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  reported_by: string | null;
  reported_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceStaff {
  id: string;
  staff_id: string | null;
  name: string;
  specialty: string[];
  issues_resolved: number;
  issues_assigned: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export const useMaintenanceIssues = () => {
  return useQuery({
    queryKey: ["maintenance_issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_issues")
        .select("*")
        .order("reported_at", { ascending: false });

      if (error) throw error;
      return data as MaintenanceIssue[];
    },
  });
};

export const useMaintenanceStaff = () => {
  return useQuery({
    queryKey: ["maintenance_staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_staff")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as MaintenanceStaff[];
    },
  });
};

export const useUpdateMaintenanceIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MaintenanceIssue> }) => {
      const { data, error } = await supabase
        .from("maintenance_issues")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_issues"] });
      toast.success("Issue updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update issue: " + error.message);
    },
  });
};
