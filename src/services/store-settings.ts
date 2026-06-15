import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/types/common"

export interface StoreSettings {
  shipping_fee             : number
  free_shipping_threshold  : number | null
  cod_enabled              : boolean
  cod_charge               : number
  min_order_amount         : number
  pickup_name              : string | null
  pickup_phone             : string | null
  pickup_address           : string | null
  pickup_city              : string | null
  pickup_state             : string | null
  pickup_pincode           : string | null
  pickup_country           : string
  shiprocket_pickup_location: string
}

export type StoreSettingsUpdate = Partial<StoreSettings>

export async function getStoreSettings(): Promise<StoreSettings> {
  const { data } = await api.get<ApiEnvelope<StoreSettings>>("/store/settings")
  return data.data
}

export async function updateStoreSettings(
  payload: StoreSettingsUpdate
): Promise<StoreSettings> {
  const { data } = await api.patch<ApiEnvelope<StoreSettings>>(
    "/admin/store/settings",
    payload
  )
  return data.data
}
