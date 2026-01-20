import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface HousekeepingTask {
  id: string;
  room_id: string | null;
  room_number: string;
  room_name: string | null;
  task_type: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  notes: string | null;
  amenities: Json;
  restock_notes: string | null;
  actual_added: Json;
  actual_added_notes: string | null;
  estimated_minutes: number | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface HousekeepingStaff {
  id: string;
  staff_id: string | null;
  name: string;
  tasks_completed: number;
  tasks_assigned: number;
  is_available: boolean;
  specialty: string[];
  created_at: string;
  updated_at: string;
}

export const useHousekeepingTasks = () => {
  return useQuery({
    queryKey: ["housekeeping_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("housekeeping_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HousekeepingTask[];
    },
  });
};

export const useHousekeepingStaff = () => {
  return useQuery({
    queryKey: ["housekeeping_staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("housekeeping_staff")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as HousekeepingStaff[];
    },
  });
};

export const useUpdateHousekeepingTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HousekeepingTask> }) => {
      const { data, error } = await supabase
        .from("housekeeping_tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["housekeeping_tasks"] });
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update task: " + error.message);
    },
  });
};
