export interface GatewayConfig {
  id: number
  gateway: string
  display_name: string
  key_id: string
  key_secret: string
  extra_config: string | null
  is_active: boolean
  is_test_mode: boolean
  created_at: string
  updated_at: string | null
}

export interface GatewayConfigCreate {
  gateway: string
  display_name: string
  key_id: string
  key_secret: string
  extra_config?: string
  is_active?: boolean
  is_test_mode?: boolean
}

export type GatewayConfigUpdate = Partial<
  Omit<GatewayConfigCreate, "gateway">
>
