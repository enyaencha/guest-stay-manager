import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { IssueCard } from "@/components/maintenance/IssueCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockMaintenanceIssues, mockMaintenanceStaff } from "@/data/mockMaintenance";
import { MaintenanceIssue } from "@/types/maintenance";
import { 
  Wrench, 
  Plus, 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle2 
} from "lucide-react";
import { cn } from "@/lib/utils";

const Maintenance = () => {
  const [issues, setIssues] = useState(mockMaintenanceIssues);
  const [filter, setFilter] = useState("all");

  const stats = useMemo(() => ({
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    critical: issues.filter(i => i.priority === 'critical' || i.priority === 'high').length,
  }), [issues]);

  const filteredIssues = useMemo(() => {
    switch (filter) {
      case "open":
        return issues.filter(i => i.status === 'open');
      case "in-progress":
        return issues.filter(i => i.status === 'in-progress');
      case "resolved":
        return issues.filter(i => i.status === 'resolved' || i.status === 'closed');
      default:
        return issues;
    }
  }, [issues, filter]);

  const handleStatusChange = (issueId: string, newStatus: MaintenanceIssue['status']) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { 
            ...issue, 
            status: newStatus,
            resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : issue.resolvedAt
          } 
        : issue
    ));
  };

  const categoryLabels = {
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    hvac: 'HVAC',
    appliance: 'Appliance',
    furniture: 'Furniture',
    structural: 'Structural',
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
            <p className="text-muted-foreground">
              Track issues and manage repairs
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Report Issue
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-status-checkout/10">
              <Clock className="h-5 w-5 text-status-checkout" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-xs text-muted-foreground">Open Issues</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-status-maintenance/10">
              <Wrench className="h-5 w-5 text-status-maintenance" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-status-available/10">
              <CheckCircle2 className="h-5 w-5 text-status-available" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.critical}</p>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Issues */}
          <div className="lg:col-span-3 space-y-4">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">All ({issues.length})</TabsTrigger>
                <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress ({stats.inProgress})</TabsTrigger>
                <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIssues.map(issue => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>

            {filteredIssues.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No issues found
              </div>
            )}
          </div>

          {/* Staff Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Technicians</h2>
            </div>
            <div className="space-y-3">
              {mockMaintenanceStaff.map(staff => {
                const initials = staff.name.split(' ').map(n => n[0]).join('');
                return (
                  <div key={staff.id} className="p-3 bg-card rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-status-maintenance/10 text-status-maintenance text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{staff.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{staff.issuesAssigned} assigned</span>
                          <span>·</span>
                          <span>{staff.issuesResolved} resolved</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {staff.specialty.map(spec => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {categoryLabels[spec]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Maintenance;
