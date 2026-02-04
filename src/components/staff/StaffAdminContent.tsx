import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StaffManagement } from "@/components/settings/StaffManagement";
import { useStaff, useRoles, useUserRoles } from "@/hooks/useStaff";
import { Users, Shield, ClipboardCheck, Check, X, UserPlus } from "lucide-react";

interface LeaveRequest {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  staff?: {
    name: string;
    department: string;
    email?: string | null;
    phone?: string | null;
  } | null;
}

interface Timesheet {
  id: string;
  staff_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  notes: string | null;
  status: "submitted" | "approved" | "rejected";
  created_at: string;
  staff?: {
    name: string;
    department: string;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export const StaffAdminContent = () => {
  const [activeTab, setActiveTab] = useState("employees");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("HAVEN2026");
  const [newUserRole, setNewUserRole] = useState<string>("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const queryClient = useQueryClient();
  const { data: staff = [] } = useStaff();
  const { data: roles = [] } = useRoles();
  const { data: userRoles = [] } = useUserRoles();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name");
      if (error) throw error;
      return (data || []) as { user_id: string; full_name?: string | null; email?: string | null }[];
    },
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ["staff_leave_requests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("staff_leave_requests")
        .select("*, staff:staff_id (name, department, email, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LeaveRequest[];
    },
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ["staff_timesheets"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("staff_timesheets")
        .select("*, staff:staff_id (name, department, email, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Timesheet[];
    },
  });

  const pendingLeaves = leaveRequests.filter((r) => r.status === "pending");
  const pendingTimesheets = timesheets.filter((t) => t.status === "submitted");
  const systemUsers = profiles;

  const getStaffRoles = (userId: string | null) => {
    if (!userId) return [];
    const roleIds = userRoles.filter((ur) => ur.user_id === userId && ur.is_active).map((ur) => ur.role_id);
    return roles.filter((role) => roleIds.includes(role.id));
  };

  const getStaffForUser = (userId: string) => staff.find((member) => member.user_id === userId);

  const updateLeaveStatus = async (id: string, status: LeaveRequest["status"]) => {
    const { error } = await supabase
      .from("staff_leave_requests" as any)
      .update({ status })
      .eq("id", id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["staff_leave_requests"] });
    toast.success(`Leave request ${status}`);
  };

  const updateTimesheetStatus = async (id: string, status: Timesheet["status"]) => {
    const { error } = await supabase
      .from("staff_timesheets" as any)
      .update({ status })
      .eq("id", id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["staff_timesheets"] });
    toast.success(`Timesheet ${status}`);
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setIsCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role_id: newUserRole || null,
        },
      });
      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("User created. Temporary password set.");
      setIsUserDialogOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("HAVEN2026");
      setNewUserRole("");
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to create user.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const stats = useMemo(
    () => [
      { label: "Employees", value: staff.length },
      { label: "System Users", value: systemUsers.length },
      { label: "Pending Leaves", value: pendingLeaves.length },
      { label: "Pending Timesheets", value: pendingTimesheets.length },
    ],
    [staff.length, systemUsers.length, pendingLeaves.length, pendingTimesheets.length]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
          <CardDescription>Manage staff records, system access, and approvals.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs font-medium text-muted-foreground">{stat.label}</div>
                <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto">
          <TabsTrigger value="employees" className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Employees</span>
          </TabsTrigger>
          <TabsTrigger value="system-users" className="flex items-center gap-2 py-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">System Users</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2 py-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Approvals</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <StaffManagement />
        </TabsContent>

        <TabsContent value="system-users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>System User Accounts</CardTitle>
                  <CardDescription>Staff linked to login accounts and roles.</CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add System User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Temporary Password</Label>
                        <Input value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Assign Role (optional)</Label>
                        <Select value={newUserRole} onValueChange={setNewUserRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                          {isCreatingUser ? "Creating..." : "Create User"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
            <CardContent>
              {systemUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No system users linked yet.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemUsers.map((member) => {
                        const staffRoles = getStaffRoles(member.user_id);
                        const staffMatch = getStaffForUser(member.user_id);
                        return (
                          <TableRow key={member.user_id}>
                            <TableCell className="font-medium">
                              {member.full_name || staffMatch?.name || "User"}
                            </TableCell>
                            <TableCell>{member.email || staffMatch?.email || "—"}</TableCell>
                            <TableCell>{staffMatch?.department || "—"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {staffRoles.length > 0 ? (
                                  staffRoles.map((role) => (
                                    <Badge key={role.id} variant="secondary" className="text-xs">
                                      {role.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">No roles</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={staffMatch?.status === "active" ? "default" : "secondary"}
                                className={staffMatch?.status === "active" ? "bg-emerald-600" : ""}
                              >
                                {staffMatch?.status || "unlinked"}
                              </Badge>
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
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Timesheets</CardTitle>
              <CardDescription>Review and approve staff time submissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTimesheets.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No pending timesheets.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTimesheets.map((sheet) => (
                        <TableRow key={sheet.id}>
                          <TableCell className="font-medium">{sheet.staff?.name || "Staff"}</TableCell>
                          <TableCell>{sheet.staff?.department || "—"}</TableCell>
                          <TableCell>{sheet.work_date}</TableCell>
                          <TableCell>
                            {sheet.start_time} → {sheet.end_time}
                          </TableCell>
                          <TableCell>{sheet.total_hours}h</TableCell>
                          <TableCell>{sheet.notes || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => updateTimesheetStatus(sheet.id, "approved")}>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateTimesheetStatus(sheet.id, "rejected")}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>Approve or reject leave requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLeaves.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No pending leave requests.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLeaves.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.staff?.name || "Staff"}</TableCell>
                          <TableCell>{request.staff?.department || "—"}</TableCell>
                          <TableCell>
                            {request.start_date} → {request.end_date}
                          </TableCell>
                          <TableCell>{request.reason || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => updateLeaveStatus(request.id, "approved")}>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateLeaveStatus(request.id, "rejected")}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
