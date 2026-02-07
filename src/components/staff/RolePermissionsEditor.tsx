import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRoles } from "@/hooks/useStaff";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Edit, Plus, Save, Info } from "lucide-react";
import { ALL_PERMISSIONS, PERMISSION_GROUPS } from "@/lib/permissions";
import { PermissionGroupCard } from "./PermissionGroupCard";

interface EditingRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system_role: boolean;
}

export const RolePermissionsEditor = () => {
  const { data: roles = [], isLoading } = useRoles();
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<EditingRole | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const openEdit = (role: any) => {
    setEditingRole({
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissions: [...(role.permissions || [])],
      is_system_role: role.is_system_role,
    });
  };

  const togglePermission = (perm: string) => {
    if (!editingRole) return;
    setEditingRole((prev) => {
      if (!prev) return prev;
      const perms = prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: perms };
    });
  };

  const toggleNewPerm = (perm: string) => {
    setNewRolePerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleGroupAll = (group: string, currentPerms: string[], setter: (perms: string[]) => void) => {
    const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group).map((p) => p.key);
    const allEnabled = groupPerms.every((p) => currentPerms.includes(p));
    if (allEnabled) {
      setter(currentPerms.filter((p) => !groupPerms.includes(p)));
    } else {
      setter([...new Set([...currentPerms, ...groupPerms])]);
    }
  };

  const handleSaveRole = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("roles")
        .update({
          name: editingRole.name,
          description: editingRole.description || null,
          permissions: editingRole.permissions,
        })
        .eq("id", editingRole.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(`Role "${editingRole.name}" updated`);
      setEditingRole(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("roles").insert({
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || null,
        permissions: newRolePerms,
        is_system_role: false,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(`Role "${newRoleName}" created`);
      setIsCreateOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
      setNewRolePerms([]);
    } catch (e: any) {
      toast.error(e.message || "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Roles & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Control exactly what each role can see, create, and manage.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-dashed">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <strong>View</strong> = see the page · <strong>Create</strong> = add new items (tasks, issues, sales) · <strong>Manage</strong> = edit, delete, and reassign. 
          Remove a permission to hide the action from that role's users.
        </p>
      </div>

      <div className="grid gap-3">
        {roles.map((role) => {
          const permCount = (role.permissions || []).length;
          const totalPerms = ALL_PERMISSIONS.length;
          return (
            <Card key={role.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {role.is_system_role && (
                          <Badge variant="secondary" className="text-[10px]">System</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{role.description || "No description"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {permCount}/{totalPerms} permissions
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Grouped summary */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {PERMISSION_GROUPS.map((group) => {
                    const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
                    const active = groupPerms.filter((p) => (role.permissions || []).includes(p.key));
                    if (active.length === 0) return null;
                    return (
                      <Badge 
                        key={group} 
                        variant={active.length === groupPerms.length ? "default" : "outline"} 
                        className="text-[10px] font-normal"
                      >
                        {group} ({active.length}/{groupPerms.length})
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Role Dialog */}
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
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Permissions</Label>
                {PERMISSION_GROUPS.map((group) => {
                  const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
                  return (
                    <PermissionGroupCard
                      key={group}
                      group={group}
                      permissions={groupPerms}
                      activePermissions={editingRole.permissions}
                      onToggle={togglePermission}
                      onToggleAll={() =>
                        toggleGroupAll(group, editingRole.permissions, (perms) =>
                          setEditingRole({ ...editingRole, permissions: perms })
                        )
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role Name *</Label>
                <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. Night Receptionist" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} placeholder="Short description" />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Permissions</Label>
              {PERMISSION_GROUPS.map((group) => {
                const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
                return (
                  <PermissionGroupCard
                    key={group}
                    group={group}
                    permissions={groupPerms}
                    activePermissions={newRolePerms}
                    onToggle={toggleNewPerm}
                    onToggleAll={() => toggleGroupAll(group, newRolePerms, setNewRolePerms)}
                  />
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRole} disabled={saving}>
              {saving ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
