export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type IssueCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'furniture' | 'structural' | 'other';

export interface MaintenanceIssue {
  id: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  assignedTo?: string;
  reportedAt: string;
  resolvedAt?: string;
  images?: string[];
}

export interface MaintenanceStaff {
  id: string;
  name: string;
  specialty: IssueCategory[];
  issuesResolved: number;
  issuesAssigned: number;
  isAvailable: boolean;
}
