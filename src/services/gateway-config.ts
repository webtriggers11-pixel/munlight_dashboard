import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/types/common"
import type {
  GatewayConfig,
  GatewayConfigCreate,
  GatewayConfigUpdate,
} from "@/types/gateway"

export async function listGateways(): Promise<GatewayConfig[]> {
  const { data } = await api.get<ApiEnvelope<GatewayConfig[]>>(
    "/admin/gateway-config"
  )
  return data.data
}

export async function createGateway(
  payload: GatewayConfigCreate
): Promise<GatewayConfig> {
  const { data } = await api.post<ApiEnvelope<GatewayConfig>>(
    "/admin/gateway-config",
    payload
  )
  return data.data
}

export async function updateGateway(
  id: number,
  payload: GatewayConfigUpdate
): Promise<GatewayConfig> {
  const { data } = await api.patch<ApiEnvelope<GatewayConfig>>(
    `/admin/gateway-config/${id}`,
    payload
  )
  return data.data
}

export async function deleteGateway(id: number): Promise<void> {
  await api.delete(`/admin/gateway-config/${id}`)
}
