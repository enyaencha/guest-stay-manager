import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SystemPreferences } from "@/types/settings";
import { Settings2, AlertTriangle, DatabaseBackup, Download } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SystemPreferencesSettingsProps {
  preferences: SystemPreferences;
  onUpdate: (preferences: SystemPreferences) => void;
}

export const SystemPreferencesSettings = ({ preferences, onUpdate }: SystemPreferencesSettingsProps) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(
    localStorage.getItem("lastBackupAt")
  );
  const [backupError, setBackupError] = useState<string | null>(null);

  const handleChange = (field: keyof SystemPreferences, value: string | boolean) => {
    const updated = { ...preferences, [field]: value };
    onUpdate(updated);
    toast.success("System preferences updated");
  };

  const runBackup = async () => {
    setIsBackingUp(true);
    setBackupError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("You must be logged in to perform a backup");
      }

      const { data, error } = await supabase.functions.invoke("database-backup", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || "Backup failed");
      }

      // Download the backup as a JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem("lastBackupAt", now);
      setLastBackupAt(now);
      toast.success("Backup downloaded successfully");
    } catch (error: any) {
      console.error("Backup error:", error);
      setBackupError(error.message);
      toast.error(error.message || "Backup failed");
    } finally {
      setIsBackingUp(false);
    }
  };

  useEffect(() => {
    if (!preferences.autoBackup) return;
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem("lastBackupAt");
    const lastDay = last ? last.slice(0, 10) : null;
    if (lastDay !== today) {
      runBackup();
    }
    const timer = setInterval(() => {
      const current = new Date().toISOString().slice(0, 10);
      const stored = localStorage.getItem("lastBackupAt");
      const storedDay = stored ? stored.slice(0, 10) : null;
      if (storedDay !== current) {
        runBackup();
      }
    }, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, [preferences.autoBackup]);

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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Database Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    Export all database tables as a JSON file download.
                  </p>
                </div>
                <Button onClick={runBackup} disabled={isBackingUp}>
                  <Download className="h-4 w-4 mr-2" />
                  {isBackingUp ? "Exporting..." : "Export Backup"}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Last backup: {lastBackupAt ? new Date(lastBackupAt).toLocaleString() : "Never"}
              </div>
              {backupError && (
                <div className="text-xs text-destructive">
                  Backup failed: {backupError}
                </div>
              )}
            </div>

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
