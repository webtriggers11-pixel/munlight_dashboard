import type { OrderStatus, PaymentStatus } from "@/types/common"

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_initiated",
  "refunded",
]

// Statuses that block payment — cannot confirm
export const PAYMENT_BLOCKED: PaymentStatus[] = ["pending", "failed", "cancelled"]

// Which statuses an admin can manually transition to from a given status.
// "placed → confirmed" is intentionally excluded — use the /confirm endpoint.
// shipped / out_for_delivery / delivered are no longer manually settable here —
// they now advance automatically from Shiprocket's own status via the webhook
// (or a manual "Sync tracking" pull as fallback). Manually setting them risked
// getting out of sync with the real courier status, and "delivered" also
// triggers auto-mark-COD-as-collected — that should only fire on a real
// delivery confirmation, not a manual click.
//
// Mirrors _ALLOWED_TRANSITIONS in the API's order_service.py — keep both in step.
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:          ["cancelled"],
  placed:           ["cancelled"],           // confirm via dedicated button only
  confirmed:        ["processing", "cancelled"],
  processing:       ["cancelled"],
  shipped:          [],
  out_for_delivery: [],
  delivered:        ["refund_initiated"],
  cancelled:        ["refund_initiated"],
  refund_initiated: ["refunded"],
  refunded:         [],
}

export function getAllowedStatuses(order: {
  status: OrderStatus
  payment_status: PaymentStatus
}): OrderStatus[] {
  const base = ALLOWED_TRANSITIONS[order.status] ?? []
  // If payment is not resolved, block confirm even though placed → confirmed
  // is already excluded above; also block any forward moves for pending orders
  if (PAYMENT_BLOCKED.includes(order.payment_status)) {
    return base.filter((s) => s === "cancelled")
  }
  return base
}
