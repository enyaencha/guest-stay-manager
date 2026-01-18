import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NotificationSettings as NotificationSettingsType } from "@/types/settings";
import { Bell } from "lucide-react";
import { toast } from "sonner";

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  onUpdate: (settings: NotificationSettingsType) => void;
}

export const NotificationSettings = ({ settings, onUpdate }: NotificationSettingsProps) => {
  const handleToggle = (field: keyof NotificationSettingsType) => {
    const updated = { ...settings, [field]: !settings[field] };
    onUpdate(updated);
    toast.success("Notification settings updated");
  };

  const notificationOptions = [
    { key: "emailNotifications" as const, label: "Email Notifications", description: "Receive notifications via email" },
    { key: "smsNotifications" as const, label: "SMS Notifications", description: "Receive notifications via SMS" },
    { key: "lowStockAlerts" as const, label: "Low Stock Alerts", description: "Get notified when inventory is running low" },
    { key: "maintenanceAlerts" as const, label: "Maintenance Alerts", description: "Get notified about urgent maintenance issues" },
    { key: "bookingConfirmations" as const, label: "Booking Confirmations", description: "Send confirmation emails for new bookings" },
    { key: "paymentAlerts" as const, label: "Payment Alerts", description: "Get notified about payment activities" },
    { key: "dailyReports" as const, label: "Daily Reports", description: "Receive daily summary reports" },
    { key: "weeklyReports" as const, label: "Weekly Reports", description: "Receive weekly performance reports" }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure how you receive alerts and notifications</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {notificationOptions.map((option) => (
            <div key={option.key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={option.key} className="text-base">{option.label}</Label>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <Switch
                id={option.key}
                checked={settings[option.key]}
                onCheckedChange={() => handleToggle(option.key)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
