import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/types/common"
import type { WebhookRegisterResult } from "@/types/shipping-config"

export async function registerShiprocketWebhook(
  configId: number,
  webhookUrl: string
): Promise<WebhookRegisterResult> {
  const { data } = await api.post<ApiEnvelope<WebhookRegisterResult>>(
    "/webhooks/shiprocket/register",
    null,
    { params: { config_id: configId, webhook_url: webhookUrl } }
  )
  return data.data
}
