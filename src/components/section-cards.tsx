import {
  PackageIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import type { DashboardStats } from "@/types/dashboard"

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const num = new Intl.NumberFormat("en-IN")

interface StatCard {
  label: string
  value: string
  footer: string
  icon: LucideIcon
  danger?: boolean
}

export function SectionCards({ stats }: { stats: DashboardStats }) {
  const cards: StatCard[] = [
    {
      label: "Total Revenue",
      value: inr.format(stats.total_revenue),
      footer: "Paid & COD-collected orders",
      icon: WalletIcon,
    },
    {
      label: "Total Orders",
      value: num.format(stats.total_orders),
      footer: `${num.format(stats.pending_orders)} pending`,
      icon: ShoppingBagIcon,
    },
    {
      label: "Total Customers",
      value: num.format(stats.total_customers),
      footer: "Registered accounts",
      icon: UsersIcon,
    },
    {
      label: "Active Products",
      value: num.format(stats.total_products),
      footer:
        stats.low_stock_count > 0
          ? `${num.format(stats.low_stock_count)} low on stock`
          : "All well stocked",
      icon: PackageIcon,
      danger: stats.low_stock_count > 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="flex flex-col justify-between gap-4 rounded-lg p-5 shadow-none"
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {card.label}
            </p>
            <card.icon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold tracking-tight text-foreground">
              {card.value}
            </p>
            <p
              className={
                "mt-1 flex items-center gap-1 text-xs " +
                (card.danger ? "text-destructive" : "text-muted-foreground")
              }
            >
              {!card.danger && <TrendingUpIcon className="size-3" />}
              {card.footer}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}
