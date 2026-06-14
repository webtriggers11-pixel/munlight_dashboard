import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/format"
import { apiErrorMessage } from "@/lib/api"
import { confirmOrder } from "@/services/orders"
import type { Order } from "@/types/order"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RemoteImage } from "@/components/remote-image"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge"

interface OrderDetailDialogProps {
  order: Order | null
  onOpenChange: (open: boolean) => void
  onConfirmed?: (updated: Order) => void
}

export function OrderDetailDialog({
  order,
  onOpenChange,
  onConfirmed,
}: OrderDetailDialogProps) {
  const [confirming, setConfirming] = useState(false)

  async function handleConfirm() {
    if (!order) return
    setConfirming(true)
    try {
      const updated = await confirmOrder(order.id)
      toast.success(`Order ${order.order_number} confirmed`)
      onConfirmed?.(updated)
      onOpenChange(false)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setConfirming(false)
    }
  }

  const canConfirm =
    order?.status === "placed" &&
    (order.payment_status === "success" ||
      order.payment_status === "cod_pending" ||
      order.payment_status === "cod_collected")

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {order.order_number}
                <OrderStatusBadge status={order.status} />
              </DialogTitle>
              <DialogDescription>
                Placed {formatDate(order.created_at)} ·{" "}
                <PaymentStatusBadge status={order.payment_status} /> ·{" "}
                {order.payment_method.toUpperCase()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1 text-sm">
              <p className="font-medium">Shipping to</p>
              <p className="text-muted-foreground">
                {order.shipping_name} · {order.shipping_phone}
              </p>
              <p className="text-muted-foreground">
                {order.shipping_address1}
                {order.shipping_address2
                  ? `, ${order.shipping_address2}`
                  : ""}
                , {order.shipping_city}, {order.shipping_state}{" "}
                {order.shipping_pincode}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <RemoteImage
                    value={item.image}
                    alt={item.name}
                    className="size-12 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
              {order.discount_amount > 0 && (
                <Row
                  label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
                  value={`− ${formatCurrency(order.discount_amount)}`}
                />
              )}
              <Row
                label="Shipping"
                value={
                  order.is_free_shipping
                    ? "Free"
                    : formatCurrency(order.shipping_charged)
                }
              />
              {order.cod_charge > 0 && (
                <Row
                  label="COD charge"
                  value={formatCurrency(order.cod_charge)}
                />
              )}
              <Separator className="my-2" />
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            {order.tracking_id && (
              <p className="text-xs text-muted-foreground">
                Tracking: {order.courier_name ?? ""} {order.tracking_id}
              </p>
            )}

            {canConfirm && (
              <DialogFooter>
                <Button onClick={handleConfirm} disabled={confirming} className="w-full">
                  {confirming && <Loader2 className="size-4 animate-spin" />}
                  Confirm Order
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
