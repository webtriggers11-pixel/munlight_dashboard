import { useEffect, useMemo, useState } from "react"
import { CalendarClockIcon, ExternalLinkIcon, Loader2, TruckIcon } from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { formatCurrency, formatDate, titleCase } from "@/lib/format"
import { apiErrorMessage } from "@/lib/api"
import {
  confirmCod,
  confirmOrder,
  createShipment,
  getAdminOrder,
  schedulePickup,
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
  const pickupOptions = useMemo(() => pickupDateOptions(), [])
  const [pickupDate, setPickupDate] = useState(
    () => pickupOptions[0]?.value ?? todayISODate()
  )

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

  // Confirm + create shipment run as two independent backend calls (not one
  // atomic endpoint) so a Shiprocket failure never rolls back an already-
  // successful order confirmation — the order stays "confirmed" and the
  // existing "Push to Shiprocket" button becomes the retry path.
  async function handleConfirmAndShip(o: OrderAdmin) {
    setActionBusy("confirm")
    try {
      await confirmOrder(o.id)
    } catch (err) {
      toast.error(apiErrorMessage(err))
      setActionBusy(null)
      refetch()
      onUpdated?.()
      return
    }

    setActionBusy("shipment")
    try {
      await createShipment(o.id)
      toast.success("Order confirmed and pushed to Shiprocket")
    } catch (err) {
      toast.warning(
        `Order confirmed, but shipment creation failed: ${apiErrorMessage(err)}. ` +
          `Use "Push to Shiprocket" below to retry.`
      )
    } finally {
      setActionBusy(null)
      refetch()
      onUpdated?.()
    }
  }

  // Pickup gets its own handler (not runAction) so we can compare the date the
  // manager picked against the date Shiprocket actually booked, and tell them
  // clearly when the requested slot wasn't available and got shifted.
  async function handleSchedulePickup(o: OrderAdmin) {
    setActionBusy("pickup")
    try {
      const updated = await schedulePickup(o.id, pickupDate)
      refetch()
      onUpdated?.()
      const booked = updated.shipment_detail?.pickup_scheduled_date
      const bookedDay = booked ? booked.slice(0, 10) : null
      if (bookedDay && bookedDay !== pickupDate) {
        toast.warning(
          `Requested ${formatPickupDate(pickupDate)} wasn't available — ` +
            `Shiprocket scheduled pickup for ${formatPickupDate(bookedDay)}.`
        )
      } else {
        toast.success(
          bookedDay
            ? `Pickup scheduled for ${formatPickupDate(bookedDay)}`
            : "Pickup scheduled"
        )
      }
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

  // Pickup can be scheduled once an AWB exists and the courier hasn't picked it
  // up yet. The backend rejects a second schedule, so hide it afterwards.
  const canSchedulePickup =
    !!order?.shipment_detail?.awb_number &&
    order.shipment_detail.shipment_status === "label_created"

  const pickupScheduled =
    order?.shipment_detail?.shipment_status === "pickup_scheduled"

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
                      onClick={() => handleConfirmAndShip(order)}
                    >
                      {(actionBusy === "confirm" || actionBusy === "shipment") && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Confirm & Create Shipment
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

                {canSchedulePickup && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Schedule pickup</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Select a date for the courier to collect this shipment. If
                      the date isn&apos;t available, Shiprocket books the nearest
                      slot and we&apos;ll show the confirmed date.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pickupOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          size="sm"
                          variant={
                            pickupDate === opt.value ? "default" : "outline"
                          }
                          disabled={actionBusy !== null}
                          onClick={() => setPickupDate(opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        disabled={actionBusy !== null || !pickupDate}
                        onClick={() => handleSchedulePickup(order)}
                      >
                        {actionBusy === "pickup" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CalendarClockIcon className="size-4" />
                        )}
                        Schedule pickup
                      </Button>
                    </div>
                  </div>
                )}

                {pickupScheduled && (
                  <div className="rounded-lg border border-dashed p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <CalendarClockIcon className="size-4 shrink-0" />
                      Pickup scheduled with the courier
                    </div>
                    <div className="mt-1 grid gap-0.5 text-muted-foreground">
                      {order.shipment_detail?.pickup_scheduled_date && (
                        <p>
                          Date:{" "}
                          <span className="text-foreground">
                            {formatPickupDate(
                              order.shipment_detail.pickup_scheduled_date
                            )}
                          </span>
                        </p>
                      )}
                      {order.shipment_detail?.pickup_token_number && (
                        <p>
                          Pickup token:{" "}
                          <span className="font-mono text-foreground">
                            {order.shipment_detail.pickup_token_number}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

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

// Local YYYY-MM-DD (not UTC) so the default date matches the admin's timezone.
function toISODate(d: Date): string {
  const tzOffsetMs = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}

function todayISODate(): string {
  return toISODate(new Date())
}

// Shiprocket-style pickup date chips. We generate these ourselves (Today,
// Tomorrow, then upcoming days) because Shiprocket's public API does not expose
// the list of couriers' available slots. Sundays are skipped as most couriers
// don't collect then; if the manager still hits an unavailable date, Shiprocket
// shifts it to the nearest slot and we surface the confirmed date afterwards.
function pickupDateOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const start = new Date()
  let offset = 0
  while (options.length < 6) {
    const d = new Date(start)
    d.setDate(start.getDate() + offset)
    offset += 1
    if (d.getDay() === 0 && options.length > 0) continue // skip Sundays (keep today)
    const value = toISODate(d)
    let label: string
    if (offset - 1 === 0) label = "Today"
    else if (offset - 1 === 1) label = "Tomorrow"
    else
      label = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    options.push({ value, label })
  }
  return options
}

// Formats "2026-09-18" or "2026-09-18 12:44:00" → "18 Sep 2026".
function formatPickupDate(value: string): string {
  const day = value.slice(0, 10)
  const parsed = new Date(`${day}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
