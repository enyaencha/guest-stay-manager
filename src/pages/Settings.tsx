import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PropertySettingsForm } from "@/components/settings/PropertySettingsForm";
import { StaffAdminContent } from "@/components/staff/StaffAdminContent";
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
import { Building2, Users, BedDouble, Bell, Settings2, Loader2, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTabQueryParam } from "@/hooks/useTabQueryParam";

const tabItems = [
  { value: "property", label: "Property", icon: Building2, description: "Hotel info & branding" },
  { value: "staff", label: "Staff & Roles", icon: Users, description: "Team management" },
  { value: "rooms", label: "Room Types", icon: BedDouble, description: "Room configuration" },
  { value: "notifications", label: "Notifications", icon: Bell, description: "Alert preferences" },
  { value: "system", label: "System", icon: Settings2, description: "App preferences" },
];

const SETTINGS_TABS = ["property", "staff", "rooms", "notifications", "system"] as const;

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useTabQueryParam({
    key: "tab",
    defaultValue: "property",
    allowed: SETTINGS_TABS,
  });
  const { hasPermission } = useAuth();
  const canManageSettings = hasPermission("settings.manage");
  
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

  const propertyFormData: PropertySettings = propertySettings ? {
    id: propertySettings.id,
    applySettings: propertySettings.apply_settings ?? true,
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
    taxPin: propertySettings.tax_pin || '',
    vatRate: propertySettings.vat_rate ?? 0,
    invoiceFooter: propertySettings.invoice_footer || '',
  } : {
    id: '', applySettings: true, name: '', address: '', city: '', country: '',
    phone: '', email: '', website: '', currency: 'KSH', timezone: 'Africa/Nairobi',
    checkInTime: '14:00', checkOutTime: '11:00',
    taxPin: '',
    vatRate: 0,
    invoiceFooter: '',
  };

  const roomTypeFormData: RoomTypeConfig[] = roomTypes.map(rt => ({
    id: rt.id, code: rt.code, name: rt.name, description: rt.description || '',
    basePrice: rt.base_price, maxOccupancy: rt.max_occupancy,
    amenities: rt.amenities || [], isActive: rt.is_active ?? true,
  }));

  const notificationFormData: NotificationSettingsType = notificationSettings ? {
    emailNotifications: notificationSettings.email_notifications ?? true,
    smsNotifications: notificationSettings.sms_notifications ?? true,
    bookingConfirmations: notificationSettings.booking_confirmations ?? true,
    reviewRequests: notificationSettings.review_requests ?? true,
    maintenanceAlerts: notificationSettings.maintenance_alerts ?? true,
    lowStockAlerts: notificationSettings.low_stock_alerts ?? true,
    paymentAlerts: notificationSettings.payment_alerts ?? true,
    dailyReports: notificationSettings.daily_reports ?? false,
    weeklyReports: notificationSettings.weekly_reports ?? true,
  } : {
    emailNotifications: true, smsNotifications: true, bookingConfirmations: true,
    reviewRequests: true, maintenanceAlerts: true, lowStockAlerts: true, paymentAlerts: true,
    dailyReports: false, weeklyReports: true,
  };

  const systemFormData: SystemPreferences = systemPreferences ? {
    applySettings: systemPreferences.apply_settings ?? true,
    language: systemPreferences.language || 'en',
    dateFormat: systemPreferences.date_format || 'DD/MM/YYYY',
    timeFormat: (systemPreferences.time_format || '24h') as SystemPreferences['timeFormat'],
    autoBackup: systemPreferences.auto_backup ?? true,
    maintenanceMode: systemPreferences.maintenance_mode ?? false,
  } : {
    applySettings: true, language: 'en', dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h', autoBackup: true, maintenanceMode: false,
  };

  const handlePropertySave = (settings: PropertySettings) => {
    if (propertySettings) {
      updatePropertySettings.mutate({
        id: propertySettings.id,
        updates: {
          apply_settings: settings.applySettings ?? true,
          name: settings.name, address: settings.address, city: settings.city,
          country: settings.country, phone: settings.phone, email: settings.email,
          website: settings.website, currency: settings.currency, timezone: settings.timezone,
          check_in_time: settings.checkInTime, check_out_time: settings.checkOutTime,
          logo_url: settings.logoUrl || null,
          tax_pin: settings.taxPin || null,
          vat_rate: settings.vatRate ?? 0,
          invoice_footer: settings.invoiceFooter || null,
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
          review_requests: settings.reviewRequests,
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
          apply_settings: prefs.applySettings ?? true,
          language: prefs.language, date_format: prefs.dateFormat,
          time_format: prefs.timeFormat, auto_backup: prefs.autoBackup,
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage property configuration, staff, and preferences
            </p>
          </div>
        </div>

        {/* Settings Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 shrink-0">
            <nav className="space-y-1">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                      <p className={cn("font-medium text-sm", isActive && "text-primary-foreground")}>{tab.label}</p>
                      <p className={cn("text-xs truncate", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>{tab.description}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                {activeTab === "property" && (
              <PropertySettingsForm
                settings={propertyFormData}
                onSave={handlePropertySave}
                canEdit={canManageSettings}
              />
                )}
                {activeTab === "staff" && <StaffAdminContent />}
                {activeTab === "rooms" && (
                  <RoomTypeSettings roomTypes={roomTypeFormData} onUpdate={handleRoomTypeUpdate} />
                )}
                {activeTab === "notifications" && (
                  <NotificationSettings settings={notificationFormData} onUpdate={handleNotificationUpdate} />
                )}
                {activeTab === "system" && (
                  <SystemPreferencesSettings preferences={systemFormData} onUpdate={handleSystemUpdate} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
