import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ALL_PERMISSIONS, PERMISSION_GROUPS } from "@/lib/permissions";
import { PermissionGroupCard } from "./PermissionGroupCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  CheckSquare,
  Copy,
  Edit,
  Info,
  Save,
  Shield,
  Square,
  Trash2,
  UserCog,
} from "lucide-react";

type OrganizationRoleDefinition = {
  id: string;
  organization_id: string;
  role_key: string | null;
  base_role: string;
  name: string;
  description: string;
  permissions: string[];
  is_system_role: boolean;
  is_active: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
};

type OrganizationMemberRoleAssignment = {
  membership_id: string;
  user_id: string;
  full_name: string;
  email: string;
  membership_role: string;
  role_definition_id: string;
  role_name: string;
  role_base_role: string;
  is_membership_active: boolean;
  created_at: string;
};

type EditingRole = {
  id: string;
  name: string;
  description: string;
  base_role: string;
  permissions: string[];
  is_system_role: boolean;
};

const normalizePermissions = (permissions: string[]) =>
  Array.from(
    new Set(
      permissions
        .map((permission) => permission.trim())
        .filter((permission) => permission.length > 0)
    )
  );

const formatRoleLabel = (role: string) =>
  role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const RolePermissionsEditor = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [editingRole, setEditingRole] = useState<EditingRole | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleBaseRole, setNewRoleBaseRole] = useState("manager");
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string>>({});
  const [savingMembershipId, setSavingMembershipId] = useState<string | null>(null);

  const canManageRoles =
    hasPermission("staff.manage") ||
    hasPermission("staff.manage_roles") ||
    hasPermission("settings.manage") ||
    hasPermission("settings.roles_permissions");

  const roleManageDeniedMessage =
    "You don't have permission to manage roles. Ask an administrator to grant Roles & Permissions access.";

  const ensureCanManageRoles = () => {
    if (canManageRoles) return true;
    toast.error(roleManageDeniedMessage);
    return false;
  };

  const roleErrorMessage = (error: any, fallback: string) => {
    if (error?.code === "42501") return roleManageDeniedMessage;
    return error?.message || fallback;
  };

  const rolesQuery = useQuery({
    queryKey: ["organization_role_definitions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "list_current_organization_role_definitions"
      );
      if (error) throw error;
      return (data || []) as OrganizationRoleDefinition[];
    },
  });

  const assignmentsQuery = useQuery({
    queryKey: ["organization_member_role_assignments"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc(
        "list_current_organization_member_role_assignments"
      );
      if (error) throw error;
      return (data || []) as OrganizationMemberRoleAssignment[];
    },
  });

  const roles = rolesQuery.data || [];
  const assignments = assignmentsQuery.data || [];

  const baseRoleOptions = useMemo(() => {
    const systemRoles = roles
      .filter((role) => role.is_system_role && role.role_key)
      .map((role) => ({
        value: role.base_role,
        label: role.name,
      }));

    if (systemRoles.length > 0) {
      return Array.from(
        new Map(systemRoles.map((role) => [role.value, role])).values()
      );
    }

    return [
      { value: "administrator", label: "Administrator" },
      { value: "manager", label: "Manager" },
      { value: "front_desk", label: "Front Desk" },
      { value: "housekeeping_supervisor", label: "Housekeeping Supervisor" },
      { value: "maintenance_staff", label: "Maintenance Staff" },
      { value: "pos_operator", label: "POS Operator" },
      { value: "accountant", label: "Accountant" },
    ];
  }, [roles]);

  const allowedPermissionsByBaseRole = useMemo(() => {
    const grouped = new Map<string, string[]>();
    roles
      .filter((role) => role.is_system_role && role.role_key)
      .forEach((role) => {
        grouped.set(role.base_role, normalizePermissions(role.permissions || []));
      });
    return grouped;
  }, [roles]);

  const activeAssignableRolesByBase = useMemo(() => {
    const grouped = new Map<string, OrganizationRoleDefinition[]>();
    roles
      .filter((role) => role.is_active)
      .forEach((role) => {
        const current = grouped.get(role.base_role) || [];
        grouped.set(role.base_role, [...current, role]);
      });
    return grouped;
  }, [roles]);

  useEffect(() => {
    if (baseRoleOptions.length === 0) return;

    if (!baseRoleOptions.some((role) => role.value === newRoleBaseRole)) {
      const fallbackBaseRole = baseRoleOptions[0].value;
      setNewRoleBaseRole(fallbackBaseRole);
      const allowed = allowedPermissionsByBaseRole.get(fallbackBaseRole) || [];
      setNewRolePerms(allowed);
    }
  }, [allowedPermissionsByBaseRole, baseRoleOptions, newRoleBaseRole]);

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    assignments.forEach((assignment) => {
      nextDrafts[assignment.membership_id] = assignment.role_definition_id;
    });
    setAssignmentDrafts(nextDrafts);
  }, [assignments]);

  const filterByAllowedPermissions = (baseRole: string, permissions: string[]) => {
    const normalized = normalizePermissions(permissions);
    const allowed = allowedPermissionsByBaseRole.get(baseRole);
    if (!allowed || allowed.length === 0) return normalized;
    return normalized.filter((permission) => allowed.includes(permission));
  };

  const openCreateRole = () => {
    if (!ensureCanManageRoles()) return;
    const fallbackBaseRole = baseRoleOptions[0]?.value || "manager";
    setNewRoleName("");
    setNewRoleDesc("");
    setNewRoleBaseRole(fallbackBaseRole);
    setNewRolePerms(allowedPermissionsByBaseRole.get(fallbackBaseRole) || []);
    setIsCreateOpen(true);
  };

  const openDuplicate = (role: OrganizationRoleDefinition) => {
    if (!ensureCanManageRoles()) return;
    setNewRoleName(`${role.name} (Copy)`);
    setNewRoleDesc(role.description || "");
    setNewRoleBaseRole(role.base_role);
    setNewRolePerms(filterByAllowedPermissions(role.base_role, role.permissions || []));
    setIsCreateOpen(true);
  };

  const openEdit = (role: OrganizationRoleDefinition) => {
    if (!ensureCanManageRoles()) return;
    setEditingRole({
      id: role.id,
      name: role.name,
      description: role.description || "",
      base_role: role.base_role,
      permissions: filterByAllowedPermissions(role.base_role, role.permissions || []),
      is_system_role: role.is_system_role,
    });
  };

  const togglePermission = (permission: string) => {
    if (!editingRole) return;
    setEditingRole((previous) => {
      if (!previous) return previous;
      const nextPermissions = previous.permissions.includes(permission)
        ? previous.permissions.filter((value) => value !== permission)
        : [...previous.permissions, permission];
      return { ...previous, permissions: nextPermissions };
    });
  };

  const toggleNewPermission = (permission: string) => {
    setNewRolePerms((previous) =>
      previous.includes(permission)
        ? previous.filter((value) => value !== permission)
        : [...previous, permission]
    );
  };

  const toggleGroupAll = (
    group: string,
    currentPermissions: string[],
    setter: (permissions: string[]) => void,
    allowedPermissions: string[]
  ) => {
    const allowedSet = new Set(allowedPermissions);
    const groupPermissions = ALL_PERMISSIONS.filter(
      (permission) =>
        permission.group === group &&
        (allowedPermissions.length === 0 || allowedSet.has(permission.key))
    ).map((permission) => permission.key);

    const allEnabled =
      groupPermissions.length > 0 &&
      groupPermissions.every((permission) => currentPermissions.includes(permission));

    if (allEnabled) {
      setter(currentPermissions.filter((permission) => !groupPermissions.includes(permission)));
      return;
    }

    setter(normalizePermissions([...currentPermissions, ...groupPermissions]));
  };

  const handleSaveRole = async () => {
    if (!ensureCanManageRoles()) return;
    if (!editingRole) return;

    setSaving(true);
    try {
      const payload = {
        _role_definition_id: editingRole.id,
        _name: editingRole.name.trim(),
        _description: editingRole.description.trim(),
        _permissions: filterByAllowedPermissions(
          editingRole.base_role,
          editingRole.permissions
        ),
        _is_active: true,
      };

      const { error } = await (supabase as any).rpc(
        "save_current_organization_role_definition",
        payload
      );
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["organization_role_definitions"] });
      await queryClient.invalidateQueries({ queryKey: ["organization_member_role_assignments"] });
      toast.success(`Role "${editingRole.name}" updated`);
      setEditingRole(null);
    } catch (error: any) {
      toast.error(roleErrorMessage(error, "Failed to update role"));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!ensureCanManageRoles()) return;
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        _name: newRoleName.trim(),
        _description: newRoleDesc.trim(),
        _base_role: newRoleBaseRole,
        _permissions: filterByAllowedPermissions(newRoleBaseRole, newRolePerms),
        _is_active: true,
      };

      const { error } = await (supabase as any).rpc(
        "save_current_organization_role_definition",
        payload
      );
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["organization_role_definitions"] });
      toast.success(`Role "${newRoleName}" created`);
      setIsCreateOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
      setNewRolePerms([]);
    } catch (error: any) {
      toast.error(roleErrorMessage(error, "Failed to create role"));
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveRole = async () => {
    if (!ensureCanManageRoles()) return;
    if (!deletingRoleId) return;

    const role = roles.find((item) => item.id === deletingRoleId);
    if (!role) {
      setDeletingRoleId(null);
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any).rpc(
        "save_current_organization_role_definition",
        {
          _role_definition_id: role.id,
          _name: role.name,
          _description: role.description,
          _permissions: role.permissions,
          _is_active: false,
        }
      );
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["organization_role_definitions"] });
      await queryClient.invalidateQueries({ queryKey: ["organization_member_role_assignments"] });
      toast.success("Role archived");
    } catch (error: any) {
      toast.error(roleErrorMessage(error, "Failed to archive role"));
    } finally {
      setDeletingRoleId(null);
      setSaving(false);
    }
  };

  const handleSaveAssignment = async (membershipId: string) => {
    if (!ensureCanManageRoles()) return;

    const roleDefinitionId = assignmentDrafts[membershipId];
    const currentAssignment = assignments.find(
      (assignment) => assignment.membership_id === membershipId
    );

    if (!roleDefinitionId || currentAssignment?.role_definition_id === roleDefinitionId) {
      return;
    }

    setSavingMembershipId(membershipId);
    try {
      const { error } = await (supabase as any).rpc(
        "assign_current_organization_member_role_definition",
        {
          _membership_id: membershipId,
          _role_definition_id: roleDefinitionId,
        }
      );

      if (error) throw error;

      await queryClient.invalidateQueries({
        queryKey: ["organization_member_role_assignments"],
      });
      toast.success("Member role assignment updated");
    } catch (error: any) {
      toast.error(roleErrorMessage(error, "Failed to assign member role"));
    } finally {
      setSavingMembershipId(null);
    }
  };

  const selectedEditAllowedPermissions = editingRole
    ? allowedPermissionsByBaseRole.get(editingRole.base_role) || []
    : [];
  const selectedCreateAllowedPermissions =
    allowedPermissionsByBaseRole.get(newRoleBaseRole) || [];

  const isLoading = rolesQuery.isLoading || assignmentsQuery.isLoading;
  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Roles & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Manage organization-scoped custom roles and assign them to team members.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreateRole}
          disabled={!canManageRoles}
          title={!canManageRoles ? "Missing role-management permission" : undefined}
        >
          Create Role
        </Button>
      </div>

      {(rolesQuery.isError || assignmentsQuery.isError) && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">
            {rolesQuery.error && roleErrorMessage(rolesQuery.error, "Failed to load roles.")}
            {assignmentsQuery.error && (
              <div>
                {roleErrorMessage(
                  assignmentsQuery.error,
                  "Failed to load member role assignments."
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-dashed">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Custom roles are organization-specific. Each custom role must stay inside its selected
          base role permission boundary.
        </p>
      </div>

      <div className="grid gap-3">
        {roles.map((role) => {
          const permCount = (role.permissions || []).length;
          const totalPerms = ALL_PERMISSIONS.length;
          return (
            <Card key={role.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium truncate">{role.name}</span>
                        {role.is_system_role && (
                          <Badge variant="secondary" className="text-[10px]">
                            System
                          </Badge>
                        )}
                        {!role.is_system_role && (
                          <Badge variant="outline" className="text-[10px]">
                            Custom
                          </Badge>
                        )}
                        {!role.is_active && (
                          <Badge variant="outline" className="text-[10px] text-amber-500">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {role.description || "No description"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Base role: {formatRoleLabel(role.base_role)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {permCount}/{totalPerms}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {role.member_count} members
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      title={canManageRoles ? "Duplicate role" : "Missing role-management permission"}
                      onClick={() => openDuplicate(role)}
                      disabled={!canManageRoles}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title={
                        canManageRoles && !role.is_system_role
                          ? "Edit role"
                          : "System roles cannot be modified"
                      }
                      onClick={() => openEdit(role)}
                      disabled={!canManageRoles || role.is_system_role}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!role.is_system_role && role.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        title={canManageRoles ? "Archive role" : "Missing role-management permission"}
                        onClick={() => setDeletingRoleId(role.id)}
                        disabled={!canManageRoles}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">Member Role Assignments</h4>
          </div>

          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members found for this organization.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Base Role</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Assign Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => {
                    const roleOptions =
                      activeAssignableRolesByBase.get(assignment.membership_role) || [];
                    const selectedRoleDefinitionId =
                      assignmentDrafts[assignment.membership_id] || assignment.role_definition_id;
                    const isDirty = selectedRoleDefinitionId !== assignment.role_definition_id;

                    return (
                      <TableRow key={assignment.membership_id}>
                        <TableCell>
                          <div className="font-medium">
                            {assignment.full_name || "Unnamed user"}
                          </div>
                          <div className="text-xs text-muted-foreground">{assignment.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatRoleLabel(assignment.membership_role)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{assignment.role_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatRoleLabel(assignment.role_base_role)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={selectedRoleDefinitionId}
                            onValueChange={(value) =>
                              setAssignmentDrafts((previous) => ({
                                ...previous,
                                [assignment.membership_id]: value,
                              }))
                            }
                          >
                            <SelectTrigger className="w-[220px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((roleOption) => (
                                <SelectItem key={roleOption.id} value={roleOption.id}>
                                  {roleOption.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSaveAssignment(assignment.membership_id)}
                            disabled={
                              !canManageRoles ||
                              !isDirty ||
                              savingMembershipId === assignment.membership_id
                            }
                          >
                            {savingMembershipId === assignment.membership_id ? "Saving..." : "Save"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input
                    value={editingRole.name}
                    onChange={(event) =>
                      setEditingRole({ ...editingRole, name: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={2}
                    value={editingRole.description}
                    onChange={(event) =>
                      setEditingRole({ ...editingRole, description: event.target.value })
                    }
                    placeholder="Describe what this role is for..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Permissions ({editingRole.permissions.length}/{ALL_PERMISSIONS.length})
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingRole({
                          ...editingRole,
                          permissions:
                            selectedEditAllowedPermissions.length > 0
                              ? selectedEditAllowedPermissions
                              : ALL_PERMISSIONS.map((permission) => permission.key),
                        })
                      }
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRole({ ...editingRole, permissions: [] })}
                    >
                      <Square className="h-3 w-3 mr-1" />
                      None
                    </Button>
                  </div>
                </div>
                {PERMISSION_GROUPS.map((group) => {
                  const groupPermissions = ALL_PERMISSIONS.filter((permission) => {
                    if (permission.group !== group) return false;
                    if (selectedEditAllowedPermissions.length === 0) return true;
                    return selectedEditAllowedPermissions.includes(permission.key);
                  });

                  if (groupPermissions.length === 0) return null;

                  return (
                    <PermissionGroupCard
                      key={group}
                      group={group}
                      permissions={groupPermissions}
                      activePermissions={editingRole.permissions}
                      onToggle={togglePermission}
                      onToggleAll={() =>
                        toggleGroupAll(
                          group,
                          editingRole.permissions,
                          (nextPermissions) =>
                            setEditingRole({ ...editingRole, permissions: nextPermissions }),
                          selectedEditAllowedPermissions
                        )
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={saving || !canManageRoles}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setNewRoleName("");
            setNewRoleDesc("");
            setNewRolePerms([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role Name *</Label>
                <Input
                  value={newRoleName}
                  onChange={(event) => setNewRoleName(event.target.value)}
                  placeholder="e.g. Night Reception"
                />
              </div>
              <div className="space-y-2">
                <Label>Base Role *</Label>
                <Select
                  value={newRoleBaseRole}
                  onValueChange={(value) => {
                    setNewRoleBaseRole(value);
                    setNewRolePerms((previous) =>
                      filterByAllowedPermissions(value, previous)
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select base role" />
                  </SelectTrigger>
                  <SelectContent>
                    {baseRoleOptions.map((roleOption) => (
                      <SelectItem key={roleOption.value} value={roleOption.value}>
                        {roleOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={(event) => setNewRoleDesc(event.target.value)}
                  placeholder="Describe what this role is for..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Permissions ({newRolePerms.length}/{ALL_PERMISSIONS.length})
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNewRolePerms(
                        selectedCreateAllowedPermissions.length > 0
                          ? selectedCreateAllowedPermissions
                          : ALL_PERMISSIONS.map((permission) => permission.key)
                      )
                    }
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setNewRolePerms([])}>
                    <Square className="h-3 w-3 mr-1" />
                    None
                  </Button>
                </div>
              </div>

              {PERMISSION_GROUPS.map((group) => {
                const groupPermissions = ALL_PERMISSIONS.filter((permission) => {
                  if (permission.group !== group) return false;
                  if (selectedCreateAllowedPermissions.length === 0) return true;
                  return selectedCreateAllowedPermissions.includes(permission.key);
                });

                if (groupPermissions.length === 0) return null;

                return (
                  <PermissionGroupCard
                    key={group}
                    group={group}
                    permissions={groupPermissions}
                    activePermissions={newRolePerms}
                    onToggle={toggleNewPermission}
                    onToggleAll={() =>
                      toggleGroupAll(
                        group,
                        newRolePerms,
                        setNewRolePerms,
                        selectedCreateAllowedPermissions
                      )
                    }
                  />
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={saving || !canManageRoles}>
              {saving ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingRoleId}
        onOpenChange={(open) => !open && setDeletingRoleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable the custom role so it cannot be assigned to additional users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleArchiveRole}
            >
              Archive Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
