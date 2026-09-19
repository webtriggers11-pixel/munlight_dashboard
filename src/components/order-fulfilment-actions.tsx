import { useMemo, useState } from "react"
import {
  CalendarClockIcon,
  CircleCheckIcon,
  ExternalLinkIcon,
  Loader2,
  RefreshCwIcon,
  TruckIcon,
} from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import { formatPickupDate, pickupDateOptions, todayISODate } from "@/lib/pickup-dates"
import { PAYMENT_BLOCKED } from "@/lib/order-transitions"
import { formatCurrency } from "@/lib/format"
import {
  confirmCod,
  confirmOrder,
  createShipment,
  markOrderRefunded,
  schedulePickup,
  syncShipmentTracking,
} from "@/services/orders"
import type { OrderAdmin } from "@/types/order"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Which single action is due on this order right now. Derived from the same
// three facts the dialog already reads — order status, payment status and
// whether Shiprocket has given us an AWB — so no new rules are introduced.
type NextStep =
  | "blocked"          // payment unresolved, nothing to fulfil
  | "confirm"          // placed + payment settled → confirm & create shipment
  | "push"             // confirmed/processing but no AWB → (re)push to Shiprocket
  | "pickup"           // AWB exists, label_created → book the courier
  | "awaiting_pickup"  // pickup booked, waiting on the courier
  | "in_transit"       // shipped / out for delivery — webhook drives it
  | "complete"         // delivered
  | "closed"           // cancelled / refund in progress
  | "none"

function resolveNextStep(order: OrderAdmin): NextStep {
  const shipmentStatus = order.shipment_detail?.shipment_status
  const hasAwb = !!order.shipment_detail?.awb_number

  if (
    order.status === "cancelled" ||
    order.status === "refund_initiated" ||
    order.status === "refunded"
  ) {
    return "closed"
  }
  if (order.status === "delivered") return "complete"
  if (order.status === "shipped" || order.status === "out_for_delivery") {
    return "in_transit"
  }
  if (hasAwb && shipmentStatus === "pickup_scheduled") return "awaiting_pickup"
  if (hasAwb && shipmentStatus === "label_created") return "pickup"
  // The API accepts a shipment for confirmed *and* processing orders, so a
  // processing order that never got an AWB still has a way forward here.
  if (
    (order.status === "confirmed" || order.status === "processing") &&
    !hasAwb
  ) {
    return "push"
  }
  if (
    order.status === "placed" &&
    !PAYMENT_BLOCKED.includes(order.payment_status)
  ) {
    return "confirm"
  }
  if (PAYMENT_BLOCKED.includes(order.payment_status)) return "blocked"
  return "none"
}

// The steps where an admin is expected to act — these get the emphasised card.
const ACTIONABLE: NextStep[] = ["confirm", "push", "pickup"]

// When Shiprocket books a different day than the one requested, remember it per
// order. It lives outside the component because the order page unmounts this card
// during every refetch, and the requested date isn't stored on the server — so it
// lasts until the tab is reloaded.
const pickupShifts = new Map<number, { requested: string; booked: string }>()

interface Props {
  order: OrderAdmin
  onUpdated: () => void
}

