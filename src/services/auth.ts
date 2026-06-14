import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/types/common"
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  CreateAdminRequest,
  User,
} from "@/types/user"

export async function adminLogin(
  payload: AdminLoginRequest
): Promise<AdminLoginResponse> {
  const { data } = await api.post<ApiEnvelope<AdminLoginResponse>>(
    "/auth/admin-login",
    payload
  )
  return data.data
}

export async function createAdmin(payload: CreateAdminRequest): Promise<User> {
  const { data } = await api.post<ApiEnvelope<User>>(
    "/admin/create-admin",
    payload
  )
  return data.data
}
