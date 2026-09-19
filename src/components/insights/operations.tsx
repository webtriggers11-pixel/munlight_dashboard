import { useState } from "react"
import { Loader2, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@/lib/api"
import { formatInr, formatNumber } from "@/lib/format"
import { syncDeliveryCosts } from "@/services/analytics"
import type { InsightsOverview } from "@/types/analytics"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BarRow, Empty, Section, Stat } from "@/components/insights/section"

/* ── delivery ────────────────────────────────────────────────────────────── */

export function DeliveryReport({
  data,
  onUpdated,
}: {
  data: InsightsOverview
  onUpdated: () => void
}) {
  const [syncing, setSyncing] = useState(false)
  const s = data.summary
  const couriers = data.delivery.by_courier

  async function update() {
    setSyncing(true)
    try {
      const r = await syncDeliveryCosts()
      toast.success(
        r.updated > 0
          ? `Delivery costs updated for ${r.updated} shipment${r.updated === 1 ? "" : "s"}.`
          : "Checked Shiprocket — no new delivery costs were available."
      )
      onUpdated()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Section
      title="Delivery"
      description="What customers paid for delivery, what Shiprocket actually charged you, and which courier works best."
      hint="The real cost comes from Shiprocket after a courier is assigned. It can change slightly later if the parcel is re-weighed, so update it now and then."
      action={
        <Button variant="outline" size="sm" disabled={syncing} onClick={update}>
          {syncing ? <Loader2 className="animate-spin" /> : <RefreshCwIcon />}
          Update delivery costs
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Customers paid for delivery"
          value={formatInr(s.delivery_charged)}
          note={`Across ${formatNumber(s.orders)} paid order${s.orders === 1 ? "" : "s"}.`}
        />
        <Stat
          label="Courier charged you"
          value={s.delivery_cost_known === 0 ? "—" : formatInr(s.delivery_cost)}
          note={
            s.shipments === 0
              ? "No parcels shipped in this period."
              : `Real cost known for ${s.delivery_cost_known} of ${s.shipments} shipments.`
          }
        />
        <Stat
          label="You earned / lost on delivery"
          value={
            s.delivery_cost_known === 0
              ? "—"
              : (s.delivery_result >= 0 ? "+" : "−") + formatInr(Math.abs(s.delivery_result))
          }
          tone={
            s.delivery_cost_known === 0 ? undefined : s.delivery_result >= 0 ? "good" : "bad"
          }
          note="Fees collected minus courier charges."
        />
        <Stat
          label="Free-delivery orders"
          value={formatNumber(s.free_shipping_orders)}
          note={
            s.free_shipping_cost > 0
              ? `They cost you ${formatInr(s.free_shipping_cost)} in courier charges.`
              : "Free delivery for orders above your free-shipping amount."
          }
        />
      </div>

      <h3 className="mb-3 mt-6 text-sm font-semibold">By courier</h3>
      {couriers.length === 0 ? (
        <Empty>No parcels were shipped in this period.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Courier</TableHead>
                <TableHead className="text-right">Parcels</TableHead>
                <TableHead className="text-right">Customer paid (avg)</TableHead>
                <TableHead className="text-right">Courier charged (avg)</TableHead>
                <TableHead className="text-right">Days to deliver (avg)</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Sent back</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couriers.map((c) => (
                <TableRow key={c.courier}>
                  <TableCell className="font-medium">{c.courier}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.orders}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatInr(c.avg_charged)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.avg_cost === null ? "—" : formatInr(c.avg_cost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.avg_days === null ? "—" : c.avg_days}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.delivered}</TableCell>
                  <TableCell
                    className={
                      "text-right tabular-nums " + (c.returned > 0 ? "font-semibold text-destructive" : "")
                    }
                  >
                    {c.returned}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Section>
  )
}

/* ── customers ───────────────────────────────────────────────────────────── */

export function CustomersSection({ data }: { data: InsightsOverview }) {
  const c = data.customers
  const maxCity = Math.max(0, ...c.top_cities.map((x) => x.sales))
  const maxState = Math.max(0, ...c.top_states.map((x) => x.sales))
  const newShare = c.buyers > 0 ? Math.round((c.new / c.buyers) * 100) : 0

  return (
    <Section
      title="Your customers"
      description="Who is buying and where they live — useful for deciding where to advertise."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">New and returning</h3>
          {c.buyers === 0 ? (
            <Empty>No buyers in this period yet.</Empty>
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                <div className="bg-primary" style={{ width: `${newShare}%` }} />
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <p>
                  <span className="mr-2 inline-block size-2.5 rounded-full bg-primary" />
                  <span className="font-medium">{c.new}</span> new customer{c.new === 1 ? "" : "s"}
                </p>
                <p>
                  <span className="mr-2 inline-block size-2.5 rounded-full bg-muted-foreground/40" />
                  <span className="font-medium">{c.returning}</span> came back (bought before)
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {c.buyers} different buyer{c.buyers === 1 ? "" : "s"} in this period.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Top cities</h3>
          {c.top_cities.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            c.top_cities.map((p) => (
              <BarRow
                key={p.name}
                label={p.name}
                value={p.sales}
                max={maxCity}
                right={formatInr(p.sales)}
                sub={`${p.orders} order${p.orders === 1 ? "" : "s"}`}
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Top states</h3>
          {c.top_states.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            c.top_states.map((p) => (
              <BarRow
                key={p.name}
                label={p.name}
                value={p.sales}
                max={maxState}
                right={formatInr(p.sales)}
                sub={`${p.orders} order${p.orders === 1 ? "" : "s"}`}
              />
            ))
          )}
        </div>
      </div>
    </Section>
  )
}

/* ── payments and offers ─────────────────────────────────────────────────── */

export function PaymentsAndOffers({ data }: { data: InsightsOverview }) {
  const maxPay = Math.max(0, ...data.payments.map((p) => p.amount))
  return (
    <Section
      title="How customers pay, and offers used"
      description="Online payments versus cash on delivery, and which coupon codes were used."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Payment method</h3>
          {data.payments.length === 0 ? (
            <Empty>No paid orders yet.</Empty>
          ) : (
            data.payments.map((p) => (
              <BarRow
                key={p.method}
                label={p.method}
                value={p.amount}
                max={maxPay}
                right={formatInr(p.amount)}
                sub={`${p.orders} order${p.orders === 1 ? "" : "s"}`}
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Coupons</h3>
          {data.coupons.length === 0 ? (
            <Empty>No coupon codes were used in this period.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Discount given</TableHead>
                    <TableHead className="text-right">Sales from these orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.coupons.map((c) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-mono font-medium">{c.code}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.uses}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatInr(c.discount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatInr(c.sales)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

/* ── order health ────────────────────────────────────────────────────────── */

export function OrderHealthSection({ data }: { data: InsightsOverview }) {
  const h = data.order_health
  const pct = (v: number | null) => (v === null ? "—" : `${v}%`)

  return (
    <Section
      title="How your orders are going"
      description="What happened to every order placed in this period, including the ones that were never paid."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Orders started"
          value={formatNumber(h.placed)}
          note="Everyone who reached the payment step."
        />
        <Stat
          label="Paid"
          value={formatNumber(h.paid)}
          note={
            h.not_paid > 0
              ? `${h.not_paid} started but did not pay.`
              : "Every order started was paid."
          }
        />
        <Stat
          label="Delivered"
          value={formatNumber(h.delivered)}
          note={`${h.on_the_way} on the way · ${h.to_pack_and_ship} waiting for you to ship.`}
        />
        <Stat
          label="Delivered rate"
          value={pct(h.delivered_rate_percent)}
          note="Share of paid orders that have already reached the customer."
        />
        <Stat
          label="Cancelled after payment"
          value={formatNumber(h.cancelled_after_payment)}
          tone={h.cancelled_after_payment > 0 ? "bad" : undefined}
          note={`Cancel rate: ${pct(h.cancel_rate_percent)} of paid orders. These customers must be refunded.`}
        />
        <Stat
          label="Sent back by courier"
          value={formatNumber(h.returned_by_courier)}
          tone={h.returned_by_courier > 0 ? "bad" : undefined}
          note={`Return rate: ${pct(h.return_rate_percent)} of shipped parcels.`}
        />
      </div>
    </Section>
  )
}
