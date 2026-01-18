import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertySettingsForm } from "@/components/settings/PropertySettingsForm";
import { StaffManagement } from "@/components/settings/StaffManagement";
import { RoomTypeSettings } from "@/components/settings/RoomTypeSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SystemPreferencesSettings } from "@/components/settings/SystemPreferencesSettings";
import {
  mockPropertySettings,
  mockStaffMembers,
  mockUserRoles,
  mockRoomTypes,
  mockNotificationSettings,
  mockSystemPreferences
} from "@/data/mockSettings";
import { PropertySettings, StaffMember, RoomTypeConfig, NotificationSettings as NotificationSettingsType, SystemPreferences } from "@/types/settings";
import { Building2, Users, BedDouble, Bell, Settings2 } from "lucide-react";

const Settings = () => {
  const [propertySettings, setPropertySettings] = useState<PropertySettings>(mockPropertySettings);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(mockStaffMembers);
  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>(mockRoomTypes);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsType>(mockNotificationSettings);
  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>(mockSystemPreferences);

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
              settings={propertySettings}
              onSave={setPropertySettings}
            />
          </TabsContent>

          <TabsContent value="staff">
            <StaffManagement
              staff={staffMembers}
              roles={mockUserRoles}
              onUpdate={setStaffMembers}
            />
          </TabsContent>

          <TabsContent value="rooms">
            <RoomTypeSettings
              roomTypes={roomTypes}
              onUpdate={setRoomTypes}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings
              settings={notificationSettings}
              onUpdate={setNotificationSettings}
            />
          </TabsContent>

          <TabsContent value="system">
            <SystemPreferencesSettings
              preferences={systemPreferences}
              onUpdate={setSystemPreferences}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
