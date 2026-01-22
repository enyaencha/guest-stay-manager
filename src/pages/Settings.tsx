import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertySettingsForm } from "@/components/settings/PropertySettingsForm";
import { StaffManagement } from "@/components/settings/StaffManagement";
import { RoomTypeSettings } from "@/components/settings/RoomTypeSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SystemPreferencesSettings } from "@/components/settings/SystemPreferencesSettings";
import { 
  usePropertySettings, 
  useNotificationSettings, 
  useSystemPreferences,
  useUpdatePropertySettings,
  useUpdateNotificationSettings,
  useUpdateSystemPreferences
} from "@/hooks/useSettings";
import { useRoomTypes } from "@/hooks/useRooms";
import { PropertySettings, RoomTypeConfig, NotificationSettings as NotificationSettingsType, SystemPreferences } from "@/types/settings";
import { Building2, Users, BedDouble, Bell, Settings2, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const queryClient = useQueryClient();
  
  const { data: propertySettings, isLoading: propertyLoading } = usePropertySettings();
  const { data: notificationSettings, isLoading: notificationLoading } = useNotificationSettings();
  const { data: systemPreferences, isLoading: systemLoading } = useSystemPreferences();
  const { data: roomTypes = [], isLoading: roomTypesLoading } = useRoomTypes();
  
  const updatePropertySettings = useUpdatePropertySettings();
  const updateNotificationSettings = useUpdateNotificationSettings();
  const updateSystemPreferences = useUpdateSystemPreferences();

  const updateRoomType = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RoomTypeConfig> }) => {
      const { error } = await supabase
        .from("room_types")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room_types"] });
      toast.success("Room type updated");
    },
  });

  const isLoading = propertyLoading || notificationLoading || systemLoading || roomTypesLoading;

  // Convert property settings for form
  const propertyFormData: PropertySettings = propertySettings ? {
    id: propertySettings.id,
    name: propertySettings.name,
    address: propertySettings.address || '',
    city: propertySettings.city || '',
    country: propertySettings.country || '',
    phone: propertySettings.phone || '',
    email: propertySettings.email || '',
    website: propertySettings.website || '',
    currency: propertySettings.currency || 'KSH',
    timezone: propertySettings.timezone || 'Africa/Nairobi',
    checkInTime: propertySettings.check_in_time || '14:00',
    checkOutTime: propertySettings.check_out_time || '11:00',
    logoUrl: propertySettings.logo_url || undefined,
  } : {
    id: '',
    name: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    currency: 'KSH',
    timezone: 'Africa/Nairobi',
    checkInTime: '14:00',
    checkOutTime: '11:00',
  };

  // Room type conversion (staff is now self-contained)
  const roomTypeFormData: RoomTypeConfig[] = roomTypes.map(rt => ({
    id: rt.id,
    code: rt.code,
    name: rt.name,
    description: rt.description || '',
    basePrice: rt.base_price,
    maxOccupancy: rt.max_occupancy,
    amenities: rt.amenities || [],
    isActive: rt.is_active ?? true,
  }));

  // Convert notification settings for form
  const notificationFormData: NotificationSettingsType = notificationSettings ? {
    emailNotifications: notificationSettings.email_notifications ?? true,
    smsNotifications: notificationSettings.sms_notifications ?? true,
    bookingConfirmations: notificationSettings.booking_confirmations ?? true,
    maintenanceAlerts: notificationSettings.maintenance_alerts ?? true,
    lowStockAlerts: notificationSettings.low_stock_alerts ?? true,
    paymentAlerts: notificationSettings.payment_alerts ?? true,
    dailyReports: notificationSettings.daily_reports ?? false,
    weeklyReports: notificationSettings.weekly_reports ?? true,
  } : {
    emailNotifications: true,
    smsNotifications: true,
    bookingConfirmations: true,
    maintenanceAlerts: true,
    lowStockAlerts: true,
    paymentAlerts: true,
    dailyReports: false,
    weeklyReports: true,
  };

  // Convert system preferences for form
  const systemFormData: SystemPreferences = systemPreferences ? {
    language: systemPreferences.language || 'en',
    dateFormat: systemPreferences.date_format || 'DD/MM/YYYY',
    timeFormat: (systemPreferences.time_format || '24h') as SystemPreferences['timeFormat'],
    autoBackup: systemPreferences.auto_backup ?? true,
    maintenanceMode: systemPreferences.maintenance_mode ?? false,
  } : {
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    autoBackup: true,
    maintenanceMode: false,
  };

  const handlePropertySave = (settings: PropertySettings) => {
    if (propertySettings) {
      updatePropertySettings.mutate({
        id: propertySettings.id,
        updates: {
          name: settings.name,
          address: settings.address,
          city: settings.city,
          country: settings.country,
          phone: settings.phone,
          email: settings.email,
          website: settings.website,
          currency: settings.currency,
          timezone: settings.timezone,
          check_in_time: settings.checkInTime,
          check_out_time: settings.checkOutTime,
        }
      });
    }
  };

  const handleNotificationUpdate = (settings: NotificationSettingsType) => {
    if (notificationSettings) {
      updateNotificationSettings.mutate({
        id: notificationSettings.id,
        updates: {
          email_notifications: settings.emailNotifications,
          sms_notifications: settings.smsNotifications,
          booking_confirmations: settings.bookingConfirmations,
          maintenance_alerts: settings.maintenanceAlerts,
          low_stock_alerts: settings.lowStockAlerts,
          payment_alerts: settings.paymentAlerts,
          daily_reports: settings.dailyReports,
          weekly_reports: settings.weeklyReports,
        }
      });
    }
  };

  const handleSystemUpdate = (prefs: SystemPreferences) => {
    if (systemPreferences) {
      updateSystemPreferences.mutate({
        id: systemPreferences.id,
        updates: {
          language: prefs.language,
          date_format: prefs.dateFormat,
          time_format: prefs.timeFormat,
          auto_backup: prefs.autoBackup,
          maintenance_mode: prefs.maintenanceMode,
        }
      });
    }
  };

  const handleRoomTypeUpdate = (types: RoomTypeConfig[]) => {
    toast.info("Room type settings saved");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your property configuration, staff, and system preferences
          </p>
        </div>

        <Tabs defaultValue="property" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="property" className="flex items-center gap-2 py-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Property</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2 py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Staff</span>
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2 py-2">
              <BedDouble className="h-4 w-4" />
              <span className="hidden sm:inline">Room Types</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 py-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="property">
            <PropertySettingsForm
              settings={propertyFormData}
              onSave={handlePropertySave}
            />
          </TabsContent>

          <TabsContent value="staff">
            <StaffManagement />
          </TabsContent>

          <TabsContent value="rooms">
            <RoomTypeSettings
              roomTypes={roomTypeFormData}
              onUpdate={handleRoomTypeUpdate}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings
              settings={notificationFormData}
              onUpdate={handleNotificationUpdate}
            />
          </TabsContent>

          <TabsContent value="system">
            <SystemPreferencesSettings
              preferences={systemFormData}
              onUpdate={handleSystemUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
