import { api } from "@/lib/api"
import type { ApiEnvelope, Paginated, PaginatedEnvelope } from "@/types/common"
import type { User } from "@/types/user"

export async function listUsers(
  page = 1,
  pageSize = 20
): Promise<Paginated<User>> {
  const { data } = await api.get<PaginatedEnvelope<User>>("/admin/users", {
    params: { page, page_size: pageSize },
  })
  return {
    items: data.data,
    total: data.total,
    page: data.page,
    page_size: data.page_size,
    total_pages: data.total_pages,
  }
}

export async function getUser(userId: number): Promise<User> {
  const { data } = await api.get<ApiEnvelope<User>>(`/admin/users/${userId}`)
  return data.data
}

export async function toggleUserStatus(userId: number): Promise<User> {
  const { data } = await api.patch<ApiEnvelope<User>>(
    `/admin/users/${userId}/status`
  )
  return data.data
}
