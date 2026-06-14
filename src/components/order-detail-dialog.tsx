import { useEffect, useState } from "react"
import { ExternalLinkIcon, Loader2, TruckIcon } from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { formatCurrency, formatDate, titleCase } from "@/lib/format"
import { apiErrorMessage } from "@/lib/api"
import {
  confirmCod,
  confirmOrder,
  createShipment,
  getAdminOrder,
  syncShipmentTracking,
  updateOrderNotes,
} from "@/services/orders"
import type { OrderAdmin } from "@/types/order"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { RemoteImage } from "@/components/remote-image"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface OrderDetailDialogProps {
  orderId: number | null
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function OrderDetailDialog({
  orderId,
  onOpenChange,
  onUpdated,
}: OrderDetailDialogProps) {
  return (
    <Dialog open={orderId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {orderId !== null ? (
          <OrderDetailBody
            orderId={orderId}
            onUpdated={onUpdated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function OrderDetailBody({
  orderId,
  onUpdated,
}: {
  orderId: number
  onUpdated?: () => void
}) {
  const [notes, setNotes] = useState("")
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  const { data: order, loading, error, refetch } = useAsync(
    () => getAdminOrder(orderId),
    [orderId]
  )

  useEffect(() => {
    if (order) setNotes(order.admin_notes ?? "")
  }, [order])

  async function runAction(
    key: string,
    fn: () => Promise<OrderAdmin | void>
  ) {
    setActionBusy(key)
    try {
      await fn()
      refetch()
      onUpdated?.()
      toast.success("Order updated")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setActionBusy(null)
    }
  }

  const canConfirm =
    order?.status === "placed" &&
    (order.payment_status === "success" ||
      order.payment_status === "cod_pending" ||
      order.payment_status === "cod_collected")

  const canConfirmCod =
    order?.payment_method === "cod" && order.payment_status === "cod_pending"

  const canCreateShipment =
    order?.status === "confirmed" && !order.shipment_detail?.awb_number

  const hasShipment = !!order?.shipment_detail

  return (
    <>
      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : order ? (
        <>
          <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {order.order_number}
                <OrderStatusBadge status={order.status} />
              </DialogTitle>
              <DialogDescription>
                Placed {formatDate(order.created_at)} ·{" "}
                <PaymentStatusBadge status={order.payment_status} /> ·{" "}
                {order.payment_method.toUpperCase()}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">
                  Details
                </TabsTrigger>
                <TabsTrigger value="fulfilment" className="flex-1">
                  Fulfilment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-4">
                <AddressBlock order={order} />
                <ItemsBlock order={order} />
                <TotalsBlock order={order} />
                {order.payments.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Payments</p>
                      {order.payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-sm text-muted-foreground"
                        >
                          <span>
                            {p.gateway} · {titleCase(p.status)}
                          </span>
                          <span className="tabular-nums">
                            {formatCurrency(p.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="fulfilment" className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {canConfirm && (
                    <Button
                      size="sm"
                      disabled={actionBusy !== null}
                      onClick={() =>
                        runAction("confirm", () => confirmOrder(order.id))
                      }
                    >
                      {actionBusy === "confirm" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Confirm order
                    </Button>
                  )}
                  {canConfirmCod && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionBusy !== null}
                      onClick={() =>
                        runAction("cod", () => confirmCod(order.id))
                      }
                    >
                      {actionBusy === "cod" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Confirm COD collected
                    </Button>
                  )}
                  {canCreateShipment && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionBusy !== null}
                      onClick={() =>
                        runAction("shipment", () => createShipment(order.id))
                      }
                    >
                      {actionBusy === "shipment" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      <TruckIcon className="size-4" />
                      Push to Shiprocket
                    </Button>
                  )}
                  {hasShipment && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionBusy !== null}
                      onClick={() =>
                        runAction("sync", () =>
                          syncShipmentTracking(order.id)
                        )
                      }
                    >
                      {actionBusy === "sync" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Sync tracking
                    </Button>
                  )}
                </div>

                {order.shipment_detail && (
                  <div className="rounded-lg border p-4 text-sm">
                    <p className="font-medium">Shipment</p>
                    <div className="mt-2 grid gap-1 text-muted-foreground">
                      <p>
                        AWB:{" "}
                        <span className="font-mono text-foreground">
                          {order.shipment_detail.awb_number ?? "—"}
                        </span>
                      </p>
                      <p>
                        Courier: {order.shipment_detail.courier_name ?? "—"}
                      </p>
                      <p>
                        Status:{" "}
                        {titleCase(order.shipment_detail.shipment_status)}
                      </p>
                      {order.shipment_detail.tracking_url && (
                        <a
                          href={order.shipment_detail.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Track shipment
                          <ExternalLinkIcon className="size-3" />
                        </a>
                      )}
                    </div>
                    {order.shipment_detail.tracking_events.length > 0 && (
                      <ul className="mt-3 space-y-2 border-t pt-3">
                        {order.shipment_detail.tracking_events.map((ev, i) => (
                          <li key={i} className="text-xs">
                            <span className="font-medium">{ev.status}</span>
                            {ev.location && ` · ${ev.location}`}
                            <span className="block text-muted-foreground">
                              {formatDate(ev.event_time)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="admin-notes">Internal notes</Label>
                  <Textarea
                    id="admin-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Staff-only notes…"
                  />
                  <DialogFooter className="px-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionBusy !== null}
                      onClick={() =>
                        runAction("notes", () =>
                          updateOrderNotes(order.id, notes)
                        )
                      }
                    >
                      {actionBusy === "notes" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Save notes
                    </Button>
                  </DialogFooter>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
    </>
  )
}

function AddressBlock({ order }: { order: OrderAdmin }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">Shipping to</p>
      <p className="text-muted-foreground">
        {order.shipping_name} · {order.shipping_phone}
      </p>
      <p className="text-muted-foreground">
        {order.shipping_address1}
        {order.shipping_address2 ? `, ${order.shipping_address2}` : ""},{" "}
        {order.shipping_city}, {order.shipping_state} {order.shipping_pincode}
      </p>
      {order.customer_notes && (
        <p className="text-xs text-muted-foreground">
          Customer note: {order.customer_notes}
        </p>
      )}
    </div>
  )
}

function ItemsBlock({ order }: { order: OrderAdmin }) {
  return (
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
          <p className="text-sm tabular-nums">{formatCurrency(item.total)}</p>
        </div>
      ))}
    </div>
  )
}

function TotalsBlock({ order }: { order: OrderAdmin }) {
  return (
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
        <Row label="COD charge" value={formatCurrency(order.cod_charge)} />
      )}
      <Separator className="my-2" />
      <div className="flex items-center justify-between font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatCurrency(order.total)}</span>
      </div>
    </div>
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
