import {
  AlertTriangleIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  InfoIcon,
  PackageIcon,
  ShoppingBagIcon,
  TagIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

import { formatInr, formatNumber } from "@/lib/format"
import {
  buildInsights,
  type InsightMessage,
  type InsightTone,
} from "@/lib/insight-messages"
import type { InsightsOverview } from "@/types/analytics"
import { Card } from "@/components/ui/card"
import { Hint, Section, Stat } from "@/components/insights/section"

/* ── plain-language notes ────────────────────────────────────────────────── */

const TONE_STYLE: Record<InsightTone, { icon: LucideIcon; className: string }> = {
  warn: { icon: AlertTriangleIcon, className: "text-amber-600" },
  good: { icon: CheckCircle2Icon, className: "text-emerald-600" },
  info: { icon: InfoIcon, className: "text-muted-foreground" },
}

export function InsightList({ data }: { data: InsightsOverview }) {
  const messages: InsightMessage[] = buildInsights(data)
  if (messages.length === 0) return null

  return (
    <Section
      title="What stands out"
      description="The most important things in this period, in plain words."
    >
      <ul className="flex flex-col gap-3">
        {messages.map((m, i) => {
          const { icon: Icon, className } = TONE_STYLE[m.tone]
          return (
            <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
              <Icon className={"mt-0.5 size-4 shrink-0 " + className} />
              <span>{m.text}</span>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

/* ── headline numbers ────────────────────────────────────────────────────── */

function Change({ value, days }: { value: number | null; days: number }) {
  if (value === null) {
    return (
      <span className="text-xs text-muted-foreground">
        Nothing to compare with yet
      </span>
    )
  }
  const up = value >= 0
  return (
    <span className="flex flex-wrap items-center gap-1 text-xs">
      <span
        className={
          "inline-flex items-center gap-0.5 font-semibold " +
          (up ? "text-emerald-600" : "text-destructive")
        }
      >
        {up ? (
          <ArrowUpRightIcon className="size-3.5" />
        ) : (
          <ArrowDownRightIcon className="size-3.5" />
        )}
        {Math.abs(value)}%
      </span>
      <span className="text-muted-foreground">vs the previous {days} days</span>
    </span>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  caption,
  change,
  days,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: string
  caption: string
  change: number | null
  days: number
  hint: string
}) {
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {label}
          <Hint text={hint} />
        </p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">{caption}</p>
        <Change value={change} days={days} />
      </div>
    </Card>
  )
}

export function KpiCards({ data }: { data: InsightsOverview }) {
  const { summary: s, changes, period } = data
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        icon={WalletIcon}
        label="Sales"
        value={formatInr(s.total_paid)}
        caption="Total money customers paid you"
        change={changes.total_paid}
        days={period.days}
        hint="Everything customers paid for orders that were not cancelled — products, delivery fee and any COD charge, after discounts."
      />
      <Kpi
        icon={ShoppingBagIcon}
        label="Orders"
        value={formatNumber(s.orders)}
        caption="Paid orders (not cancelled)"
        change={changes.orders}
        days={period.days}
        hint="Only orders the customer has actually paid for. Orders started but not paid are not counted."
      />
      <Kpi
        icon={TagIcon}
        label="Average order"
        value={formatInr(s.avg_order_value)}
        caption="Sales divided by orders"
        change={changes.avg_order_value}
        days={period.days}
        hint="How much a customer spends on average in one order. A higher number means bigger baskets."
      />
      <Kpi
        icon={PackageIcon}
        label="Items sold"
        value={formatNumber(s.items_sold)}
        caption="Pieces sent out to customers"
        change={changes.items_sold}
        days={period.days}
        hint="The total number of individual products in all paid orders."
      />
    </div>
  )
}

/* ── where the money goes ────────────────────────────────────────────────── */

function Line({
  label,
  value,
  sign,
  strong,
  note,
}: {
  label: string
  value: string
  sign?: "minus" | "equals"
  strong?: boolean
  note?: string
}) {
  return (
    <div
      className={
        "flex items-start justify-between gap-4 py-3 " +
        (strong ? "border-t-2 border-foreground/80 pt-4" : "border-b last:border-b-0")
      }
    >
      <div className="min-w-0">
        <p className={strong ? "text-base font-semibold" : "text-sm"}>
          {sign === "minus" && <span className="mr-2 text-muted-foreground">−</span>}
          {sign === "equals" && <span className="mr-2 text-muted-foreground">=</span>}
          {label}
        </p>
        {note && (
          <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted-foreground">
            {note}
          </p>
        )}
      </div>
      <p
        className={
          "shrink-0 tabular-nums " + (strong ? "text-xl font-semibold" : "text-sm font-medium")
        }
      >
        {value}
      </p>
    </div>
  )
}

export function MoneyBreakdown({ data }: { data: InsightsOverview }) {
  const s = data.summary
  const costPartial = s.shipments > 0 && s.delivery_cost_known < s.shipments

  return (
    <Section
      title="Where the money goes"
      description="From what customers paid you, to what is left after delivery and payment charges."
      hint="'You keep' is an estimate before the cost of making or buying your products, which the system does not know yet."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Line label="Customers paid you" value={formatInr(s.total_paid)} />
          <Line
            sign="minus"
            label="Delivery cost (charged by Shiprocket)"
            value={formatInr(s.delivery_cost)}
            note={
              s.shipments === 0
                ? "No parcels were shipped in this period."
                : costPartial
                  ? `Real cost known for ${s.delivery_cost_known} of ${s.shipments} shipments — press “Update delivery costs” below to fetch the rest.`
                  : `Real cost of all ${s.shipments} shipments.`
            }
          />
          <Line
            sign="minus"
            label="Payment gateway fees (estimate)"
            value={formatInr(s.gateway_fee_estimate)}
            note={`About ${data.gateway_fee_percent}% of online payments (Razorpay's fee plus GST). Your Razorpay settlement report has the exact amount.`}
          />
          <Line
            strong
            sign="equals"
            label="You keep, before product cost"
            value={formatInr(s.you_keep_estimate)}
          />
        </div>

        <div className="grid content-start gap-3 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-1">
          <Stat
            label="Discounts you gave"
            value={formatInr(s.discounts)}
            note="Money taken off with coupons. Already left out of what customers paid."
          />
          <Stat
            label="Delivery fees collected"
            value={formatInr(s.delivery_charged)}
            note="What customers paid you for delivery."
          />
          <Stat
            label="Delivery: you earned / lost"
            value={
              s.delivery_cost_known === 0
                ? "—"
                : (s.delivery_result >= 0 ? "+" : "−") + formatInr(Math.abs(s.delivery_result))
            }
            tone={
              s.delivery_cost_known === 0
                ? undefined
                : s.delivery_result >= 0
                  ? "good"
                  : "bad"
            }
            note="Delivery fees collected minus what the courier charged, for shipments where the cost is known."
          />
        </div>
      </div>
    </Section>
  )
}
