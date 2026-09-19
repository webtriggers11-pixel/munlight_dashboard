import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2,
  MoreHorizontalIcon,
  RefreshCwIcon,
  TruckIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import { formatCurrency, formatDateTime, titleCase } from "@/lib/format"
import { formatPickupDate } from "@/lib/pickup-dates"
import { getAllowedStatuses } from "@/lib/order-transitions"
import {
  getAdminOrder,
  syncShipmentTracking,
  updateOrderNotes,
  updateOrderStatus,
} from "@/services/orders"
import type { OrderStatus } from "@/types/common"
import type { OrderAdmin } from "@/types/order"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RemoteImage } from "@/components/remote-image"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge"
import { OrderFulfilmentActions } from "@/components/order-fulfilment-actions"
import { OrderDocumentsCard } from "@/components/order-documents-card"

export default function OrderDetailPage() {
  const { orderId = "" } = useParams()
  const id = Number(orderId)

  const { data: order, loading, error, refetch } = useAsync(
    () =>
      Number.isNaN(id)
        ? Promise.reject(new Error("That order id isn’t valid."))
        : getAdminOrder(id),
    [id]
  )

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return <NotFound message={error ?? "Order not found."} />
  }

  return (
    <div className="flex flex-col gap-5">
      <BackLink />
      <OrderHeader order={order} onUpdated={refetch} />
      <FulfilmentStepper order={order} />
      <OrderFulfilmentActions order={order} onUpdated={refetch} />
      <OrderDocumentsCard order={order} />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <ItemsCard order={order} />
          <ShipmentCard order={order} />
          <PaymentsCard order={order} />
        </div>

        <div className="flex flex-col gap-5">
          <CustomerCard order={order} />
          <StatusCard order={order} onUpdated={refetch} />
          <NotesCard order={order} onUpdated={refetch} />
          <MetaCard order={order} />
        </div>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/orders"
      className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon className="size-4" /> Back to orders
    </Link>
  )
}

