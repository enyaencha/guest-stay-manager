import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useStaff, 
  useRoles, 
  useUserRoles, 
  useCreateStaff, 
  useUpdateStaff,
  useAssignRole,
  useUpdateUserRole,
  Role,
  UserRole
} from "@/hooks/useStaff";
import { useLogAudit } from "@/hooks/useAuditLog";
import { Users, Plus, Edit, Search, UserCheck, Shield, CalendarIcon, Clock, UserX, UserPlus, Link2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { BulkStaffImport } from "./BulkStaffImport";
import { AuditLogViewer } from "./AuditLogViewer";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_PASSWORD = "HAVEN2026";

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  status: string;
  employment_type: 'permanent' | 'temporary';
  contract_end_date: Date | null;
}

interface RoleAssignmentData {
  user_id: string;
  role_id: string;
  valid_until: Date | null;
}

export const StaffManagement = () => {
  const { user } = useAuth();
  const { data: staff = [], isLoading: staffLoading, refetch: refetchStaff } = useStaff();
  const { data: roles = [] } = useRoles();
  const { data: userRoles = [], refetch: refetchUserRoles } = useUserRoles();
  
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const assignRole = useAssignRole();
  const updateUserRole = useUpdateUserRole();
  const logAudit = useLogAudit();

  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [selectedStaffForRole, setSelectedStaffForRole] = useState<{ id: string; user_id: string | null; name: string } | null>(null);
  
  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    email: "",
    phone: "",
    department: "",
    status: "active",
    employment_type: "permanent",
    contract_end_date: null,
  });

  const [roleAssignment, setRoleAssignment] = useState<RoleAssignmentData>({
    user_id: "",
    role_id: "",
    valid_until: null,
  });

  // Check and deactivate expired staff on component mount
  useEffect(() => {
    const checkExpiredStaff = async () => {
      const { error } = await supabase.rpc('deactivate_expired_staff');
      if (!error) {
        refetchStaff();
        refetchUserRoles();
      }
    };
    checkExpiredStaff();
  }, []);

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const departments = ["Management", "Operations", "Reception", "Housekeeping", "Maintenance", "F&B", "Security", "Finance"];

  const handleInputChange = (field: keyof StaffFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      department: "",
      status: "active",
      employment_type: "permanent",
      contract_end_date: null,
    });
    setEditingStaff(null);
  };

  const handleAddStaff = async () => {
    if (!formData.name || !formData.department) {
      toast.error("Please fill in required fields");
      return;
    }

    const staffData = await createStaff.mutateAsync({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      department: formData.department,
      status: formData.status,
      employment_type: formData.employment_type,
      contract_end_date: formData.contract_end_date ? format(formData.contract_end_date, 'yyyy-MM-dd') : null,
      user_id: null,
      joined_date: format(new Date(), 'yyyy-MM-dd'),
      avatar_url: null,
    });

    // Log audit
    await logAudit.mutateAsync({
      action: "staff_created",
      entityType: "staff",
      entityId: staffData.id,
      newValues: {
        name: formData.name,
        department: formData.department,
        employment_type: formData.employment_type,
      },
      metadata: {
        staff_name: formData.name,
      },
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditStaff = async () => {
    if (!editingStaff) return;

    const staffMember = staff.find(s => s.id === editingStaff);
    const oldValues = staffMember ? {
      name: staffMember.name,
      department: staffMember.department,
      status: staffMember.status,
      employment_type: staffMember.employment_type,
    } : null;

    await updateStaff.mutateAsync({
      id: editingStaff,
      updates: {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        department: formData.department,
        status: formData.status,
        employment_type: formData.employment_type,
        contract_end_date: formData.contract_end_date ? format(formData.contract_end_date, 'yyyy-MM-dd') : null,
      }
    });

    // Log audit
    await logAudit.mutateAsync({
      action: "staff_updated",
      entityType: "staff",
      entityId: editingStaff,
      oldValues,
      newValues: {
        name: formData.name,
        department: formData.department,
        status: formData.status,
        employment_type: formData.employment_type,
      },
      metadata: {
        staff_name: formData.name,
      },
    });

    setEditingStaff(null);
    resetForm();
  };

  const openEditDialog = (member: any) => {
    setEditingStaff(member.id);
    setFormData({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      department: member.department,
      status: member.status,
      employment_type: member.employment_type || 'permanent',
      contract_end_date: member.contract_end_date ? parseISO(member.contract_end_date) : null,
    });
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const staffMember = staff.find(s => s.id === id);
    
    await updateStaff.mutateAsync({
      id,
      updates: { status: newStatus }
    });

    // Log audit
    await logAudit.mutateAsync({
      action: newStatus === 'active' ? "staff_activated" : "staff_deactivated",
      entityType: "staff",
      entityId: id,
      oldValues: { status: currentStatus },
      newValues: { status: newStatus },
      metadata: {
        staff_name: staffMember?.name,
      },
    });
  };

  const handleCreateUserForStaff = async (member: any) => {
    if (!member.email) {
      toast.error("Staff member needs an email address to create a user account");
      return;
    }

    setIsCreatingUser(true);
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: member.email,
        password: DEFAULT_PASSWORD,
        options: {
          data: { full_name: member.name },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Link user to staff
        await supabase
          .from("staff")
          .update({ user_id: authData.user.id })
          .eq("id", member.id);

        // Set password reset required
        await supabase
          .from("profiles")
          .update({ password_reset_required: true })
          .eq("user_id", authData.user.id);

        // Log audit
        await logAudit.mutateAsync({
          action: "user_linked",
          entityType: "staff",
          entityId: member.id,
          newValues: { user_id: authData.user.id },
          metadata: {
            staff_name: member.name,
            email: member.email,
          },
        });

        toast.success(`User account created for ${member.name}. Default password: ${DEFAULT_PASSWORD}`);
        refetchStaff();
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user account");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleLinkToCurrentUser = async (member: any) => {
    if (!user) {
      toast.error("You must be signed in to link a staff member");
      return;
    }

    if (member.user_id) {
      toast.error("This staff member is already linked to a user account");
      return;
    }

    const existingLink = staff.find((s) => s.user_id === user.id);
    if (existingLink && existingLink.id !== member.id) {
      toast.error(`Your account is already linked to ${existingLink.name}`);
      return;
    }

    try {
      await supabase
        .from("staff")
        .update({ user_id: user.id })
        .eq("id", member.id);

      await logAudit.mutateAsync({
        action: "user_linked",
        entityType: "staff",
        entityId: member.id,
        newValues: { user_id: user.id },
        metadata: {
          staff_name: member.name,
          linked_by: user.email || user.id,
        },
      });

      toast.success(`Linked ${member.name} to your account`);
      refetchStaff();
      refetchUserRoles();
    } catch (error: any) {
      console.error("Error linking user:", error);
      toast.error(error.message || "Failed to link staff member");
    }
  };

  const openRoleDialog = (member: any) => {
    setSelectedStaffForRole({ id: member.id, user_id: member.user_id, name: member.name });
    setRoleAssignment({
      user_id: member.user_id || "",
      role_id: "",
      valid_until: null,
    });
    setIsRoleDialogOpen(true);
  };

  const handleAssignRole = async () => {
    if (!selectedStaffForRole?.user_id) {
      toast.error("This staff member is not linked to a user account yet");
      return;
    }

    if (!roleAssignment.role_id) {
      toast.error("Please select a role");
      return;
    }

    const selectedRole = roles.find(r => r.id === roleAssignment.role_id);

    // Check if role already exists for this user
    const existingRole = userRoles.find(
      ur => ur.user_id === selectedStaffForRole.user_id && ur.role_id === roleAssignment.role_id
    );

    if (existingRole) {
      // Update existing role
      await updateUserRole.mutateAsync({
        id: existingRole.id,
        updates: {
          is_active: true,
          valid_until: roleAssignment.valid_until ? roleAssignment.valid_until.toISOString() : null,
        }
      });

      // Log audit
      await logAudit.mutateAsync({
        action: "role_updated",
        entityType: "user_role",
        entityId: existingRole.id,
        newValues: {
          role_name: selectedRole?.name,
          valid_until: roleAssignment.valid_until?.toISOString() || null,
        },
        metadata: {
          staff_name: selectedStaffForRole.name,
        },
      });
    } else {
      // Create new role assignment
      await assignRole.mutateAsync({
        user_id: selectedStaffForRole.user_id,
        role_id: roleAssignment.role_id,
        is_active: true,
        valid_from: new Date().toISOString(),
        valid_until: roleAssignment.valid_until ? roleAssignment.valid_until.toISOString() : null,
        assigned_by: null,
      });

      // Log audit
      await logAudit.mutateAsync({
        action: "role_assigned",
        entityType: "user_role",
        entityId: roleAssignment.role_id,
        newValues: {
          role_name: selectedRole?.name,
          valid_until: roleAssignment.valid_until?.toISOString() || null,
        },
        metadata: {
          staff_name: selectedStaffForRole.name,
          user_id: selectedStaffForRole.user_id,
        },
      });
    }

    setIsRoleDialogOpen(false);
    setSelectedStaffForRole(null);
  };

  const getStaffRoles = (userId: string | null): Role[] => {
    if (!userId) return [];
    const staffRoleIds = userRoles
      .filter(ur => ur.user_id === userId && ur.is_active)
      .map(ur => ur.role_id);
    return roles.filter(r => staffRoleIds.includes(r.id));
  };

  const getRoleExpiry = (userId: string | null, roleId: string): string | null => {
    if (!userId) return null;
    const ur = userRoles.find(ur => ur.user_id === userId && ur.role_id === roleId && ur.is_active);
    return ur?.valid_until || null;
  };

  const isContractExpired = (contractEndDate: string | null): boolean => {
    if (!contractEndDate) return false;
    return isBefore(parseISO(contractEndDate), startOfDay(new Date()));
  };

  const StaffForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="email@example.com"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="+254..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employment Type *</Label>
          <Select 
            value={formData.employment_type} 
            onValueChange={(value: 'permanent' | 'temporary') => handleInputChange("employment_type", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="permanent">Permanent</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {formData.employment_type === 'temporary' && (
          <div className="space-y-2">
            <Label>Contract End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.contract_end_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.contract_end_date ? format(formData.contract_end_date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.contract_end_date || undefined}
                  onSelect={(date) => handleInputChange("contract_end_date", date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {isEdit && (
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  if (staffLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Manage staff members, roles, and access permissions</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <BulkStaffImport />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Staff Member</DialogTitle>
                  <DialogDescription>Enter the details for the new staff member</DialogDescription>
                </DialogHeader>
                <StaffForm />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddStaff} disabled={createStaff.isPending}>
                    {createStaff.isPending ? "Adding..." : "Add Staff"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Staff ({staff.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({staff.filter(s => s.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="temporary">Temporary ({staff.filter(s => s.employment_type === 'temporary').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <StaffTable 
              staff={filteredStaff} 
              roles={roles}
              getStaffRoles={getStaffRoles}
              getRoleExpiry={getRoleExpiry}
              isContractExpired={isContractExpired}
              onEdit={openEditDialog}
              onToggleStatus={handleToggleStatus}
              onAssignRole={openRoleDialog}
              onCreateUser={handleCreateUserForStaff}
              onLinkToCurrentUser={handleLinkToCurrentUser}
              isCreatingUser={isCreatingUser}
            />
          </TabsContent>

          <TabsContent value="active">
            <StaffTable 
              staff={filteredStaff.filter(s => s.status === 'active')} 
              roles={roles}
              getStaffRoles={getStaffRoles}
              getRoleExpiry={getRoleExpiry}
              isContractExpired={isContractExpired}
              onEdit={openEditDialog}
              onToggleStatus={handleToggleStatus}
              onAssignRole={openRoleDialog}
              onCreateUser={handleCreateUserForStaff}
              onLinkToCurrentUser={handleLinkToCurrentUser}
              isCreatingUser={isCreatingUser}
            />
          </TabsContent>

          <TabsContent value="temporary">
            <StaffTable 
              staff={filteredStaff.filter(s => s.employment_type === 'temporary')} 
              roles={roles}
              getStaffRoles={getStaffRoles}
              getRoleExpiry={getRoleExpiry}
              isContractExpired={isContractExpired}
              onEdit={openEditDialog}
              onToggleStatus={handleToggleStatus}
              onAssignRole={openRoleDialog}
              onCreateUser={handleCreateUserForStaff}
              onLinkToCurrentUser={handleLinkToCurrentUser}
              isCreatingUser={isCreatingUser}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Staff Dialog */}
        <Dialog open={!!editingStaff} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>Update staff member details</DialogDescription>
            </DialogHeader>
            <StaffForm isEdit />
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleEditStaff} disabled={updateStaff.isPending}>
                {updateStaff.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Assignment Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role</DialogTitle>
              <DialogDescription>
                Assign a system role to {selectedStaffForRole?.name}
              </DialogDescription>
            </DialogHeader>
            
            {!selectedStaffForRole?.user_id ? (
              <div className="py-6 text-center">
                <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  This staff member is not linked to a user account.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  They need to sign up with their email to be assigned system roles.
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Role</Label>
                  <Select 
                    value={roleAssignment.role_id} 
                    onValueChange={(value) => setRoleAssignment(prev => ({ ...prev, role_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex flex-col">
                            <span>{role.name}</span>
                            {role.description && (
                              <span className="text-xs text-muted-foreground">{role.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Access Valid Until (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !roleAssignment.valid_until && "text-muted-foreground"
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {roleAssignment.valid_until 
                          ? format(roleAssignment.valid_until, "PPP") 
                          : "Permanent access"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={roleAssignment.valid_until || undefined}
                        onSelect={(date) => setRoleAssignment(prev => ({ ...prev, valid_until: date || null }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Leave empty for permanent access, or set a date for temporary access
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
              {selectedStaffForRole?.user_id && (
                <Button onClick={handleAssignRole} disabled={assignRole.isPending || updateUserRole.isPending}>
                  {assignRole.isPending || updateUserRole.isPending ? "Assigning..." : "Assign Role"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Audit Log Viewer */}
        <div className="mt-6">
          <AuditLogViewer />
        </div>
      </CardContent>
    </Card>
  );
};

// Separate table component for reusability
interface StaffTableProps {
  staff: any[];
  roles: Role[];
  getStaffRoles: (userId: string | null) => Role[];
  getRoleExpiry: (userId: string | null, roleId: string) => string | null;
  isContractExpired: (date: string | null) => boolean;
  onEdit: (member: any) => void;
  onToggleStatus: (id: string, status: string) => void;
  onAssignRole: (member: any) => void;
  onCreateUser?: (member: any) => void;
  onLinkToCurrentUser?: (member: any) => void;
  isCreatingUser?: boolean;
}

const StaffTable = ({ 
  staff, 
  roles, 
  getStaffRoles, 
  getRoleExpiry, 
  isContractExpired,
  onEdit, 
  onToggleStatus,
  onAssignRole,
  onCreateUser,
  onLinkToCurrentUser,
  isCreatingUser 
}: StaffTableProps) => {
  if (staff.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No staff members found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((member) => {
            const staffRoles = getStaffRoles(member.user_id);
            const expired = member.employment_type === 'temporary' && isContractExpired(member.contract_end_date);
            
            return (
              <TableRow key={member.id} className={expired ? "bg-destructive/5" : ""}>
                <TableCell>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                  </div>
                </TableCell>
                <TableCell>{member.department}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={member.employment_type === 'permanent' ? 'default' : 'outline'}>
                      {member.employment_type === 'permanent' ? 'Permanent' : 'Temporary'}
                    </Badge>
                    {member.employment_type === 'temporary' && member.contract_end_date && (
                      <span className={cn(
                        "text-xs",
                        expired ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {expired ? 'Expired: ' : 'Until: '}
                        {format(parseISO(member.contract_end_date), 'PP')}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {staffRoles.length > 0 ? (
                      staffRoles.map(role => {
                        const expiry = getRoleExpiry(member.user_id, role.id);
                        return (
                          <Badge 
                            key={role.id} 
                            variant="secondary" 
                            className="text-xs"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {role.name}
                            {expiry && (
                              <span className="ml-1 opacity-70">
                                ({format(parseISO(expiry), 'MMM d')})
                              </span>
                            )}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {member.user_id ? 'No roles' : 'Not linked'}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={member.status === 'active' ? 'default' : 'secondary'}
                    className={cn(
                      "cursor-pointer",
                      member.status === 'active' ? 'bg-emerald-600' : ''
                    )}
                    onClick={() => onToggleStatus(member.id, member.status)}
                  >
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {onCreateUser && !member.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCreateUser(member)}
                        disabled={isCreatingUser}
                        title="Create user with default password"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                    {onLinkToCurrentUser && !member.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLinkToCurrentUser(member)}
                        title="Link this staff member to my account"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEdit(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onAssignRole(member)}
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
