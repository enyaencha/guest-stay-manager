import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export const useAuditLogs = (entityType?: string, entityId?: string) => {
  return useQuery({
    queryKey: ["audit_logs", entityType, entityId],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (entityType) {
        query = query.eq("entity_type", entityType);
      }
      if (entityId) {
        query = query.eq("entity_id", entityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });
};

export const useLogAudit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata,
    }: {
      action: string;
      entityType: string;
      entityId: string;
      oldValues?: Record<string, any> | null;
      newValues?: Record<string, any> | null;
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc("log_audit", {
        _action: action,
        _entity_type: entityType,
        _entity_id: entityId,
        _old_values: oldValues || null,
        _new_values: newValues || null,
        _metadata: metadata || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
    },
    onError: (error) => {
      console.error("Failed to log audit:", error);
    },
  });
};
