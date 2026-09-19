import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/types/common"
import type {
  DeliveryCostSyncResult,
  Highlights,
  InsightsOverview,
} from "@/types/analytics"

// start / end are YYYY-MM-DD in India time, both days included.
export async function getInsights(
  start: string,
  end: string
): Promise<InsightsOverview> {
  const { data } = await api.get<ApiEnvelope<InsightsOverview>>(
    "/admin/analytics/overview",
    { params: { start, end } }
  )
  return data.data
}

// Best sellers for the chosen days + what is low on stock now, for the main dashboard.
export async function getHighlights(
  start: string,
  end: string
): Promise<Highlights> {
  const { data } = await api.get<ApiEnvelope<Highlights>>(
    "/admin/analytics/highlights",
    { params: { start, end } }
  )
  return data.data
}

// Re-reads what Shiprocket really charged for each shipment.
export async function syncDeliveryCosts(): Promise<DeliveryCostSyncResult> {
  const { data } = await api.post<ApiEnvelope<DeliveryCostSyncResult>>(
    "/admin/analytics/sync-delivery-costs"
  )
  return data.data
}
