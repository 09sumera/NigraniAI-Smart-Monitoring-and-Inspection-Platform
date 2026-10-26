export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'official' | 'officer' | 'ngo_manager' | 'ngo' | 'auditor' | 'viewer';
  phone?: string;
  state?: string;
  district?: string;
  designation?: string;
  is_active: boolean;
  last_login?: string;
}

export interface Project {
  id: number;
  project_id: string;
  name: string;
  institution_name: string;
  institution_type: string;
  scheme?: string;
  scheme_id?: number;
  state: string;
  district: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  project_manager?: string;
  contact_email?: string;
  contact_phone?: string;
  registered_beneficiaries: number;
  sanctioned_capacity: number;
  status: 'active' | 'inactive' | 'suspended';
  compliance_score: number;
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  camera_count: number;
  last_inspection_date?: string;
  next_inspection_due?: string;
  created_at?: string;
}

export interface Inspection {
  id: number;
  inspection_id: string;
  project_id: number;
  project_code?: string;
  project_name?: string;
  institution_name?: string;
  institution_type?: string;
  project_state?: string;
  district?: string;
  assigned_officer?: string;
  officer_id?: number;
  inspection_type: 'surprise' | 'scheduled' | 'emergency' | 'follow_up';
  status: 'assigned' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'closed';
  observations?: string;
  findings?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  score?: number;
  corrective_actions_required?: boolean;
  latitude?: number;
  longitude?: number;
  planned_at?: string;
  submitted_at?: string;
  created_at?: string;
}

export interface Assignment {
  id: number;
  inspection_id?: string;
  inspection_pk?: number;
  project_id: number;
  project_code?: string;
  project_name?: string;
  institution_name?: string;
  institution_type?: string;
  project_state?: string;
  district?: string;
  risk_level?: string;
  officer_id: number;
  officer_name?: string;
  created_by?: number;
  created_by_name?: string;
  inspection_type: string;
  assignment_reason: string;
  risk_score_at_assignment: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  is_announced: boolean;
  scheduled_at?: string;
  created_at?: string;
}

export interface Alert {
  id: number;
  project_id?: number;
  project_name?: string;
  project_state?: string;
  alert_type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  risk_score?: number;
  triggering_factors?: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  is_ai_generated: boolean;
  reviewer_notes?: string;
  reviewed_at?: string;
  created_at?: string;
}

export interface Evidence {
  id: number;
  evidence_id: string;
  project_id?: number;
  project_name?: string;
  inspection_id?: number;
  uploader_name?: string;
  evidence_type: 'photo' | 'video' | 'document';
  file_name: string;
  file_url?: string;
  download_url?: string;
  file_size?: number;
  file_hash?: string;
  description?: string;
  captured_at?: string;
  received_at?: string;
  latitude?: number;
  longitude?: number;
  verification_status: 'pending' | 'verified' | 'rejected' | 'flagged';
  reviewer_id?: number;
  reviewer_name?: string;
  reviewer_notes?: string;
  reviewed_at?: string;
  inspection_code?: string;
  inspection_status?: string;
  created_at?: string;
}

export interface Camera {
  id: number;
  project_id: number;
  project_name?: string;
  name: string;
  location_desc: string;
  stream_url?: string;
  status: 'connected' | 'disconnected' | 'simulated' | 'unauthorized';
  last_heartbeat?: string;
  is_active: boolean;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}
