import { useState } from "react"
import { EyeIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useAsync } from "@/hooks/use-async"
import { apiErrorMessage } from "@/lib/api"
import { formatCurrency, formatDate, titleCase } from "@/lib/format"
import { listOrders, updateOrderStatus } from "@/services/orders"
import type { OrderStatus, PaymentStatus } from "@/types/common"
import type { Order } from "@/types/order"
import { Button } from "@/components/ui/button"
import { PaymentStatusBadge } from "@/components/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { PaginationBar } from "@/components/pagination-bar"
import { PageHeader } from "@/components/page-header"
import { OrderDetailDialog } from "@/components/order-detail-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const ALL_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_initiated",
  "refunded",
]

// Statuses that block payment — cannot confirm
const PAYMENT_BLOCKED: PaymentStatus[] = ["pending", "failed", "cancelled"]

// Which statuses an admin can manually transition to from a given status.
// "placed → confirmed" is intentionally excluded — use the /confirm endpoint.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:          ["cancelled"],
  placed:           ["cancelled"],           // confirm via dedicated button only
  confirmed:        ["processing", "cancelled"],
  processing:       ["shipped", "cancelled"],
  shipped:          ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered:        ["refund_initiated"],
  cancelled:        ["refund_initiated"],
  refund_initiated: ["refunded"],
  refunded:         [],
}

function getAllowedStatuses(order: Order): OrderStatus[] {
  const base = ALLOWED_TRANSITIONS[order.status] ?? []
  // If payment is not resolved, block confirm even though placed → confirmed
  // is already excluded above; also block any forward moves for pending orders
  if (PAYMENT_BLOCKED.includes(order.payment_status)) {
    return base.filter((s) => s === "cancelled")
  }
  return base
}

const ALL = "all"

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<string>(ALL)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [detail, setDetail] = useState<Order | null>(null)
  const { data, loading, error, refetch } = useAsync(
    () => listOrders(page, 20, filter === ALL ? undefined : (filter as OrderStatus)),
    [page, filter]
  )

  async function handleStatusChange(orderId: number, status: OrderStatus) {
    setBusyId(orderId)
    try {
      await updateOrderStatus(orderId, { status })
      toast.success(`Order updated to ${titleCase(status)}`)
      refetch()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description="Track and fulfil customer orders."
        actions={
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger size="sm" className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {ALL_ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {titleCase(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !data || data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-52">Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>{order.shipping_name}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={order.payment_status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const next = getAllowedStatuses(order)
                          const isTerminal = next.length === 0
                          return (
                            <Select
                              value={order.status}
                              disabled={busyId === order.id || isTerminal}
                              onValueChange={(v) =>
                                handleStatusChange(order.id, v as OrderStatus)
                              }
                            >
                              <SelectTrigger size="sm" className="w-full capitalize">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Current status shown as non-selectable label */}
                                <SelectItem value={order.status} className="capitalize font-medium" disabled>
                                  {titleCase(order.status)} (current)
                                </SelectItem>
                                {next.map((s) => (
                                  <SelectItem key={s} value={s} className="capitalize">
                                    {titleCase(s)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetail(order)}
                          aria-label="View order"
                        >
                          <EyeIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationBar
                page={data.page}
                totalPages={data.total_pages}
                total={data.total}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <OrderDetailDialog
        order={detail}
        onOpenChange={(o) => !o && setDetail(null)}
        onConfirmed={() => refetch()}
      />
    </div>
  )
}
