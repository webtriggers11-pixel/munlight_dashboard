import type { OrderStatus, PaymentStatus } from "@/types/common"

// Refund statuses are deliberately absent: refunds aren't supported yet (nothing
// is sent to Razorpay), so no order can be moved into them.
export const ALL_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
]

// Statuses that block payment — cannot confirm
export const PAYMENT_BLOCKED: PaymentStatus[] = ["pending", "failed", "cancelled"]

// Which statuses an admin can manually transition to from a given status.
// "placed → confirmed" is intentionally excluded — use the /confirm endpoint.
// shipped / out_for_delivery / delivered are no longer manually settable here —
// they now advance automatically from Shiprocket's own status via the webhook
// (or a manual "Sync tracking" pull as fallback). Manually setting them risked
// getting out of sync with the real courier status.
// Delivered and cancelled are final.
//
// Mirrors _ALLOWED_TRANSITIONS in the API's order_service.py — keep both in step.
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:          ["cancelled"],
  placed:           ["cancelled"],           // confirm via dedicated button only
  confirmed:        ["processing", "cancelled"],
  processing:       ["cancelled"],
  shipped:          [],
  out_for_delivery: [],
  delivered:        [],
  cancelled:        [],
  refund_initiated: [],
  refunded:         [],
}

export function getAllowedStatuses(order: {
  status: OrderStatus
  payment_status: PaymentStatus
  shipment_status?: string | null
}): OrderStatus[] {
  // The courier brought the parcel back undelivered: cancelling closes the order
  // out and returns the items to stock (the API allows exactly this one move).
  if (
    (order.status === "shipped" || order.status === "out_for_delivery") &&
    order.shipment_status === "rto_delivered"
  ) {
    return ["cancelled"]
  }

  const base = ALLOWED_TRANSITIONS[order.status] ?? []
  // If payment is not resolved, block confirm even though placed → confirmed
  // is already excluded above; also block any forward moves for pending orders
  if (PAYMENT_BLOCKED.includes(order.payment_status)) {
    return base.filter((s) => s === "cancelled")
  }
  return base
}
