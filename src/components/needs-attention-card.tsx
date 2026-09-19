import { Link } from "react-router-dom"
import { AlertTriangleIcon } from "lucide-react"

import { useAsync } from "@/hooks/use-async"
import { formatCurrency, formatDate } from "@/lib/format"
import { getAttentionOrders } from "@/services/orders"
import type { AttentionKind } from "@/types/order"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const KIND_VARIANT: Record<AttentionKind, "destructive" | "secondary"> = {
  refund_needed: "destructive",
  delivery_failed: "destructive",
  rto_initiated: "secondary",
  rto_delivered: "destructive",
  shipment_incomplete: "secondary",
}

// Orders that need a human decision: money owed back, or a parcel that isn't
// going to plan. Each row clears itself once the underlying state is resolved,
// so the card disappears when there is nothing to do.
export function NeedsAttentionCard() {
  const { data, error } = useAsync(getAttentionOrders, [])

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Couldn’t load the “needs attention” list: {error}
      </p>
    )
  }
  if (!data || data.length === 0) return null

  return (
    <Card className="border-destructive/40">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangleIcon className="size-4 text-destructive" />
          Needs attention ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        {data.map((item, i) => (
          <div
            key={`${item.order_id}-${item.kind}`}
            className={
              "flex flex-col gap-1.5 py-3.5 " +
              (i < data.length - 1 ? "border-b" : "")
            }
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                to={`/orders/${item.order_id}`}
                className="font-mono text-sm font-semibold hover:underline"
              >
                {item.order_number}
              </Link>
              <Badge variant={KIND_VARIANT[item.kind]}>{item.title}</Badge>
              <span className="text-sm text-muted-foreground">
                {item.customer} · {formatCurrency(item.total)}
                {item.since ? ` · since ${formatDate(item.since)}` : ""}
              </span>
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
