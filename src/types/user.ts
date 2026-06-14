import type { UserRole } from "@/types/common"

export interface User {
  id: number
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminLoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface CreateAdminRequest {
  full_name: string
  email: string
  password: string
}
