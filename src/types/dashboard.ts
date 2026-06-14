import type { OrderStatus, PaymentStatus } from "@/types/common"

export interface DashboardRecentOrder {
  id: number
  order_number: string
  total: number
  status: OrderStatus
  payment_status: PaymentStatus
  created_at: string
}

export interface DashboardStats {
  total_orders: number
  total_customers: number
  total_products: number
  total_revenue: number
  pending_orders: number
  low_stock_count: number
  recent_orders: DashboardRecentOrder[]
}

export interface RevenuePoint {
  date: string
  revenue: number
  orders: number
}
