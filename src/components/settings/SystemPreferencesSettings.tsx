import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SystemPreferences } from "@/types/settings";
import { Settings2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SystemPreferencesSettingsProps {
  preferences: SystemPreferences;
  onUpdate: (preferences: SystemPreferences) => void;
}

export const SystemPreferencesSettings = ({ preferences, onUpdate }: SystemPreferencesSettingsProps) => {
  const handleChange = (field: keyof SystemPreferences, value: string | boolean) => {
    const updated = { ...preferences, [field]: value };
    onUpdate(updated);
    toast.success("System preferences updated");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>System Preferences</CardTitle>
            <CardDescription>Configure system-wide settings and preferences</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={preferences.language} onValueChange={(value) => handleChange("language", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sw">Swahili</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={preferences.dateFormat} onValueChange={(value) => handleChange("dateFormat", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select value={preferences.timeFormat} onValueChange={(value) => handleChange("timeFormat", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24-hour (14:00)</SelectItem>
                  <SelectItem value="12h">12-hour (2:00 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoBackup" className="text-base">Automatic Backup</Label>
                <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
              </div>
              <Switch
                id="autoBackup"
                checked={preferences.autoBackup}
                onCheckedChange={(checked) => handleChange("autoBackup", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode" className="text-base">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Disable guest-facing features for maintenance</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={preferences.maintenanceMode}
                onCheckedChange={(checked) => handleChange("maintenanceMode", checked)}
              />
            </div>
          </div>

          {preferences.maintenanceMode && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Maintenance Mode Active</AlertTitle>
              <AlertDescription>
                Guest-facing features are currently disabled. Remember to turn this off when maintenance is complete.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
