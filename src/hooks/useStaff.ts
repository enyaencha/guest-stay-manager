import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Staff {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  department: string;
  status: string;
  joined_date: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useStaff = () => {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Staff[];
    },
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Role[];
    },
  });
};

export const useUserRoles = () => {
  return useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");

      if (error) throw error;
      return data as UserRole[];
    },
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staff: Omit<Staff, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("staff")
        .insert(staff)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add staff member: " + error.message);
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Staff> }) => {
      const { data, error } = await supabase
        .from("staff")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update staff member: " + error.message);
    },
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userRole: Omit<UserRole, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert(userRole)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Role assigned successfully");
    },
    onError: (error) => {
      toast.error("Failed to assign role: " + error.message);
    },
  });
};
