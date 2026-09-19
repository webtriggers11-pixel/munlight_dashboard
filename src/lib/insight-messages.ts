import { formatInr } from "@/lib/format"
import type { InsightsOverview } from "@/types/analytics"

export type InsightTone = "good" | "warn" | "info"

export interface InsightMessage {
  tone: InsightTone
  text: string
}

const list = (names: string[], max = 3): string => {
  const shown = names.slice(0, max).join(", ")
  return names.length > max ? `${shown} and ${names.length - max} more` : shown
}

// Turns the numbers into a few plain sentences a shop owner can act on. Warnings
// first, then good news, then notes. Every sentence states the number it is based
// on, so nobody has to take it on trust.
export function buildInsights(data: InsightsOverview): InsightMessage[] {
  const out: InsightMessage[] = []
  const { summary: s, previous: p, changes, order_health: h, period } = data

  if (s.orders === 0) {
    out.push({
      tone: "info",
      text: "No paid orders in this period yet. Try a longer date range.",
    })
  } else {
    if (changes.total_paid === null) {
      out.push({
        tone: "info",
        text: `There were no paid orders in the ${period.days} days before this, so there is nothing to compare with.`,
      })
    } else if (changes.total_paid >= 5) {
      out.push({
        tone: "good",
        text: `Sales are up ${changes.total_paid}% compared with the previous ${period.days} days (${formatInr(p.total_paid)} before, ${formatInr(s.total_paid)} now).`,
      })
    } else if (changes.total_paid <= -5) {
      out.push({
        tone: "warn",
        text: `Sales are down ${Math.abs(changes.total_paid)}% compared with the previous ${period.days} days (${formatInr(p.total_paid)} before, ${formatInr(s.total_paid)} now).`,
      })
    } else {
      out.push({
        tone: "info",
        text: "Sales are about the same as the previous period.",
      })
    }
  }

  // Delivery fees charged to customers, relative to what they paid overall.
  if (s.total_paid > 0) {
    const share = Math.round((s.delivery_charged / s.total_paid) * 100)
    if (share >= 25) {
      out.push({
        tone: "warn",
        text: `Customers paid ${formatInr(s.delivery_charged)} in delivery fees — ${share}% of everything they paid. High delivery charges are a common reason shoppers leave before paying.`,
      })
    }
  }

  // Delivery: what it really cost vs what was collected.
  if (s.delivery_cost_known > 0) {
    if (s.delivery_result < -1) {
      out.push({
        tone: "warn",
        text: `On delivery you spent ${formatInr(Math.abs(s.delivery_result))} more than you collected from customers.`,
      })
    } else if (s.delivery_result > 1) {
      out.push({
        tone: "good",
        text: `Delivery fees collected were ${formatInr(s.delivery_result)} more than the courier charged you.`,
      })
    }
  }
  if (s.shipments > 0 && s.delivery_cost_known < s.shipments) {
    out.push({
      tone: "info",
      text: `The real courier cost is known for ${s.delivery_cost_known} of ${s.shipments} shipments. Press "Update delivery costs" in the Delivery section to fetch the rest from Shiprocket.`,
    })
  }
  if (s.free_shipping_orders > 0 && s.free_shipping_cost > 0) {
    out.push({
      tone: "info",
      text: `${s.free_shipping_orders} order${s.free_shipping_orders === 1 ? "" : "s"} had free delivery, which cost you ${formatInr(s.free_shipping_cost)}.`,
    })
  }

  // People who started an order but never paid.
  if (h.placed >= 5 && h.not_paid / h.placed >= 0.3) {
    out.push({
      tone: "warn",
      text: `${h.not_paid} of ${h.placed} people who started an order did not pay. Check that payment and delivery charges are clear before checkout.`,
    })
  }

  if (h.cancelled_after_payment > 0) {
    out.push({
      tone: "warn",
      text: `${h.cancelled_after_payment} paid order${h.cancelled_after_payment === 1 ? " was" : "s were"} cancelled. Make sure each customer has been refunded (see "Needs attention" on the Orders page).`,
    })
  }
  if (h.returned_by_courier > 0) {
    out.push({
      tone: "warn",
      text: `${h.returned_by_courier} parcel${h.returned_by_courier === 1 ? " was" : "s were"} sent back by the courier${h.return_rate_percent !== null ? ` (${h.return_rate_percent}% of shipped orders)` : ""}.`,
    })
  }

  // Stock.
  const low = data.products.low_stock
  if (low.length > 0) {
    out.push({
      tone: "warn",
      text: `${low.length} product${low.length === 1 ? " is" : "s are"} running low on stock: ${list(low.map((x) => `${x.name} (${x.stock} left)`))}.`,
    })
  }
  const idle = data.products.not_selling
  if (idle.length > 0) {
    out.push({
      tone: "info",
      text: `${idle.length} product${idle.length === 1 ? " is" : "s are"} in stock but did not sell in this period: ${list(idle.map((x) => x.name))}.`,
    })
  }

  // Best seller and repeat customers.
  const best = data.products.top[0]
  if (best && s.orders > 0) {
    out.push({
      tone: "good",
      text: `Best seller: ${best.name} — ${best.units} sold, ${formatInr(best.revenue)} (${best.share_percent}% of product sales).`,
    })
  }
  if (data.customers.returning > 0) {
    out.push({
      tone: "good",
      text: `${data.customers.returning} of ${data.customers.buyers} buyers had bought from you before. Repeat customers cost nothing to win.`,
    })
  }

  const order: Record<InsightTone, number> = { warn: 0, good: 1, info: 2 }
  return out.sort((a, b) => order[a.tone] - order[b.tone])
}
