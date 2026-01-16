import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaskCard } from "@/components/housekeeping/TaskCard";
import { StaffCard } from "@/components/housekeeping/StaffCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockHousekeepingTasks, mockHousekeepingStaff } from "@/data/mockHousekeeping";
import { HousekeepingTask } from "@/types/housekeeping";
import { 
  ClipboardList, 
  Plus, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

const Housekeeping = () => {
  const [tasks, setTasks] = useState(mockHousekeepingTasks);
  const [filter, setFilter] = useState("all");

  const stats = useMemo(() => ({
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    urgent: tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case "pending":
        return tasks.filter(t => t.status === 'pending');
      case "in-progress":
        return tasks.filter(t => t.status === 'in-progress');
      case "completed":
        return tasks.filter(t => t.status === 'completed');
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const handleStatusChange = (taskId: string, newStatus: HousekeepingTask['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : task.completedAt
          } 
        : task
    ));
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Housekeeping</h1>
            <p className="text-muted-foreground">
              Manage cleaning tasks and coordinate staff
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-status-checkout/10">
              <Clock className="h-5 w-5 text-status-checkout" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-status-cleaning/10">
              <ClipboardList className="h-5 w-5 text-status-cleaning" />
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
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.urgent}</p>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tasks */}
          <div className="lg:col-span-3 space-y-4">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress ({stats.inProgress})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No tasks found
              </div>
            )}
          </div>

          {/* Staff Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Staff</h2>
            </div>
            <div className="space-y-2">
              {mockHousekeepingStaff.map(staff => (
                <StaffCard key={staff.id} staff={staff} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Housekeeping;
