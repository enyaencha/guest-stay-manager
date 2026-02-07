import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStaff } from "@/hooks/useStaff";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatKsh } from "@/lib/formatters";
import { DollarSign, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface StaffSalary {
  id: string;
  staff_id: string;
  month: string;
  base_salary: number;
  deductions: number;
  bonuses: number;
  net_salary: number;
  payment_status: string;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  staff?: { name: string; department: string } | null;
}

export const SalaryManagement = () => {
  const { data: staffList = [] } = useStaff();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [saving, setSaving] = useState(false);

  const { data: salaries = [], isLoading } = useQuery({
    queryKey: ["staff_salaries", selectedMonth],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("staff_salaries")
        .select("*, staff:staff_id (name, department)")
        .eq("month", selectedMonth)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as StaffSalary[];
    },
  });

  const activeStaff = staffList.filter((s) => s.status === "active");

  const stats = useMemo(() => {
    const totalPayroll = salaries.reduce((sum, s) => sum + s.net_salary, 0);
    const paid = salaries.filter((s) => s.payment_status === "paid");
    const pending = salaries.filter((s) => s.payment_status === "pending");
    const overdue = salaries.filter((s) => s.payment_status === "overdue");
    return { totalPayroll, paidCount: paid.length, pendingCount: pending.length, overdueCount: overdue.length };
  }, [salaries]);

  const handleGeneratePayroll = async () => {
    setSaving(true);
    try {
      const staffWithSalary = activeStaff.filter((s) => (s as any).salary > 0);
      if (staffWithSalary.length === 0) {
        toast.error("No active staff with salary configured. Update employee salary first.");
        return;
      }
      const existing = salaries.map((s) => s.staff_id);
      const newEntries = staffWithSalary
        .filter((s) => !existing.includes(s.id))
        .map((s) => ({
          staff_id: s.id,
          month: selectedMonth,
          base_salary: (s as any).salary || 0,
          deductions: 0,
          bonuses: 0,
          net_salary: (s as any).salary || 0,
          payment_status: "pending",
        }));

      if (newEntries.length === 0) {
        toast.info("Payroll already generated for all active staff this month.");
        return;
      }

      const { error } = await (supabase as any).from("staff_salaries").insert(newEntries);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["staff_salaries"] });
      toast.success(`Payroll generated for ${newEntries.length} staff members`);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate payroll");
    } finally {
      setSaving(false);
      setIsPayrollOpen(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!payingId) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("staff_salaries")
        .update({
          payment_status: "paid",
          payment_date: format(new Date(), "yyyy-MM-dd"),
          payment_method: payMethod,
        })
        .eq("id", payingId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["staff_salaries"] });
      toast.success("Salary marked as paid");
      setIsPayOpen(false);
      setPayingId(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update payment");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-600";
      case "pending": return "bg-amber-500";
      case "overdue": return "bg-destructive";
      default: return "";
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, i, 1);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Salary & Payroll
          </h3>
          <p className="text-sm text-muted-foreground">Manage monthly staff salaries and track payments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setIsPayrollOpen(true)}>
            Generate Payroll
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {stats.overdueCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              {stats.overdueCount} overdue salary payment{stats.overdueCount > 1 ? "s" : ""}!
            </p>
            <p className="text-xs text-muted-foreground">Please process pending payments immediately.</p>
          </div>
        </div>
      )}
      {stats.pendingCount > 0 && stats.overdueCount === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
          <Clock className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-600">
              {stats.pendingCount} salary payment{stats.pendingCount > 1 ? "s" : ""} pending for this month.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
          <DollarSign className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Total Payroll</p>
            <p className="font-semibold">{formatKsh(stats.totalPayroll)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="font-semibold">{stats.paidCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
          <Clock className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="font-semibold">{stats.pendingCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Staff Count</p>
            <p className="font-semibold">{salaries.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {salaries.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No payroll records for this month. Click "Generate Payroll" to create entries.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Base Salary</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Bonuses</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((sal) => (
                  <TableRow key={sal.id}>
                    <TableCell className="font-medium">{sal.staff?.name || "—"}</TableCell>
                    <TableCell>{sal.staff?.department || "—"}</TableCell>
                    <TableCell className="text-right">{formatKsh(sal.base_salary)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatKsh(sal.deductions)}</TableCell>
                    <TableCell className="text-right text-emerald-600">{formatKsh(sal.bonuses)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatKsh(sal.net_salary)}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(sal.payment_status)}>{sal.payment_status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {sal.payment_status !== "paid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPayingId(sal.id);
                            setIsPayOpen(true);
                          }}
                        >
                          Mark Paid
                        </Button>
                      )}
                      {sal.payment_status === "paid" && sal.payment_date && (
                        <span className="text-xs text-muted-foreground">{sal.payment_date}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Generate Payroll Dialog */}
      <Dialog open={isPayrollOpen} onOpenChange={setIsPayrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will create salary records for all active staff with a configured salary for <strong>{selectedMonth}</strong>.
            Staff already in the payroll will be skipped.
          </p>
          <p className="text-sm">
            <strong>{activeStaff.filter((s) => (s as any).salary > 0).length}</strong> staff members with salary configured.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayrollOpen(false)}>Cancel</Button>
            <Button onClick={handleGeneratePayroll} disabled={saving}>
              {saving ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Salary as Paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={saving}>
              {saving ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
