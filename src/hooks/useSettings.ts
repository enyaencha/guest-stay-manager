import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export interface PropertySettings {
  id: string;
  apply_settings: boolean | null;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  currency: string | null;
  timezone: string | null;
  logo_url: string | null;
  tax_pin: string | null;
  vat_rate: number | null;
  invoice_footer: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string | null;
  email_notifications: boolean;
  sms_notifications: boolean;
  review_requests: boolean;
  low_stock_alerts: boolean;
  maintenance_alerts: boolean;
  booking_confirmations: boolean;
  payment_alerts: boolean;
  daily_reports: boolean;
  weekly_reports: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemPreferences {
  id: string;
  apply_settings: boolean | null;
  language: string | null;
  date_format: string | null;
  time_format: string | null;
  auto_backup: boolean | null;
  maintenance_mode: boolean | null;
  created_at: string;
  updated_at: string;
}

export const usePropertySettings = () => {
  const { user } = useAuth();
  const { propertyId } = useTenant();

  return useQuery<PropertySettings | null>({
    queryKey: ["property_settings", propertyId],
    queryFn: async () => {
      let query = supabase.from("property_settings").select("*");
      if (propertyId) {
        query = query.eq("property_id", propertyId);
      } else if (!user?.id) {
        query = query.order("created_at", { ascending: true }).limit(1);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as PropertySettings | null;
    },
  });
};

export const useNotificationSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notification_settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as NotificationSettings | null;
    },
    enabled: !!user?.id,
  });
};

export const useSystemPreferences = () => {
  const { user } = useAuth();
  const { propertyId } = useTenant();

  return useQuery({
    queryKey: ["system_preferences", propertyId],
    queryFn: async () => {
      let query = supabase.from("system_preferences").select("*");
      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as SystemPreferences | null;
    },
    enabled: !!user?.id,
  });
};

export const useUpdatePropertySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PropertySettings> }) => {
      const { data, error } = await supabase
        .from("property_settings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property_settings"] });
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<NotificationSettings> }) => {
      const { data, error } = await supabase
        .from("notification_settings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_settings"] });
      toast.success("Notification settings updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update notification settings: " + error.message);
    },
  });
};

export const useUpdateSystemPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SystemPreferences> }) => {
      const { data, error } = await supabase
        .from("system_preferences")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_preferences"] });
      toast.success("System preferences updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update system preferences: " + error.message);
    },
  });
};