function NotFound({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4">
      <BackLink />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}

/* ── header ─────────────────────────────────────────────────────────────── */

function OrderHeader({
  order,
  onUpdated,
}: {
  order: OrderAdmin
  onUpdated: () => void
}) {
  const [syncing, setSyncing] = useState(false)
  const unitCount = order.items.reduce((n, i) => n + i.quantity, 0)

  async function handleSync() {
    setSyncing(true)
    try {
      await syncShipmentTracking(order.id)
      onUpdated()
      toast.success("Tracking synced")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSyncing(false)
    }
  }

  function copyOrderNumber() {
    navigator.clipboard
      .writeText(order.order_number)
      .then(() => toast.success("Order number copied"))
      .catch(() => toast.error("Couldn’t copy the order number"))
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-semibold tracking-tight">
            {order.order_number}
          </h1>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Placed {formatDateTime(order.created_at)} ·{" "}
          {order.payment_method.toUpperCase()} · {order.items.length} item
          {order.items.length === 1 ? "" : "s"} ({unitCount} unit
          {unitCount === 1 ? "" : "s"}) · {formatCurrency(order.total)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {order.shipment_detail && (
          <Button variant="outline" disabled={syncing} onClick={handleSync}>
            {syncing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCwIcon />
            )}
            Sync tracking
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More actions">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={copyOrderNumber}>
              <CopyIcon />
              Copy order number
            </DropdownMenuItem>
            {order.shipment_detail?.tracking_url && (
              <DropdownMenuItem asChild>
                <a
                  href={order.shipment_detail.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon />
                  Open courier tracking
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/* ── stepper ────────────────────────────────────────────────────────────── */

type StepState = "done" | "current" | "pending" | "cancelled"

interface Step {
  label: string
  hint: string
  state: StepState
}

// The six milestones an order passes through, read straight off the timestamps
// the API already returns. The first unfinished one is marked "current" so the
// stepper and the Next step card always agree on where the order is.
function buildSteps(order: OrderAdmin): Step[] {
  const shipment = order.shipment_detail
  const cancelled =
    order.status === "cancelled" ||
    order.status === "refund_initiated" ||
    order.status === "refunded"

  const pickupBooked =
    !!shipment?.pickup_scheduled_at || !!shipment?.pickup_scheduled_date

  const raw: { label: string; hint: string; done: boolean }[] = [
    {
      label: "Placed",
      hint: formatDateTime(order.created_at),
      done: true,
    },
    {
      label: "Confirmed",
      hint: order.confirmed_at ? formatDateTime(order.confirmed_at) : "By you",
      done: !!order.confirmed_at,
    },
    {
      label: "Label created",
      hint: shipment?.awb_number ?? "Shiprocket",
      done: !!shipment?.awb_number,
    },
    {
      label: "Pickup",
      hint:
        pickupBooked && shipment?.pickup_scheduled_date
          ? formatPickupDate(shipment.pickup_scheduled_date)
          : "Scheduled by you",
      done: pickupBooked,
    },
    {
      label: "Shipped",
      hint: order.shipped_at ? formatDateTime(order.shipped_at) : "Auto via webhook",
      done: !!order.shipped_at,
    },
    {
      label: "Delivered",
      hint: order.delivered_at
        ? formatDateTime(order.delivered_at)
        : "Auto via webhook",
      done: !!order.delivered_at,
    },
  ]

  let currentTaken = false
  const steps: Step[] = raw.map((s) => {
    if (s.done) return { label: s.label, hint: s.hint, state: "done" }
    if (cancelled) return { label: s.label, hint: "—", state: "pending" }
    if (!currentTaken) {
      currentTaken = true
      return { label: s.label, hint: s.hint, state: "current" }
    }
    return { label: s.label, hint: s.hint, state: "pending" }
  })

  if (cancelled) {
    steps.push({
      label: titleCase(order.status),
      hint: order.cancelled_at ? formatDateTime(order.cancelled_at) : "—",
      state: "cancelled",
    })
  }

  return steps
}

function FulfilmentStepper({ order }: { order: OrderAdmin }) {
  const steps = buildSteps(order)

  return (
    <Card>
      <CardContent className="flex items-start overflow-x-auto">
        {steps.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-start">
            <div className="flex min-w-24 flex-1 flex-col items-center gap-2 text-center">
              <StepDot state={step.state} />
              <div>
                <p
                  className={
                    step.state === "pending"
                      ? "text-sm font-medium text-muted-foreground"
                      : "text-sm font-semibold"
                  }
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.hint}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={
                  "mt-3.5 h-0.5 min-w-4 flex-1 " +
                  (steps[i + 1].state === "done" ? "bg-foreground" : "bg-border")
                }
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function StepDot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-background">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    )
  }
  if (state === "current") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full border-2 border-foreground">
        <span className="size-2 rounded-full bg-foreground" />
      </span>
    )
  }
  if (state === "cancelled") {
    return <span className="size-7 rounded-full bg-destructive" />
  }
  return <span className="size-7 rounded-full border bg-muted" />
}

/* ── items ──────────────────────────────────────────────────────────────── */

function ItemsCard({ order }: { order: OrderAdmin }) {
  const unitCount = order.items.reduce((n, i) => n + i.quantity, 0)

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <span>Items</span>
          <span className="text-xs font-normal text-muted-foreground">
            {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
            {unitCount} unit{unitCount === 1 ? "" : "s"}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col">
        {order.items.map((item, i) => (
          <div
            key={item.id}
            className={
              "flex items-center gap-4 py-3.5 " +
              (i < order.items.length - 1 ? "border-b" : "")
            }
          >
            <RemoteImage
              value={item.image}
              alt={item.name}
              className="size-13 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
            </div>
            <p className="w-32 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
              {item.quantity} × {formatCurrency(item.price)}
            </p>
            <p className="w-28 shrink-0 text-right text-sm font-semibold tabular-nums">
              {formatCurrency(item.total)}
            </p>
          </div>
        ))}
      </CardContent>

      <CardContent className="border-t pt-4">
        <div className="ml-auto flex w-full max-w-sm flex-col gap-2">
          <TotalRow label="Subtotal" value={formatCurrency(order.subtotal)} />
          {order.discount_amount > 0 && (
            <TotalRow
              label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
              value={`− ${formatCurrency(order.discount_amount)}`}
            />
          )}
          <TotalRow
            label="Shipping"
            value={
              order.is_free_shipping
                ? "Free"
                : formatCurrency(order.shipping_charged)
            }
          />
          {order.cod_charge > 0 && (
            <TotalRow
              label="COD charge"
              value={formatCurrency(order.cod_charge)}
            />
          )}
          <Separator className="my-1" />
          <div className="flex items-center justify-between text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground tabular-nums">{value}</span>
    </div>
  )
}

/* ── shipment ───────────────────────────────────────────────────────────── */

function ShipmentCard({ order }: { order: OrderAdmin }) {
  const shipment = order.shipment_detail

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <span>Shipment &amp; tracking</span>
          {shipment?.tracking_url && (
            <a
              href={shipment.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Track on courier site
              <ExternalLinkIcon className="size-3.5" />
            </a>
          )}
        </CardTitle>
      </CardHeader>

      {!shipment ? (
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <TruckIcon className="size-5" />
          </span>
          <p className="text-sm font-semibold">No shipment yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            An AWB, courier and tracking timeline appear here once the order is
            confirmed and pushed to Shiprocket.
          </p>
        </CardContent>
      ) : (
        <>
          <CardContent className="flex flex-wrap gap-x-8 gap-y-4 border-b pb-4">
            <Field label="AWB">
              <span className="font-mono">{shipment.awb_number ?? "—"}</span>
            </Field>
            <Field label="Courier">{shipment.courier_name ?? "—"}</Field>
            <Field label="Shipment status">
              {titleCase(shipment.shipment_status)}
            </Field>
            <Field label="Est. delivery">
              {shipment.estimated_delivery
                ? formatPickupDate(shipment.estimated_delivery)
                : "—"}
            </Field>
            <Field label="Shipping cost">
              <span className="tabular-nums">
                {formatCurrency(shipment.shipping_cost_charged)} charged ·{" "}
                {formatCurrency(shipment.shipping_cost_actual)} actual
              </span>
            </Field>
          </CardContent>

          <CardContent>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Tracking events
            </p>
            {shipment.tracking_events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No events yet — the first one arrives from the Shiprocket
                webhook, or from “Sync tracking”.
              </p>
            ) : (
              <ul className="flex flex-col">
                {shipment.tracking_events.map((ev, i) => (
                  <li key={i} className="flex gap-3.5">
                    <div className="flex flex-col items-center pt-1.5">
                      <span className="size-2.5 shrink-0 rounded-full bg-foreground" />
                      {i < shipment.tracking_events.length - 1 && (
                        <span className="w-0.5 flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-semibold">{ev.status}</p>
                      {ev.description && (
                        <p className="text-sm text-muted-foreground">
                          {ev.description}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ev.location ? `${ev.location} · ` : ""}
                        {formatDateTime(ev.event_time)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </>
      )}
    </Card>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  )
}

/* ── payments ───────────────────────────────────────────────────────────── */

function PaymentsCard({ order }: { order: OrderAdmin }) {
  if (order.payments.length === 0) return null

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Payments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        {order.payments.map((p, i) => (
          <div
            key={p.id}
            className={
              "flex flex-wrap items-center gap-x-4 gap-y-1 py-3.5 " +
              (i < order.payments.length - 1 ? "border-b" : "")
            }
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {titleCase(p.gateway)}
                {p.payment_method ? ` · ${p.payment_method.toUpperCase()}` : ""}
              </p>
              {p.gateway_payment_id && (
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {p.gateway_payment_id}
                </p>
              )}
              {p.failure_reason && (
                <p className="mt-0.5 text-xs text-destructive">
                  {p.failure_reason}
                </p>
              )}
            </div>
            <PaymentStatusBadge status={p.status} />
            <p className="w-40 shrink-0 text-right text-xs text-muted-foreground">
              {formatDateTime(p.completed_at ?? p.initiated_at)}
            </p>
            <p className="w-28 shrink-0 text-right text-sm font-semibold tabular-nums">
              {formatCurrency(p.amount)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ── customer ───────────────────────────────────────────────────────────── */

function CustomerCard({ order }: { order: OrderAdmin }) {
  const address = [
    order.shipping_address1,
    order.shipping_address2,
    `${order.shipping_city}, ${order.shipping_state} ${order.shipping_pincode}`,
  ].filter(Boolean) as string[]

  function copyAddress() {
    navigator.clipboard
      .writeText(
        [order.shipping_name, order.shipping_phone, ...address].join("\n")
      )
      .then(() => toast.success("Address copied"))
      .catch(() => toast.error("Couldn’t copy the address"))
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Customer &amp; delivery</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Contact
          </p>
          <p className="mt-1.5 text-sm font-medium">{order.shipping_name}</p>
          <p className="text-sm text-muted-foreground">
            {order.shipping_phone}
          </p>
          {order.shipping_email && (
            <p className="text-sm text-muted-foreground">
              {order.shipping_email}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Shipping address
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">
            {address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2.5"
            onClick={copyAddress}
          >
            <CopyIcon />
            Copy address
          </Button>
        </div>

        {order.customer_notes && (
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Customer note
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">
              {order.customer_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ── status ─────────────────────────────────────────────────────────────── */

function StatusCard({
  order,
  onUpdated,
}: {
  order: OrderAdmin
  onUpdated: () => void
}) {
  const [picked, setPicked] = useState<OrderStatus | "">("")
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const allowed = getAllowedStatuses(order)

  // Whatever the admin had picked stops being valid once the order moves on,
  // so the selection is derived rather than held across a status change.
  const next = picked && allowed.includes(picked) ? picked : ""

  async function apply() {
    if (!next) return
    setSaving(true)
    try {
      await updateOrderStatus(order.id, { status: next })
      toast.success(`Order moved to ${titleCase(next)}`)
      setPicked("")
      onUpdated()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
      setConfirmOpen(false)
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Order status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {allowed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No manual status change is available from{" "}
            <span className="text-foreground">{titleCase(order.status)}</span>.
          </p>
        ) : (
          <>
            <Label htmlFor="order-status">Move this order to</Label>
            <div className="flex gap-2">
              <Select
                value={next}
                disabled={saving}
                onValueChange={(v) => setPicked(v as OrderStatus)}
              >
                <SelectTrigger id="order-status" className="flex-1">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {allowed.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                disabled={!next || saving}
                onClick={() =>
                  next === "cancelled" ? setConfirmOpen(true) : apply()
                }
              >
                {saving && <Loader2 className="animate-spin" />}
                Apply
              </Button>
            </div>
          </>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Shipped, Out for delivery and Delivered are set from the courier
          webhook, so they are never offered here. Placed → Confirmed runs
          through the Confirm action above, where payment is validated.
        </p>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              {order.order_number} will be cancelled and any pending payment
              marked cancelled. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                apply()
              }}
              disabled={saving}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

/* ── notes ──────────────────────────────────────────────────────────────── */

function NotesCard({
  order,
  onUpdated,
}: {
  order: OrderAdmin
  onUpdated: () => void
}) {
  // `null` means "no local edit" — the textarea then shows whatever the last
  // fetch returned, so a save (or a refetch) flows through without an effect.
  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const saved = order.admin_notes ?? ""
  const notes = draft ?? saved
  const dirty = notes !== saved

  async function save() {
    setSaving(true)
    try {
      await updateOrderNotes(order.id, notes)
      setDraft(null)
      toast.success("Notes saved")
      onUpdated()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Internal notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Label htmlFor="admin-notes" className="sr-only">
          Internal notes
        </Label>
        <Textarea
          id="admin-notes"
          value={notes}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="Staff-only notes…"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Staff only — never shown to the customer.
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={saving || !dirty}
            onClick={save}
          >
            {saving && <Loader2 className="animate-spin" />}
            Save notes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── meta ───────────────────────────────────────────────────────────────── */

function MetaCard({ order }: { order: OrderAdmin }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Payment method", value: order.payment_method.toUpperCase() },
    {
      label: "Coupon",
      value: order.coupon_code ? (
        <span className="font-mono">{order.coupon_code}</span>
      ) : (
        "—"
      ),
    },
    { label: "Placed", value: formatDateTime(order.created_at) },
    { label: "Confirmed", value: formatDateTime(order.confirmed_at) },
    { label: "Shipped", value: formatDateTime(order.shipped_at) },
    { label: "Delivered", value: formatDateTime(order.delivered_at) },
    { label: "Cancelled", value: formatDateTime(order.cancelled_at) },
  ]

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Order details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-right">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
