// Shared API envelope + enums. The backend wraps every response in
// { success, message, data }, and list endpoints add pagination siblings.

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedEnvelope<T> {
  success: boolean
  message: string
  data: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export type UserRole = "customer" | "admin" | "super_admin"

export type OrderStatus =
  | "pending"
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refund_initiated"
  | "refunded"

export type PaymentStatus =
  | "initiated"
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partial_refund"
  | "cod_pending"
  | "cod_collected"
