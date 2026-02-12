import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PropertySettings } from "@/types/settings";
import { Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PropertySettingsFormProps {
  settings: PropertySettings;
  onSave: (settings: PropertySettings) => void;
  canEdit?: boolean;
}

export const PropertySettingsForm = ({ settings, onSave, canEdit = true }: PropertySettingsFormProps) => {
  const [formData, setFormData] = useState<PropertySettings>(settings);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const handleChange = (field: keyof PropertySettings, value: string | boolean | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error("Select a logo file to upload.");
      return;
    }

    setLogoUploading(true);
    try {
      const safeName = logoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `property-logo-${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from("property-logos")
        .upload(filePath, logoFile, {
          upsert: true,
          contentType: logoFile.type || undefined,
        });

      if (error) throw error;

      const { data } = supabase.storage.from("property-logos").getPublicUrl(filePath);
      handleChange("logoUrl", data.publicUrl);
      setLogoFile(null);
      toast.success("Logo uploaded successfully.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("You don't have permission to update settings.");
      return;
    }
    onSave(formData);
    toast.success("Property settings saved successfully");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Property Details</CardTitle>
        </div>
        <CardDescription>
          Configure your property information and basic settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label className="text-base">Enable Property Settings</Label>
              <p className="text-sm text-muted-foreground">
                When disabled, the app uses built-in defaults.
              </p>
            </div>
            <Switch
              checked={formData.applySettings ?? true}
              onCheckedChange={(checked) => handleChange("applySettings", checked)}
              disabled={!canEdit}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-medium mb-4">Branding & Invoice</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Property Logo</Label>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Property logo"
                      className="h-16 w-24 rounded-md border object-contain bg-white"
                    />
                  ) : (
                    <div className="h-16 w-24 rounded-md border bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
                      No logo
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      disabled={!canEdit}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLogoUpload}
                        disabled={!canEdit || !logoFile || logoUploading}
                      >
                        {logoUploading ? "Uploading..." : "Upload Logo"}
                      </Button>
                      {formData.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleChange("logoUrl", "")}
                          disabled={!canEdit}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PNG or JPG, transparent backgrounds print best.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxPin">PIN/VAT Number</Label>
                  <Input
                    id="taxPin"
                    value={formData.taxPin || ""}
                    onChange={(e) => handleChange("taxPin", e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatRate">VAT Rate (%)</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.vatRate ?? ""}
                    onChange={(e) =>
                      handleChange("vatRate", e.target.value === "" ? undefined : Number(e.target.value))
                    }
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceFooter">Invoice Footer / Terms</Label>
                <Textarea
                  id="invoiceFooter"
                  rows={4}
                  placeholder='e.g. "Thank you for staying with us!"'
                  value={formData.invoiceFooter || ""}
                  onChange={(e) => handleChange("invoiceFooter", e.target.value)}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-medium mb-4">Operational Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInTime">Check-in Time</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => handleChange("checkInTime", e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutTime">Check-out Time</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => handleChange("checkOutTime", e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleChange("currency", value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KSH">KSH - Kenyan Shilling</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleChange("timezone", value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                    <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                    <SelectItem value="Africa/Cairo">Africa/Cairo (EET)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!canEdit}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
          {!canEdit && (
            <p className="text-xs text-muted-foreground">
              You need Admin or Manager permissions to edit settings.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
