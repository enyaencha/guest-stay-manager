export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  type: 'checkout-clean' | 'daily-clean' | 'deep-clean' | 'turndown' | 'inspection';
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  notes?: string;
  amenities?: Array<{
    itemId?: string;
    name: string;
    brand?: string;
    lotId?: string;
    expiryDate?: string | null;
    quantity: number;
    unit: string;
  }>;
  actualAdded?: Array<{
    itemId?: string;
    name: string;
    brand?: string;
    lotId?: string;
    expiryDate?: string | null;
    quantity: number;
    unit: string;
  }>;
  restockNotes?: string;
  actualAddedNotes?: string;
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
