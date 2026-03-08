import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, RefreshCw, Users, Workflow } from "lucide-react";

type PlatformOrganization = {
  id: string;
  slug: string;
  display_name: string;
  is_active: boolean;
  property_count: number;
  member_count: number;
  created_at: string;
  updated_at: string;
};

type PlatformProperty = {
  id: string;
  organization_id: string;
  slug: string;
  display_name: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PlatformMember = {
  membership_id: string;
  organization_id: string;
  user_id: string;
  full_name: string;
  email: string;
  base_role: string;
  property_id: string;
  property_name: string;
  is_active: boolean;
  has_all_properties: boolean;
  created_at: string;
};

const APP_ROLE_OPTIONS = [
  { value: "administrator", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "front_desk", label: "Front Desk" },
  { value: "housekeeping_supervisor", label: "Housekeeping Supervisor" },
  { value: "maintenance_staff", label: "Maintenance Staff" },
  { value: "pos_operator", label: "POS Operator" },
  { value: "accountant", label: "Accountant" },
];

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const PlatformConsole = () => {
  const queryClient = useQueryClient();

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");

  const [newOrganizationSlug, setNewOrganizationSlug] = useState("");
  const [newOrganizationName, setNewOrganizationName] = useState("");
  const [newOrganizationActive, setNewOrganizationActive] = useState(true);

  const [newPropertySlug, setNewPropertySlug] = useState("");
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyPrimary, setNewPropertyPrimary] = useState(false);
  const [newPropertyActive, setNewPropertyActive] = useState(true);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [createNewUser, setCreateNewUser] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberPasswordConfirm, setNewMemberPasswordConfirm] = useState("");
  const [newMemberBaseRole, setNewMemberBaseRole] = useState("front_desk");
  const [newMemberPropertyId, setNewMemberPropertyId] = useState("");
  const [newMemberHasAllProperties, setNewMemberHasAllProperties] = useState(true);
  const [newMemberActive, setNewMemberActive] = useState(true);

  const organizationsQuery = useQuery({
    queryKey: ["platform_organizations"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_platform_organizations");
      if (error) throw error;
      return (data || []) as PlatformOrganization[];
    },
  });

  const propertiesQuery = useQuery({
    queryKey: ["platform_organization_properties", selectedOrganizationId],
    enabled: !!selectedOrganizationId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "list_platform_organization_properties",
        {
          _organization_id: selectedOrganizationId,
        }
      );
      if (error) throw error;
      return (data || []) as PlatformProperty[];
    },
  });

  const membersQuery = useQuery({
    queryKey: ["platform_organization_members", selectedOrganizationId],
    enabled: !!selectedOrganizationId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "list_platform_organization_members",
        {
          _organization_id: selectedOrganizationId,
        }
      );
      if (error) throw error;
      return (data || []) as PlatformMember[];
    },
  });

  const organizations = organizationsQuery.data || [];
  const properties = propertiesQuery.data || [];
  const members = membersQuery.data || [];

  useEffect(() => {
    if (organizations.length === 0) {
      setSelectedOrganizationId("");
      return;
    }

    const exists = organizations.some((organization) => organization.id === selectedOrganizationId);
    if (!exists) {
      setSelectedOrganizationId(organizations[0].id);
    }
  }, [organizations, selectedOrganizationId]);

  useEffect(() => {
    if (properties.length === 0) {
      setNewMemberPropertyId("");
      return;
    }

    const exists = properties.some((property) => property.id === newMemberPropertyId);
    if (!exists) {
      setNewMemberPropertyId(properties[0].id);
    }
  }, [newMemberPropertyId, properties]);

  useEffect(() => {
    if (createNewUser) return;
    setNewMemberName("");
    setNewMemberPassword("");
    setNewMemberPasswordConfirm("");
  }, [createNewUser]);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationId) || null,
    [organizations, selectedOrganizationId]
  );

  const createOrganization = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("save_platform_organization", {
        _slug: newOrganizationSlug,
        _display_name: newOrganizationName,
        _is_active: newOrganizationActive,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNewOrganizationSlug("");
      setNewOrganizationName("");
      setNewOrganizationActive(true);
      await queryClient.invalidateQueries({ queryKey: ["platform_organizations"] });
      toast.success("Organization saved");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to save organization"));
    },
  });

  const createProperty = useMutation({
    mutationFn: async () => {
      if (!selectedOrganizationId) {
        throw new Error("Select an organization first");
      }

      const { error } = await (supabase as any).rpc("save_platform_property", {
        _organization_id: selectedOrganizationId,
        _slug: newPropertySlug,
        _display_name: newPropertyName,
        _is_primary: newPropertyPrimary,
        _is_active: newPropertyActive,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setNewPropertySlug("");
      setNewPropertyName("");
      setNewPropertyPrimary(false);
      setNewPropertyActive(true);
      await queryClient.invalidateQueries({
        queryKey: ["platform_organization_properties", selectedOrganizationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["platform_organizations"] });
      toast.success("Branch saved");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to save branch"));
    },
  });

  const addOrganizationMember = useMutation({
    mutationFn: async () => {
      if (!selectedOrganizationId) {
        throw new Error("Select an organization first");
      }

      const trimmedEmail = newMemberEmail.trim().toLowerCase();
      if (!trimmedEmail) {
        throw new Error("User email is required");
      }

      if (createNewUser) {
        const trimmedName = newMemberName.trim();
        if (!trimmedName) {
          throw new Error("Full name is required when creating a new login");
        }
        if (!newMemberPassword || newMemberPassword.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        if (newMemberPassword !== newMemberPasswordConfirm) {
          throw new Error("Password confirmation does not match");
        }

        const { data, error } = await supabase.functions.invoke("create-user", {
          body: {
            name: trimmedName,
            email: trimmedEmail,
            password: newMemberPassword,
            role_id: null,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      const { error } = await (supabase as any).rpc("save_platform_organization_member", {
        _organization_id: selectedOrganizationId,
        _user_email: trimmedEmail,
        _base_role: newMemberBaseRole,
        _property_id: newMemberPropertyId || null,
        _has_all_properties: newMemberHasAllProperties,
        _is_active: newMemberActive,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setNewMemberEmail("");
      setCreateNewUser(false);
      setNewMemberName("");
      setNewMemberPassword("");
      setNewMemberPasswordConfirm("");
      setNewMemberBaseRole("front_desk");
      setNewMemberHasAllProperties(true);
      setNewMemberActive(true);
      await queryClient.invalidateQueries({
        queryKey: ["platform_organization_members", selectedOrganizationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["platform_organizations"] });
      toast.success("Organization member saved");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to save organization member"));
    },
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["platform_organizations"] }),
      queryClient.invalidateQueries({
        queryKey: ["platform_organization_properties", selectedOrganizationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["platform_organization_members", selectedOrganizationId],
      }),
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-600">
              Platform Admin
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Organizations, Branches, and Users
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Manage tenant organizations and branch-level onboarding from one platform console.
            </p>
          </div>
          <Button variant="outline" onClick={() => void refreshAll()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-600" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={newOrganizationSlug}
                  onChange={(event) => setNewOrganizationSlug(event.target.value)}
                  placeholder="e.g. city-haven"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Display Name</Label>
                <Input
                  value={newOrganizationName}
                  onChange={(event) => setNewOrganizationName(event.target.value)}
                  placeholder="City Haven Hotels"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Organization Active</p>
                <p className="text-xs text-muted-foreground">Inactive organizations remain hidden to tenants.</p>
              </div>
              <Switch checked={newOrganizationActive} onCheckedChange={setNewOrganizationActive} />
            </div>

            <Button
              onClick={() => createOrganization.mutate()}
              disabled={createOrganization.isPending || !newOrganizationSlug || !newOrganizationName}
            >
              {createOrganization.isPending ? "Saving..." : "Save Organization"}
            </Button>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Branches</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((organization) => (
                    <TableRow
                      key={organization.id}
                      className={
                        selectedOrganizationId === organization.id
                          ? "bg-cyan-50/80 cursor-pointer"
                          : "cursor-pointer"
                      }
                      onClick={() => setSelectedOrganizationId(organization.id)}
                    >
                      <TableCell className="font-medium">{organization.display_name}</TableCell>
                      <TableCell>{organization.slug}</TableCell>
                      <TableCell>{organization.property_count}</TableCell>
                      <TableCell>{organization.member_count}</TableCell>
                      <TableCell>
                        <Badge variant={organization.is_active ? "default" : "secondary"}>
                          {organization.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {organizations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No organizations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-cyan-600" />
                Branches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Selected organization: <span className="font-medium text-foreground">{selectedOrganization?.display_name || "None"}</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Branch Slug</Label>
                  <Input
                    value={newPropertySlug}
                    onChange={(event) => setNewPropertySlug(event.target.value)}
                    placeholder="e.g. main-branch"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch Name</Label>
                  <Input
                    value={newPropertyName}
                    onChange={(event) => setNewPropertyName(event.target.value)}
                    placeholder="Main Branch"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Primary Branch</p>
                    <p className="text-xs text-muted-foreground">Set as default branch.</p>
                  </div>
                  <Switch checked={newPropertyPrimary} onCheckedChange={setNewPropertyPrimary} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Branch Active</p>
                    <p className="text-xs text-muted-foreground">Inactive branches are hidden.</p>
                  </div>
                  <Switch checked={newPropertyActive} onCheckedChange={setNewPropertyActive} />
                </div>
              </div>

              <Button
                onClick={() => createProperty.mutate()}
                disabled={
                  createProperty.isPending ||
                  !selectedOrganizationId ||
                  !newPropertySlug ||
                  !newPropertyName
                }
              >
                {createProperty.isPending ? "Saving..." : "Save Branch"}
              </Button>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="font-medium">{property.display_name}</div>
                          {property.is_primary && (
                            <div className="text-xs text-muted-foreground">Primary</div>
                          )}
                        </TableCell>
                        <TableCell>{property.slug}</TableCell>
                        <TableCell>
                          <Badge variant={property.is_active ? "default" : "secondary"}>
                            {property.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {properties.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          Select an organization to load branches.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-600" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Create New Login</p>
                    <p className="text-xs text-muted-foreground">
                      Turn on to create a new auth user with password; turn off to link an existing user by email.
                    </p>
                  </div>
                  <Switch checked={createNewUser} onCheckedChange={setCreateNewUser} />
                </div>

                {createNewUser && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Full Name</Label>
                    <Input
                      value={newMemberName}
                      onChange={(event) => setNewMemberName(event.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label>User Email</Label>
                  <Input
                    value={newMemberEmail}
                    onChange={(event) => setNewMemberEmail(event.target.value)}
                    placeholder="owner@company.com"
                  />
                </div>

                {createNewUser && (
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={newMemberPassword}
                      onChange={(event) => setNewMemberPassword(event.target.value)}
                      placeholder="Enter password"
                    />
                  </div>
                )}

                {createNewUser && (
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input
                      type="password"
                      value={newMemberPasswordConfirm}
                      onChange={(event) => setNewMemberPasswordConfirm(event.target.value)}
                      placeholder="Confirm password"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Base Role</Label>
                  <Select value={newMemberBaseRole} onValueChange={setNewMemberBaseRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {APP_ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Branch</Label>
                  <Select value={newMemberPropertyId} onValueChange={setNewMemberPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">All Branch Access</p>
                    <p className="text-xs text-muted-foreground">Allow user across all branches.</p>
                  </div>
                  <Switch
                    checked={newMemberHasAllProperties}
                    onCheckedChange={setNewMemberHasAllProperties}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Membership Active</p>
                    <p className="text-xs text-muted-foreground">Deactivate to block tenant access.</p>
                  </div>
                  <Switch checked={newMemberActive} onCheckedChange={setNewMemberActive} />
                </div>
              </div>

              <Button
                onClick={() => addOrganizationMember.mutate()}
                disabled={
                  addOrganizationMember.isPending ||
                  !selectedOrganizationId ||
                  !newMemberEmail ||
                  !newMemberPropertyId ||
                  (createNewUser &&
                    (!newMemberName ||
                      !newMemberPassword ||
                      !newMemberPasswordConfirm ||
                      newMemberPassword !== newMemberPasswordConfirm))
                }
              >
                {addOrganizationMember.isPending ? "Saving..." : "Save Member"}
              </Button>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Default Branch</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.membership_id}>
                        <TableCell>
                          <div className="font-medium">{member.full_name || "Unnamed user"}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.base_role.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell>{member.property_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {members.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Select an organization to load users.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlatformConsole;
