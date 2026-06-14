import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/types/common"
import type { DashboardStats, RevenuePoint } from "@/types/dashboard"

export async function getDashboard(): Promise<DashboardStats> {
  const { data } = await api.get<ApiEnvelope<DashboardStats>>("/admin/dashboard")
  return data.data
}

export async function getRevenueSeries(days = 90): Promise<RevenuePoint[]> {
  const { data } = await api.get<ApiEnvelope<RevenuePoint[]>>(
    "/admin/revenue-series",
    { params: { days } }
  )
  return data.data
}
