import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/types/common"
import type {
  ShippingConfig,
  ShippingConfigCreate,
  ShippingConfigUpdate,
  ShippingTestResult,
  SyncPickupResult,
} from "@/types/shipping-config"

export async function listShippingConfigs(): Promise<ShippingConfig[]> {
  const { data } = await api.get<ApiEnvelope<ShippingConfig[]>>(
    "/admin/shipping-config"
  )
  return data.data
}

export async function createShippingConfig(
  payload: ShippingConfigCreate
): Promise<ShippingConfig> {
  const { data } = await api.post<ApiEnvelope<ShippingConfig>>(
    "/admin/shipping-config",
    payload
  )
  return data.data
}

export async function updateShippingConfig(
  id: number,
  payload: ShippingConfigUpdate
): Promise<ShippingConfig> {
  const { data } = await api.patch<ApiEnvelope<ShippingConfig>>(
    `/admin/shipping-config/${id}`,
    payload
  )
  return data.data
}

export async function deleteShippingConfig(id: number): Promise<void> {
  await api.delete(`/admin/shipping-config/${id}`)
}

export async function testShippingConfig(
  id: number
): Promise<ShippingTestResult> {
  const { data } = await api.post<ApiEnvelope<ShippingTestResult>>(
    `/admin/shipping-config/${id}/test`
  )
  return data.data
}

export async function syncPickupLocation(
  id: number
): Promise<SyncPickupResult> {
  const { data } = await api.post<ApiEnvelope<SyncPickupResult>>(
    `/admin/shipping-config/${id}/sync-pickup`
  )
  return data.data
}
