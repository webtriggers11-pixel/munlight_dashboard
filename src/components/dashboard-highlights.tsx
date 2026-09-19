import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { useAsync } from "@/hooks/use-async"
import { presetRange, type PresetKey } from "@/lib/date-ranges"
import { formatNumber } from "@/lib/format"
import { getHighlights } from "@/services/analytics"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RemoteImage } from "@/components/remote-image"
import { Empty, Section } from "@/components/insights/section"

// What a store owner needs at a glance, in words. Just these three choices on purpose.
const FILTERS: { key: PresetKey; label: string; when: string; none: string }[] = [
  { key: "today", label: "Today", when: "today", none: "No sales yet today." },
  { key: "yesterday", label: "Yesterday", when: "yesterday", none: "There were no sales yesterday." },
  { key: "7d", label: "Last 7 days", when: "in the last 7 days", none: "There were no sales in the last 7 days." },
]

export function DashboardHighlights() {
  const [filter, setFilter] = useState<PresetKey>("today")
  const range = useMemo(() => presetRange(filter), [filter])
  const { data, loading, error } = useAsync(
    () => getHighlights(range.start, range.end),
    [range.start, range.end]
  )
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">What stands out</h2>
        <div className="flex items-center gap-2">
          {loading && data && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {error && !data ? (
        <p className="text-sm text-muted-foreground">Could not load this right now.</p>
      ) : !data ? (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <div
          className={
            "grid gap-6 lg:grid-cols-2 transition-opacity " + (loading ? "opacity-60" : "")
          }
        >
          <Section
            title="Best-selling products"
            description={`Pieces sold ${active.when}.`}
          >
            {data.best_sellers.length === 0 ? (
              <Empty>{active.none}</Empty>
            ) : (
              <ol className="flex flex-col divide-y">
                {data.best_sellers.map((p, i) => (
                  <li
                    key={p.product_id ?? p.name}
                    className="flex items-center gap-3 py-2.5 text-sm"
                  >
                    <span className="w-4 shrink-0 text-center text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <RemoteImage
                      value={p.image}
                      fallbackLabel={p.name}
                      className="size-10 shrink-0 rounded-md border"
                    />
                    {p.slug ? (
                      <Link to={`/products/${p.slug}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                        {p.name}
                      </Link>
                    ) : (
                      <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                    )}
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatNumber(p.units)} sold
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section
            title="Running low on stock"
            description="Fewer than 5 left, as of now. Restock these before they sell out."
          >
            {data.low_stock.length === 0 ? (
              <Empty>Nothing is running low.</Empty>
            ) : (
              <ul className="flex flex-col divide-y">
                {data.low_stock.map((p) => (
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
        </div>
      )}
    </div>
  )
}
