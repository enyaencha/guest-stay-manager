export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  type: 'checkout-clean' | 'daily-clean' | 'deep-clean' | 'turnover';
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  estimatedMinutes: number;
}

export interface HousekeepingStaff {
  id: string;
  name: string;
  avatar?: string;
  tasksCompleted: number;
  tasksAssigned: number;
  isAvailable: boolean;
}
