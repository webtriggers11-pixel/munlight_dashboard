import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronRightIcon, Loader2 } from "lucide-react"

import { useAsync } from "@/hooks/use-async"
import { useDebounce } from "@/hooks/use-debounce"
import { formatCurrency, formatDate, titleCase } from "@/lib/format"
import { ALL_ORDER_STATUSES } from "@/lib/order-transitions"
import { listOrders } from "@/services/orders"
import type { OrderStatus } from "@/types/common"
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { PaginationBar } from "@/components/pagination-bar"
import { PageHeader } from "@/components/page-header"
import { SearchInput } from "@/components/search-input"
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

const ALL = "all"

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<string>(ALL)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const navigate = useNavigate()
  const { data, loading, error } = useAsync(
    () =>
      listOrders(
        page,
        20,
        filter === ALL ? undefined : (filter as OrderStatus),
        debouncedSearch
      ),
    [page, filter, debouncedSearch]
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
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
          <div className="mb-4">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by order number, customer name, phone, or email…"
              className="max-w-md"
            />
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !data || data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {debouncedSearch
                ? `No orders match “${debouncedSearch}”.`
                : "No orders found."}
            </p>
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
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((order) => (
                    <TableRow
                      key={order.id}
                      onClick={(e) => {
                        // Let a modifier-click open the order in a new tab, the
                        // way clicking the order-number link would.
                        if (e.metaKey || e.ctrlKey) {
                          window.open(`/orders/${order.id}`, "_blank", "noopener")
                          return
                        }
                        navigate(`/orders/${order.id}`)
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">
                        <Link
                          to={`/orders/${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {order.order_number}
                        </Link>
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
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <ChevronRightIcon
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
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
    </div>
  )
}
