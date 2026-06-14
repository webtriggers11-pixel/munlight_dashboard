import type { OrderStatus, PaymentStatus } from "@/types/common"

export interface OrderItem {
  id: number
  product_id: number | null
  name: string
  image: string | null
  price: number
  quantity: number
  total: number
}

export interface Order {
  id: number
  order_number: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: string
  subtotal: number
  shipping_charged: number
  cod_charge: number
  discount_amount: number
  total: number
  is_free_shipping: boolean
  shipping_name: string
  shipping_phone: string
  shipping_email: string | null
  shipping_address1: string
  shipping_address2: string | null
  shipping_city: string
  shipping_state: string
  shipping_pincode: string
  coupon_code: string | null
  customer_notes: string | null
  tracking_id: string | null
  courier_name: string | null
  estimated_delivery: string | null
  tracking_url: string | null
  confirmed_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  items: OrderItem[]
  created_at: string
}

export interface OrderStatusUpdate {
  status: OrderStatus
  admin_notes?: string
}

export interface PaymentTransaction {
  id: number
  gateway: string
  amount: number
  currency: string
  status: PaymentStatus
  payment_method: string | null
  payment_mode: string | null
  gateway_order_id: string | null
  gateway_payment_id: string | null
  failure_reason: string | null
  completed_at: string | null
  initiated_at: string
}

export interface TrackingEvent {
  status: string
  description: string | null
  location: string | null
  event_time: string
}

export interface ShipmentDetail {
  id: number
  provider: string
  awb_number: string | null
  courier_name: string | null
  shiprocket_order_id: string | null
  shiprocket_shipment_id: string | null
  tracking_url: string | null
  shipment_status: string
  shipping_cost_charged: number
  shipping_cost_actual: number
  estimated_delivery: string | null
  shipped_at: string | null
  delivered_at: string | null
  tracking_events: TrackingEvent[]
  created_at: string
}

export interface OrderAdmin extends Order {
  admin_notes: string | null
  payments: PaymentTransaction[]
  shipment_detail: ShipmentDetail | null
}
