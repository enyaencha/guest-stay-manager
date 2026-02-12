import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useStaff } from "@/hooks/useStaff";
import { supabase } from "@/integrations/supabase/client";
import { useTabQueryParam } from "@/hooks/useTabQueryParam";
import { toast } from "sonner";
import { Calendar, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const MyProfile = () => {
  const { user } = useAuth();
  const { data: staff = [] } = useStaff();
  const staffRecord = useMemo(
    () => staff.find((s) => s.user_id === user?.id),
    [staff, user?.id]
  );
  const [activeTab, setActiveTab] = useTabQueryParam({
    key: "tab",
    defaultValue: "timesheets",
    allowed: ["timesheets", "leave"],
  });

  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [timesheetDate, setTimesheetDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("0");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [submittingTimesheet, setSubmittingTimesheet] = useState(false);

  const handleLeaveSubmit = async () => {
    if (!staffRecord) {
      toast.error("Staff record not found");
      return;
    }
    if (!leaveStart || !leaveEnd) {
      toast.error("Select leave dates");
      return;
    }
    setSubmittingLeave(true);
    try {
      const { error } = await supabase
        .from("staff_leave_requests" as any)
        .insert({
          staff_id: staffRecord.id,
          start_date: leaveStart,
          end_date: leaveEnd,
          leave_type: leaveType,
          reason: leaveReason?.trim() || null,
          status: "pending",
        });
      if (error) throw error;
      toast.success("Leave request submitted");
      setLeaveType("Annual Leave");
      setLeaveStart("");
      setLeaveEnd("");
      setLeaveReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit leave");
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleTimesheetSubmit = async () => {
    if (!staffRecord) {
      toast.error("Staff record not found");
      return;
    }
    if (!timesheetDate || !startTime || !endTime) {
      toast.error("Fill in date and times");
      return;
    }
    setSubmittingTimesheet(true);
    try {
      const start = new Date(`${timesheetDate}T${startTime}`);
      const end = new Date(`${timesheetDate}T${endTime}`);
      const breakMins = parseInt(breakMinutes) || 0;
      const hours = Math.max(0, (end.getTime() - start.getTime()) / 36e5 - breakMins / 60);

      const { error } = await supabase
        .from("staff_timesheets" as any)
        .insert({
          staff_id: staffRecord.id,
          work_date: timesheetDate,
          start_time: startTime,
          end_time: endTime,
          break_minutes: breakMins,
          activity_types: activityTypes,
          total_hours: Math.round(hours * 100) / 100,
          notes: notes || null,
          status: "submitted",
        });
      if (error) throw error;
      toast.success("Timesheet submitted");
      setTimesheetDate("");
      setStartTime("");
      setEndTime("");
      setBreakMinutes("0");
      setActivityTypes([]);
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit timesheet");
    } finally {
      setSubmittingTimesheet(false);
    }
  };

  const { data: timesheets = [] } = useQuery({
    queryKey: ["staff_timesheets", staffRecord?.id],
    enabled: !!staffRecord?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("staff_timesheets")
        .select("*")
        .eq("staff_id", staffRecord?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as { id: string; work_date: string; start_time: string; end_time: string; total_hours: number; status: string; notes: string | null }[];
    },
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ["staff_leave_requests", staffRecord?.id],
    enabled: !!staffRecord?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("staff_leave_requests")
        .select("*")
        .eq("staff_id", staffRecord?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as { id: string; start_date: string; end_date: string; reason: string | null; status: string }[];
    },
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Work Records</h1>
            <p className="text-muted-foreground">Manage your timesheets and leave requests.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="timesheets" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timesheets
            </TabsTrigger>
            <TabsTrigger value="leave" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Leave Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timesheets" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">Track your daily work hours.</div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">Add Timesheet</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Timesheet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input type="date" value={timesheetDate} onChange={(e) => setTimesheetDate(e.target.value)} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Start Time *</Label>
                        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time *</Label>
                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Break Duration (minutes)</Label>
                      <Input type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} placeholder="30" />
                    </div>
                    <div className="space-y-2">
                      <Label>Activity Types</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Front Desk", "Housekeeping", "Maintenance", "Kitchen", "Service", "Admin", "Training", "Other"].map((act) => (
                          <label key={act} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={activityTypes.includes(act)}
                              onChange={(e) => {
                                if (e.target.checked) setActivityTypes([...activityTypes, act]);
                                else setActivityTypes(activityTypes.filter((a) => a !== act));
                              }}
                              className="rounded border-input"
                            />
                            {act}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button onClick={handleTimesheetSubmit} disabled={submittingTimesheet}>
                        {submittingTimesheet ? "Submitting..." : "Submit Timesheet"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                {timesheets.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No timesheets submitted yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timesheets.map((sheet) => (
                        <TableRow key={sheet.id}>
                          <TableCell>{sheet.work_date}</TableCell>
                          <TableCell>
                            {sheet.start_time} → {sheet.end_time}
                          </TableCell>
                          <TableCell>{sheet.total_hours}h</TableCell>
                          <TableCell className="capitalize">{sheet.status}</TableCell>
                          <TableCell>{sheet.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">Submit leave requests for approval.</div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    Request Leave
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Request Leave</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Leave Type</Label>
                      <Select value={leaveType} onValueChange={setLeaveType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Annual Leave",
                            "Sick Leave",
                            "Personal Leave",
                            "Compassionate Leave",
                            "Maternity Leave",
                            "Paternity Leave",
                            "Unpaid Leave",
                          ].map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button onClick={handleLeaveSubmit} disabled={submittingLeave}>
                        {submittingLeave ? "Submitting..." : "Submit Request"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                {leaveRequests.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No leave requests submitted.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dates</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            {request.start_date} → {request.end_date}
                          </TableCell>
                          <TableCell>{request.reason || "—"}</TableCell>
                          <TableCell className="capitalize">{request.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default MyProfile;
