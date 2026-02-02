import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaskCard } from "@/components/housekeeping/TaskCard";
import { StaffCard } from "@/components/housekeeping/StaffCard";
import { AddHousekeepingTaskModal } from "@/components/housekeeping/AddHousekeepingTaskModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHousekeepingTasks, useHousekeepingStaff, useUpdateHousekeepingTask, HousekeepingTask as DBTask } from "@/hooks/useHousekeeping";
import { useUpdateRoom } from "@/hooks/useRooms";
import { HousekeepingTask, HousekeepingStaff } from "@/types/housekeeping";
import { 
  ClipboardList, 
  Plus, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { Json } from "@/integrations/supabase/types";

// Map database task to legacy format
const mapToLegacyTask = (task: DBTask): HousekeepingTask => ({
  id: task.id,
  roomId: task.room_id || '',
  roomNumber: task.room_number,
  roomName: task.room_name || '',
  type: task.task_type as HousekeepingTask['type'],
  priority: task.priority as HousekeepingTask['priority'],
  status: task.status as HousekeepingTask['status'],
  assignedTo: task.assigned_to_name || undefined,
  notes: task.notes || undefined,
  amenities: Array.isArray(task.amenities) ? task.amenities as any[] : [],
  restockNotes: task.restock_notes || undefined,
  actualAdded: Array.isArray(task.actual_added) ? task.actual_added as any[] : undefined,
  actualAddedNotes: task.actual_added_notes || undefined,
  createdAt: task.created_at,
  completedAt: task.completed_at || undefined,
  estimatedMinutes: task.estimated_minutes || 30,
});

// Map database staff to legacy format
const mapToLegacyStaff = (staff: any): HousekeepingStaff => ({
  id: staff.id,
  name: staff.name,
  tasksCompleted: staff.tasks_completed || 0,
  tasksAssigned: staff.tasks_assigned || 0,
  isAvailable: staff.is_available ?? true,
});

const Housekeeping = () => {
  const { data: dbTasks, isLoading: tasksLoading } = useHousekeepingTasks();
  const { data: dbStaff, isLoading: staffLoading } = useHousekeepingStaff();
  const updateTask = useUpdateHousekeepingTask();
  const updateRoom = useUpdateRoom();
  
  const [filter, setFilter] = useState("all");
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const tasks = useMemo(() => {
    if (!dbTasks) return [];
    return dbTasks.map(mapToLegacyTask);
  }, [dbTasks]);

  const staff = useMemo(() => {
    if (!dbStaff) return [];
    return dbStaff.map(mapToLegacyStaff);
  }, [dbStaff]);

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
    updateTask.mutate({
      id: taskId,
      updates: {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      },
    });

    const task = tasks.find((t) => t.id === taskId);
    if (task?.roomId) {
      const cleaningStatus =
        newStatus === "in-progress" ? "in-progress" : newStatus === "pending" ? "dirty" : "clean";
      updateRoom.mutate({
        id: task.roomId,
        updates: {
          cleaning_status: cleaningStatus,
        },
      });
    }
  };

  const handleAmenitiesUpdate = (taskId: string, amenities: NonNullable<HousekeepingTask['actualAdded']>) => {
    updateTask.mutate({
      id: taskId,
      updates: {
        actual_added: amenities as unknown as Json,
      },
    });
  };

  const handleActualNotesUpdate = (taskId: string, notes: string) => {
    updateTask.mutate({
      id: taskId,
      updates: {
        actual_added_notes: notes,
      },
    });
  };

  if (tasksLoading || staffLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

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
          <Button className="gap-2" onClick={() => setAddTaskOpen(true)}>
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
                  onAmenitiesUpdate={handleAmenitiesUpdate}
                  onActualNotesUpdate={handleActualNotesUpdate}
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
              {staff.map(s => (
                <StaffCard key={s.id} staff={s} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddHousekeepingTaskModal open={addTaskOpen} onOpenChange={setAddTaskOpen} />
    </MainLayout>
  );
};

export default Housekeeping;
