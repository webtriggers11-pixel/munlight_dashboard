import { api } from "@/lib/api"
import type {
  ApiEnvelope,
  OrderStatus,
  Paginated,
  PaginatedEnvelope,
} from "@/types/common"
import type { Order, OrderStatusUpdate } from "@/types/order"

export async function listOrders(
  page = 1,
  pageSize = 20,
  status?: OrderStatus
): Promise<Paginated<Order>> {
  const { data } = await api.get<PaginatedEnvelope<Order>>("/orders", {
    params: { page, page_size: pageSize, ...(status ? { status } : {}) },
  })
  return {
    items: data.data,
    total: data.total,
    page: data.page,
    page_size: data.page_size,
    total_pages: data.total_pages,
  }
}

export async function updateOrderStatus(
  orderId: number,
  payload: OrderStatusUpdate
): Promise<Order> {
  const { data } = await api.patch<ApiEnvelope<Order>>(
    `/orders/${orderId}/status`,
    payload
  )
  return data.data
}

export async function confirmOrder(orderId: number): Promise<Order> {
  const { data } = await api.patch<ApiEnvelope<Order>>(
    `/orders/${orderId}/confirm`
  )
  return data.data
}

export async function confirmCod(orderId: number): Promise<Order> {
  const { data } = await api.patch<ApiEnvelope<Order>>(
    `/orders/${orderId}/confirm-cod`
  )
  return data.data
}
