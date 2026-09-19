// Shapes returned by GET /admin/analytics/overview (see analytics_service.py).

export interface InsightsPeriod {
  start: string
  end: string
  days: number
  previous_start: string
  previous_end: string
  bucket: "day" | "week" | "month"
}

export interface InsightsSummary {
  orders: number
  items_sold: number
  product_sales: number
  discounts: number
  delivery_charged: number
  cod_charges: number
  total_paid: number
  avg_order_value: number
  delivery_cost: number
  delivery_cost_known: number
  shipments: number
  delivery_result: number
  free_shipping_orders: number
  free_shipping_cost: number
  gateway_fee_estimate: number
  you_keep_estimate: number
}

export interface SeriesPoint {
  date: string
  sales: number
  orders: number
}

export interface TopProduct {
  product_id: number | null
  name: string
  image: string | null
  units: number
  orders: number
  revenue: number
  share_percent: number
  previous_units: number
  change_percent: number | null
  trend: "new" | "up" | "down" | "same"
}

export interface StockedProduct {
  id: number
  name: string
  slug: string
  price?: number
  stock: number
}

export interface CategoryRow {
  name: string
  units: number
  revenue: number
}

export interface CourierRow {
  courier: string
  orders: number
  avg_charged: number
  avg_cost: number | null
  cost_known: number
  avg_days: number | null
  delivered: number
  returned: number
}

export interface PlaceRow {
  name: string
  orders: number
  sales: number
}

export interface PaymentRow {
  method: string
  orders: number
  amount: number
}

export interface CouponRow {
  code: string
  uses: number
  discount: number
  sales: number
}

export interface OrderHealth {
  placed: number
  paid: number
  not_paid: number
  delivered: number
  on_the_way: number
  to_pack_and_ship: number
  cancelled_after_payment: number
  returned_by_courier: number
  cancel_rate_percent: number | null
  return_rate_percent: number | null
  delivered_rate_percent: number | null
}

export interface InsightsOverview {
  period: InsightsPeriod
  summary: InsightsSummary
  previous: InsightsSummary
  changes: {
    orders: number | null
    total_paid: number | null
    avg_order_value: number | null
    items_sold: number | null
  }
  gateway_fee_percent: number
  series: SeriesPoint[]
  products: {
    top: TopProduct[]
    not_selling: StockedProduct[]
    low_stock: StockedProduct[]
  }
  categories: CategoryRow[]
  delivery: { by_courier: CourierRow[] }
  customers: {
    buyers: number
    new: number
    returning: number
    top_cities: PlaceRow[]
    top_states: PlaceRow[]
  }
  payments: PaymentRow[]
  coupons: CouponRow[]
  order_health: OrderHealth
}

// GET /admin/analytics/highlights — what store owners (admins) see on the main dashboard.
// Units and stock counts only, no money figures.
export interface BestSeller {
  product_id: number | null
  name: string
  image: string | null
  slug: string | null
  units: number
}

export interface Highlights {
  period: { start: string; end: string; days: number }
  best_sellers: BestSeller[]
  low_stock: StockedProduct[]
}

export interface DeliveryCostSyncResult {
  checked: number
  updated: number
  not_available: number
}
