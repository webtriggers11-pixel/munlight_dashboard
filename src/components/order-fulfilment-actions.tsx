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
import {
  confirmCod,
  confirmOrder,
  createShipment,
  schedulePickup,
  syncShipmentTracking,
  updateOrderStatus,
} from "@/services/orders"
import type { OrderAdmin } from "@/types/order"
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

  const step = resolveNextStep(order)
  const busy = actionBusy !== null
  const canConfirmCod =
    order.payment_method === "cod" && order.payment_status === "cod_pending"

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
      onUpdated()
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

  const refundButton =
    order.status === "delivered" || order.status === "cancelled" ? (
      <Button
        variant="outline"
        className="border-destructive/35 text-destructive hover:text-destructive"
        disabled={busy}
        onClick={() =>
          runAction("refund", () =>
            updateOrderStatus(order.id, { status: "refund_initiated" })
          )
        }
      >
        {actionBusy === "refund" && <Loader2 className="animate-spin" />}
        Start refund
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
              <>
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
                <Button disabled={busy} onClick={handleConfirmAndShip}>
                  {actionBusy === "confirm" || actionBusy === "shipment" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <TruckIcon />
                  )}
                  Confirm &amp; create shipment
                </Button>
              </>
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
              </>
            )}

            {(step === "complete" || step === "closed") && refundButton}

            {step === "blocked" && canConfirmCod && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => runAction("cod", () => confirmCod(order.id))}
              >
                {actionBusy === "cod" && <Loader2 className="animate-spin" />}
                Confirm COD collected
              </Button>
            )}
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
          </div>
        )}
      </CardContent>
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
    case "in_transit":
      return {
        title: "In transit — nothing due",
        description:
          "Shipped, Out for delivery and Delivered are set by the courier webhook. Sync tracking is the manual fallback.",
      }
    case "complete":
      return {
        title: "Order complete",
        description:
          "Delivered. COD orders are marked collected automatically on delivery. A refund can still be started from here.",
      }
    case "closed":
      return {
        title:
          order.status === "cancelled"
            ? "Cancelled — settle the money"
            : "Refund in progress",
        description:
          order.status === "refunded"
            ? "This order is fully refunded and closed."
            : "Fulfilment actions are finished for this order. Move it through Refund initiated → Refunded from the Order status card.",
      }
    default:
      return {
        title: "No action due",
        description: "There is nothing to fulfil on this order right now.",
      }
  }
}
