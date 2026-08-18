export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: string | null;
  department_name?: string | null;
  manager_id?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface LeaveType {
  id: string;
  name: string;
  default_days_per_year: number;
  requires_approval: boolean;
  is_paid: boolean;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type_id: string;
  leave_type_name?: string | null;
  year: number;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  user_name?: string | null;
  leave_type_id: string;
  leave_type_name?: string | null;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  approver_id?: string | null;
  approver_name?: string | null;
  decision_comment: string;
  days_requested: number;
  created_at: string;
  decided_at?: string | null;
}

export interface CreateLeaveRequestPayload {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface LeaveDecisionPayload {
  action: 'approve' | 'reject';
  comment?: string;
}

export interface AnalyticsSummary {
  by_status: { status: LeaveStatus; count: number }[];
  by_department: { department: string; count: number }[];
  by_month: { month: string; count: number }[];
  total_requests: number;
}

export interface ForecastResult {
  predicted_month: string;
  predicted_volume: number;
  model_type: string;
  confidence_note: string;
  historical_data: { month: string; count: number }[];
}
