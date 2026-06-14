export interface ShippingConfig {
  id: number
  provider: string
  display_name: string
  email: string
  password: string
  is_active: boolean
  is_test_mode: boolean
  token_expires_at: string | null
  has_valid_token: boolean
  webhook_secret: string | null
  extra_config: string | null
  created_at: string
  updated_at: string | null
}

export interface ShippingConfigCreate {
  provider: string
  display_name: string
  email: string
  password: string
  is_active?: boolean
  is_test_mode?: boolean
  webhook_secret?: string
  extra_config?: string
}

export type ShippingConfigUpdate = Partial<
  Omit<ShippingConfigCreate, "provider">
>

export interface ShippingTestResult {
  success: boolean
  message: string
}

export interface SyncPickupResult {
  synced_location: string
  synced_pincode: string
  all_locations: string[]
}

export interface WebhookRegisterResult {
  webhook_url: string
  secret_saved: boolean
}
