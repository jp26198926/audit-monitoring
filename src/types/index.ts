// TypeScript types for the Audit Monitoring System

export type UserRole = "Admin" | "Encoder" | "Viewer";
export type AuditStatus = "Planned" | "Ongoing" | "Completed" | "Closed";
export type AuditResult =
  | "Satisfactory"
  | "Unsatisfactory"
  | "With Observations"
  | "Not Applicable";
export type FindingCategory = "Major" | "Minor" | "Observation";
export type FindingStatus =
  | "Open"
  | "In Progress"
  | "Submitted"
  | "Closed"
  | "Overdue";
export type VesselStatus = "Active" | "Inactive";

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Vessel {
  id: number;
  vessel_name: string;
  registration_number: string;
  status: VesselStatus;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AuditType {
  id: number;
  type_name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AuditParty {
  id: number;
  party_name: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AuditResultType {
  id: number;
  result_name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Audit {
  id: number;
  vessel_id: number;
  audit_type_id: number;
  audit_party_id: number;
  audit_reference: string;
  audit_start_date: Date | string;
  audit_end_date: Date | string | null;
  next_due_date: Date | string | null;
  location: string | null;
  status: AuditStatus;
  audit_result_id: number | null;
  report_file_path: string | null;
  remarks: string | null;
  created_by: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Finding {
  id: number;
  audit_id: number;
  category: FindingCategory;
  description: string;
  root_cause: string | null;
  corrective_action: string | null;
  responsible_person: string | null;
  target_date: Date | string;
  status: FindingStatus;
  closure_date: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Attachment {
  id: number;
  finding_id: number;
  file_path: string;
  uploaded_by: number;
  uploaded_at: Date | string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  audits: {
    total_ytd: number;
    upcoming_30days: number;
    completed: number;
    overdue: number;
  };
  findings: {
    total: number;
    open: number;
    overdue: number;
    closed_this_month: number;
  };
}

export interface ChartData {
  monthly_audit_trend: Array<{ month: string; count: number }>;
  findings_by_category: Array<{ category: FindingCategory; count: number }>;
  audits_by_party: Array<{ party_name: string; count: number }>;
}

export interface DashboardFilters {
  vessel_id?: number;
  audit_type_id?: number;
  audit_party_id?: number;
  status?: AuditStatus;
  date_from?: string;
  date_to?: string;
}
