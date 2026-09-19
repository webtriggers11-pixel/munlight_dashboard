import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { formatBucketLabel } from "@/lib/date-ranges"
import { formatCompactInr, formatInr, formatNumber } from "@/lib/format"
import type { InsightsOverview, TopProduct } from "@/types/analytics"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BarRow, Empty, Section } from "@/components/insights/section"

/* ── sales over time ─────────────────────────────────────────────────────── */

const chartConfig = {
  sales: { label: "Sales", color: "var(--primary)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig

export function SalesChart({ data }: { data: InsightsOverview }) {
  const [metric, setMetric] = useState<"sales" | "orders">("sales")
  const { series, period } = data
  const bucketWord =
    period.bucket === "day" ? "day" : period.bucket === "week" ? "week" : "month"
  const hasData = series.some((p) => p.orders > 0)

  return (
    <Section
      title="Sales over time"
      description={`How much you sold each ${bucketWord}. Taller bars are better days.`}
      action={
        <ToggleGroup
          type="single"
          value={metric}
          onValueChange={(v) => v && setMetric(v as "sales" | "orders")}
          variant="outline"
        >
          <ToggleGroupItem value="sales">Money</ToggleGroupItem>
          <ToggleGroupItem value="orders">Orders</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {!hasData ? (
        <Empty>No paid orders in this period, so there is nothing to draw yet.</Empty>
      ) : (
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <BarChart data={series} margin={{ left: 4, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(v) => formatBucketLabel(String(v), period.bucket)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              allowDecimals={false}
              tickFormatter={(v) =>
                metric === "sales" ? formatCompactInr(Number(v)) : String(v)
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(v) => formatBucketLabel(String(v), period.bucket)}
                  formatter={(value) => (
                    <span className="font-medium tabular-nums">
                      {metric === "sales"
                        ? formatInr(Number(value))
                        : `${value} order${Number(value) === 1 ? "" : "s"}`}
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey={metric}
              fill={`var(--color-${metric})`}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </Section>
  )
}

/* ── best sellers ────────────────────────────────────────────────────────── */

function Trend({ p }: { p: TopProduct }) {
  if (p.trend === "new") return <Badge variant="secondary">New this period</Badge>
  if (p.trend === "same") return <span className="text-xs text-muted-foreground">Same as before</span>
  const up = p.trend === "up"
  return (
    <span
      className={
        "text-xs font-semibold tabular-nums " + (up ? "text-emerald-600" : "text-destructive")
      }
    >
      {up ? "▲" : "▼"} {Math.abs(p.change_percent ?? 0)}%
    </span>
  )
}

export function BestSellers({ data }: { data: InsightsOverview }) {
  const [by, setBy] = useState<"revenue" | "units">("revenue")
  const rows = useMemo(
    () =>
      [...data.products.top].sort((a, b) =>
        by === "revenue" ? b.revenue - a.revenue : b.units - a.units || b.revenue - a.revenue
      ),
    [data.products.top, by]
  )
  const days = data.period.days

  return (
    <Section
      title="Best-selling products"
      description="Which pieces bring in the most. The arrow compares each product with the previous period."
      hint="'Sales' is the value of the product before discounts. 'Share' is that product's part of all product sales."
      action={
        <ToggleGroup
          type="single"
          value={by}
          onValueChange={(v) => v && setBy(v as "revenue" | "units")}
          variant="outline"
        >
          <ToggleGroupItem value="revenue">By money</ToggleGroupItem>
          <ToggleGroupItem value="units">By pieces sold</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {rows.length === 0 ? (
        <Empty>Nothing has sold in this period yet.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Pieces sold</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="hidden min-w-32 sm:table-cell">Share</TableHead>
                <TableHead>vs previous {days} days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p, i) => (
                <TableRow key={p.product_id ?? p.name}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="max-w-64 truncate font-medium">{p.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(p.units)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatInr(p.revenue)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(2, p.share_percent)}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {p.share_percent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Trend p={p} />
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

/* ── categories ──────────────────────────────────────────────────────────── */

export function CategorySplit({ data }: { data: InsightsOverview }) {
  const max = Math.max(0, ...data.categories.map((c) => c.revenue))
  return (
    <Section
      title="Which categories sell"
      description="Sales by type of jewellery, so you know what to make or stock more of."
    >
      {data.categories.length === 0 ? (
        <Empty>No sales in this period yet.</Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {data.categories.map((c) => (
            <BarRow
              key={c.name}
              label={c.name}
              value={c.revenue}
              max={max}
              right={formatInr(c.revenue)}
              sub={`${formatNumber(c.units)} piece${c.units === 1 ? "" : "s"} sold`}
            />
          ))}
        </div>
      )}
    </Section>
  )
}

/* ── stock ───────────────────────────────────────────────────────────────── */

export function StockLists({ data }: { data: InsightsOverview }) {
  const { not_selling, low_stock } = data.products
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section
        title="Running low on stock"
        description="Fewer than 5 left. Restock these before they sell out."
      >
        {low_stock.length === 0 ? (
          <Empty>Nothing is running low.</Empty>
        ) : (
          <ul className="flex flex-col divide-y">
            {low_stock.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link to={`/products/${p.slug}`} className="truncate font-medium hover:underline">
                  {p.name}
                </Link>
                <Badge variant={p.stock === 0 ? "destructive" : "secondary"}>
                  {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="In stock but not selling"
        description="Available to buy, yet nobody bought them in this period. Consider a photo refresh, a lower price, or featuring them."
      >
        {not_selling.length === 0 ? (
          <Empty>Every product in stock has sold at least once.</Empty>
        ) : (
          <ul className="flex flex-col divide-y">
            {not_selling.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link to={`/products/${p.slug}`} className="truncate font-medium hover:underline">
                  {p.name}
                </Link>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {p.price !== undefined && `${formatInr(p.price)} · `}
                  {p.stock} in stock
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
