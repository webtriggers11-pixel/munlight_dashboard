import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/types/common"
import type { Category, CategoryCreate, CategoryUpdate } from "@/types/category"

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<ApiEnvelope<Category[]>>("/categories")
  return data.data
}

export async function createCategory(
  payload: CategoryCreate
): Promise<Category> {
  const { data } = await api.post<ApiEnvelope<Category>>("/categories", payload)
  return data.data
}

export async function updateCategory(
  categoryId: number,
  payload: CategoryUpdate
): Promise<Category> {
  const { data } = await api.put<ApiEnvelope<Category>>(
    `/categories/${categoryId}`,
    payload
  )
  return data.data
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await api.delete(`/categories/${categoryId}`)
}
