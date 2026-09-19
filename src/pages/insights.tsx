import { useState } from "react"
import { Loader2 } from "lucide-react"

import { useAsync } from "@/hooks/use-async"
import { getInsights } from "@/services/analytics"
import { presetRange, type DateRange } from "@/lib/date-ranges"
import { PageHeader } from "@/components/page-header"
import { RangePicker } from "@/components/insights/range-picker"
import {
  InsightList,
  KpiCards,
  MoneyBreakdown,
} from "@/components/insights/money"
import {
  BestSellers,
  CategorySplit,
  SalesChart,
  StockLists,
} from "@/components/insights/sales"
import {
  CustomersSection,
  DeliveryReport,
  OrderHealthSection,
  PaymentsAndOffers,
} from "@/components/insights/operations"

export default function InsightsPage() {
  const [range, setRange] = useState<DateRange>(() => presetRange("30d"))
  const { data, loading, error, refetch } = useAsync(
    () => getInsights(range.start, range.end),
    [range.start, range.end]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales & Insights"
        description="How your shop is doing — sales, delivery costs, best sellers and customers, in simple words."
      />

      <RangePicker value={range} onChange={setRange} />

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !data ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <div
          className={
            "flex flex-col gap-6 transition-opacity " +
            (loading ? "pointer-events-none opacity-50" : "")
          }
        >
          <InsightList data={data} />
          <KpiCards data={data} />
          <MoneyBreakdown data={data} />
          <SalesChart data={data} />
          <BestSellers data={data} />
          <CategorySplit data={data} />
          <StockLists data={data} />
          <DeliveryReport data={data} onUpdated={refetch} />
          <CustomersSection data={data} />
          <PaymentsAndOffers data={data} />
          <OrderHealthSection data={data} />

          <p className="text-xs leading-relaxed text-muted-foreground">
            All amounts are in rupees. “Sales” counts only orders the customer has
            paid for and that were not cancelled; each order belongs to the day it
            was placed in India time. Payment fees are an estimate, and product
            cost is not included because the system does not know it yet.
          </p>
        </div>
      )}
    </div>
  )
}
