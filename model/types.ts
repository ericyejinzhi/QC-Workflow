export type UserRole = 'operator' | 'engineer' | 'qc_head' | 'approver' | 'inventory_manager'

export type ProductType = 'fins' | 'bottom_roll' | 'sleeve' | 'case' | 'palette'

export type DispositionDecision = 'scrap' | 'sort' | 'return_to_line'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type RejectionStatus = 'pending_disposition' | 'pending_approval' | 'approved' | 'rejected'

export interface Product {
  id: string
  name: string
  product_type: ProductType
  created_at: string
}

export interface Rejection {
  id: string
  created_at: string
  submitted_by: string
  product_id: string
  quantity: number
  rejection_reason: string
  status: RejectionStatus
}

export interface Disposition {
  id: string
  rejection_id: string
  decision: DispositionDecision
  notes: string
  decided_by: string
  decided_at: string
  approval_status: ApprovalStatus
}

export interface Approval {
  id: string
  disposition_id: string
  reviewed_by: string
  reviewed_at: string
  status: ApprovalStatus
  comments?: string
}

export interface UserProfile {
  id: string
  username: string
  full_name: string
  role: UserRole
}
