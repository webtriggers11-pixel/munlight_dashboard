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
  // Address override saved by a super admin; null = using the default.
  base_url: string | null
  // The address requests are actually sent to.
  effective_base_url: string
  created_at: string
  updated_at: string | null
}

// An aggregator this build of the API supports (GET /admin/shipping-config/providers).
export interface ShippingProviderOption {
  provider: string
  display_name: string
  default_base_url: string
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
  // Super admin only. On update, "" removes the override.
  base_url?: string
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
