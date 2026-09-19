import { Badge } from "@/components/ui/badge"
import { titleCase } from "@/lib/format"
import type { OrderStatus, PaymentStatus } from "@/types/common"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const ORDER_VARIANTS: Partial<Record<OrderStatus, BadgeVariant>> = {
  delivered: "default",
  shipped: "secondary",
  out_for_delivery: "secondary",
  processing: "secondary",
  confirmed: "secondary",
  placed: "outline",
  pending: "outline",
  cancelled: "destructive",
  refunded: "destructive",
  refund_initiated: "destructive",
}

const PAYMENT_VARIANTS: Partial<Record<PaymentStatus, BadgeVariant>> = {
  success: "default",
  cod_collected: "default",
  failed: "destructive",
  cancelled: "destructive",
  refunded: "destructive",
  partial_refund: "destructive",
}

const SHIPMENT_VARIANTS: Record<string, BadgeVariant> = {
  delivered: "default",
  in_transit: "secondary",
  out_for_delivery: "secondary",
  picked_up: "secondary",
  pickup_scheduled: "secondary",
  delivery_failed: "destructive",
  rto_initiated: "destructive",
  rto_delivered: "destructive",
  cancelled: "destructive",
}

const SHIPMENT_LABELS: Record<string, string> = {
  rto_initiated: "Returning (RTO)",
  rto_delivered: "Returned (RTO)",
}

// The courier's view of an order — separate from the order's own status, so a
// parcel that failed delivery or is coming back is visible in the list.
export function ShipmentStatusBadge({ status }: { status: string | null }) {
  if (!status || status === "not_created") {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <Badge variant={SHIPMENT_VARIANTS[status] ?? "outline"}>
      {SHIPMENT_LABELS[status] ?? titleCase(status)}
    </Badge>
  )
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={ORDER_VARIANTS[status] ?? "outline"} className="capitalize">
      {titleCase(status)}
    </Badge>
  )
}

export function ActivePill({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-muted-foreground/30 bg-muted text-muted-foreground"
      }
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant={PAYMENT_VARIANTS[status] ?? "outline"}
      className="capitalize"
    >
      {titleCase(status)}
    </Badge>
  )
}
