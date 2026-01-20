export type OverallCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
export type IssueType = 'damage' | 'theft' | 'noise_complaint' | 'policy_violation' | 'late_payment' | 'other';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';

export interface RoomAssessment {
  id: string;
  booking_id?: string;
  guest_id?: string;
  room_number: string;
  assessed_by?: string;
  assessment_date: string;
  overall_condition: OverallCondition;
  damages_found: boolean;
  damage_description?: string;
  damage_cost: number;
  missing_items: MissingItem[];
  extra_cleaning_required: boolean;
  notes?: string;
  photos: string[];
  created_at: string;
}

export interface MissingItem {
  name: string;
  quantity: number;
  cost: number;
}

export interface GuestIssue {
  id: string;
  guest_id: string;
  booking_id?: string;
  room_number: string;
  issue_type: IssueType;
  description: string;
  severity: IssueSeverity;
  cost_incurred: number;
  resolved: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface RefundRequest {
  id: string;
  booking_id: string;
  guest_id?: string;
  room_number: string;
  amount_paid: number;
  refund_amount: number;
  reason: string;
  room_assessment_id?: string;
  items_utilized: UtilizedItem[];
  deductions: number;
  status: RefundStatus;
  requested_by?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  guest_name?: string;
  assessment?: RoomAssessment;
}

export interface UtilizedItem {
  name: string;
  quantity: number;
  cost: number;
}

export interface RoomSupply {
  id: string;
  booking_id?: string;
  room_number: string;
  item_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  is_complimentary: boolean;
  restocked_by?: string;
  restocked_at: string;
}