export function OrderFulfilmentActions({ order, onUpdated }: Props) {
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const pickupOptions = useMemo(() => pickupDateOptions(), [])
  const [pickupDate, setPickupDate] = useState(
    () => pickupOptions[0]?.value ?? todayISODate()
  )

  const [refundOpen, setRefundOpen] = useState(false)

  const pickupShift = pickupShifts.get(order.id)

  const step = resolveNextStep(order)
  const busy = actionBusy !== null
  // Cash is only collected at the door, so this is offered once the parcel is with
  // the courier (the delivery webhook normally does it automatically).
  const canConfirmCod =
    order.payment_method === "cod" &&
    order.payment_status === "cod_pending" &&
    (order.status === "shipped" || order.status === "out_for_delivery")
  const needsRefundRecord =
    order.status === "cancelled" && order.payment_status === "success"

  async function runAction(key: string, fn: () => Promise<unknown>) {
    setActionBusy(key)
    try {
      await fn()
      onUpdated()
      toast.success("Order updated")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setActionBusy(null)
    }
  }

  // Confirm + create shipment run as two independent backend calls (not one
  // atomic endpoint) so a Shiprocket failure never rolls back an already-
  // successful order confirmation — the order stays "confirmed" and this card
  // turns into the "Push to Shiprocket" retry.
  async function handleConfirmAndShip() {
    setActionBusy("confirm")
    try {
      await confirmOrder(order.id)
    } catch (err) {
      toast.error(apiErrorMessage(err))
      setActionBusy(null)
      onUpdated()
      return
    }

    setActionBusy("shipment")
    try {
      await createShipment(order.id)
      toast.success("Order confirmed and pushed to Shiprocket")
    } catch (err) {
      toast.warning(
        `Order confirmed, but shipment creation failed: ${apiErrorMessage(err)}. ` +
          `Use "Push to Shiprocket" to retry.`
      )
    } finally {
      setActionBusy(null)
      onUpdated()
    }
  }

  // Pickup gets its own handler (not runAction) so we can compare the date the
  // manager picked against the date Shiprocket actually booked, and tell them
  // clearly when the requested slot wasn't available and got shifted.
  async function handleSchedulePickup() {
    setActionBusy("pickup")
    try {
      const updated = await schedulePickup(order.id, pickupDate)
      const booked = updated.shipment_detail?.pickup_scheduled_date
      const bookedDay = booked ? booked.slice(0, 10) : null
      if (bookedDay && bookedDay !== pickupDate) {
        pickupShifts.set(order.id, { requested: pickupDate, booked: bookedDay })
      }
      onUpdated()
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

  const syncButton = order.shipment_detail ? (
    <Button
      variant="outline"
      disabled={busy}
      onClick={() => runAction("sync", () => syncShipmentTracking(order.id))}
    >
      {actionBusy === "sync" ? (
        <Loader2 className="animate-spin" />
      ) : (
        <RefreshCwIcon />
      )}
      Sync tracking
    </Button>
  ) : null

  const trackButton = order.shipment_detail?.tracking_url ? (
    <Button variant="outline" asChild>
      <a
        href={order.shipment_detail.tracking_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Track shipment
        <ExternalLinkIcon />
      </a>
    </Button>
  ) : null

  // Bookkeeping only — the refund itself is done by hand in the Razorpay dashboard.
  const markRefundedButton = needsRefundRecord ? (
    <Button
      variant="outline"
      className="border-destructive/35 text-destructive hover:text-destructive"
      disabled={busy}
      onClick={() => setRefundOpen(true)}
    >
      Mark refunded
    </Button>
  ) : null

  const copy = stepCopy(order, step)

  return (
    <Card
      className={
        ACTIONABLE.includes(step) ? "ring-2 ring-foreground" : undefined
      }
    >
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {ACTIONABLE.includes(step) ? "Next step" : "Status"}
            </p>
            <h2 className="mt-1.5 text-base font-semibold">{copy.title}</h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {copy.description}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {step === "confirm" && (
              <Button disabled={busy} onClick={handleConfirmAndShip}>
                {actionBusy === "confirm" || actionBusy === "shipment" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <TruckIcon />
                )}
                Confirm &amp; create shipment
              </Button>
            )}

            {step === "push" && (
              <Button
                disabled={busy}
                onClick={() =>
                  runAction("shipment", () => createShipment(order.id))
                }
              >
                {actionBusy === "shipment" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <TruckIcon />
                )}
                Push to Shiprocket
              </Button>
            )}

            {step === "pickup" && (
              <Button disabled={busy || !pickupDate} onClick={handleSchedulePickup}>
                {actionBusy === "pickup" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CalendarClockIcon />
                )}
                Schedule pickup
              </Button>
            )}

            {(step === "awaiting_pickup" || step === "in_transit") && (
              <>
                {trackButton}
                {syncButton}
                {canConfirmCod && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => runAction("cod", () => confirmCod(order.id))}
                  >
                    {actionBusy === "cod" && <Loader2 className="animate-spin" />}
                    Confirm COD collected
                  </Button>
                )}
              </>
            )}

            {step === "closed" && markRefundedButton}
          </div>
        </div>

        {step === "pickup" && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <span className="mr-1 text-xs font-semibold text-muted-foreground">
              Pickup date
            </span>
            {pickupOptions.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={pickupDate === opt.value ? "default" : "outline"}
                disabled={busy}
                onClick={() => setPickupDate(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            <span className="ml-1 text-xs text-muted-foreground">
              Sundays are skipped — most couriers don&apos;t collect then.
            </span>
            <p className="mt-2 basis-full rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
              Book the pickup only when the parcel is packed and ready to hand
              over. Once booked, the date can only be changed from the Shiprocket
              panel.
            </p>
          </div>
        )}

        {step === "awaiting_pickup" && order.shipment_detail && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t pt-4 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CircleCheckIcon className="size-4 shrink-0" />
              Pickup booked
            </span>
            {order.shipment_detail.pickup_scheduled_date && (
              <span className="text-muted-foreground">
                Date:{" "}
                <span className="text-foreground">
                  {formatPickupDate(order.shipment_detail.pickup_scheduled_date)}
                </span>
              </span>
            )}
            {order.shipment_detail.pickup_token_number && (
              <span className="text-muted-foreground">
                Token:{" "}
                <span className="font-mono text-foreground">
                  {order.shipment_detail.pickup_token_number}
                </span>
              </span>
            )}
            {pickupShift && (
              <p className="mt-1 basis-full rounded-md border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-foreground">
                You requested {formatPickupDate(pickupShift.requested)}, but
                Shiprocket booked {formatPickupDate(pickupShift.booked)}.
              </p>
            )}
            <p className="mt-1 basis-full text-xs text-muted-foreground">
              Shiprocket confirms the final date. If it doesn&apos;t work for you,
              change it in the Shiprocket panel: Orders → Ready to Ship → select
              the order → Reschedule Pickup.
            </p>
          </div>
        )}
      </CardContent>

      <AlertDialog open={refundOpen} onOpenChange={setRefundOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as refunded?</AlertDialogTitle>
            <AlertDialogDescription>
              Only confirm this if you have already refunded{" "}
              {formatCurrency(order.total)} for {order.order_number} in the
              Razorpay dashboard. This just records it — nothing is sent to
              Razorpay from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Not yet</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={async (e) => {
                e.preventDefault()
                await runAction("refund", () => markOrderRefunded(order.id))
                setRefundOpen(false)
              }}
            >
              {actionBusy === "refund" && <Loader2 className="size-4 animate-spin" />}
              Yes, it’s refunded
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function stepCopy(
  order: OrderAdmin,
  step: NextStep
): { title: string; description: string } {
  switch (step) {
    case "blocked":
      return {
        title: "Waiting on the customer's payment",
        description:
          "Payment is pending, failed or cancelled, so this order can't be confirmed yet. Cancelling is the only move available.",
      }
    case "confirm":
      return {
        title: "Confirm the order and push it to Shiprocket",
        description:
          "Confirming and creating the shipment run as two separate calls. If Shiprocket fails, the order still stays Confirmed and this card becomes a “Push to Shiprocket” retry — nothing is rolled back.",
      }
    case "push":
      return {
        title: "Shipment not created yet",
        description:
          "This order is confirmed but has no AWB — the Shiprocket call failed or was never made. Pushing again is safe.",
      }
    case "pickup":
      return {
        title: "Schedule the courier pickup",
        description: `The label is created and AWB ${
          order.shipment_detail?.awb_number ?? "—"
        } is assigned. Pick a collection date — if the slot isn't available, Shiprocket books the nearest one and the confirmed date appears here.`,
      }
    case "awaiting_pickup":
      return {
        title: "Waiting for the courier to collect",
        description:
          "Nothing to do here — the next status arrives on the Shiprocket webhook. Sync tracking pulls it manually if a webhook is missed.",
      }
    case "in_transit": {
      const courier = order.shipment_detail?.shipment_status
      if (courier === "delivery_failed") {
        return {
          title: "Delivery attempt failed",
          description:
            "The courier will retry or send the parcel back. Check the tracking, and contact the customer if the address or phone number is wrong.",
        }
      }
      if (courier === "rto_initiated") {
        return {
          title: "Parcel is returning to you",
          description:
            "The courier is sending it back. Once it arrives, cancel the order from the Order status card to return the items to stock, then refund the customer in Razorpay.",
        }
      }
      if (courier === "rto_delivered") {
        return {
          title: "Parcel is back with you",
          description:
            "Cancel the order from the Order status card to return the items to stock, then refund the customer in the Razorpay dashboard and mark it refunded.",
        }
      }
      return {
        title: "In transit — nothing due",
        description:
          "Shipped, Out for delivery and Delivered are set by the courier webhook. Sync tracking is the manual fallback.",
      }
    }
    case "complete":
      return {
        title: "Order complete",
        description: "Delivered. There is nothing more to do on this order.",
      }
    case "closed": {
      const owesRefund =
        order.status === "cancelled" && order.payment_status === "success"
      if (owesRefund) {
        return {
          title: "Cancelled — refund the customer",
          description: `The customer paid ${formatCurrency(order.total)}. Refund it in the Razorpay dashboard (Payments → open the payment → Refund), then click Mark refunded here so it leaves the attention list.`,
        }
      }
      return {
        title: "Cancelled",
        description:
          order.payment_status === "refunded"
            ? "Cancelled and the payment has been refunded."
            : "This order is cancelled. No payment was taken, so nothing is owed.",
      }
    }
    default:
      return {
        title: "No action due",
        description: "There is nothing to fulfil on this order right now.",
      }
  }
}
