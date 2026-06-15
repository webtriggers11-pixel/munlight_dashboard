import { api } from "@/lib/api"
import type { ApiEnvelope } from "@/types/common"
import type { Category, CategoryCreate, CategoryUpdate } from "@/types/category"

export async function listCategories(
  includeInactive = true
): Promise<Category[]> {
  // flat=true returns all categories (top-level + subcategories) without nesting — used for admin dropdowns
  const { data } = await api.get<ApiEnvelope<Category[]>>("/categories", {
    params: { include_inactive: includeInactive, flat: true },
  })
  return data.data
}

export async function listCategoryHierarchy(
  includeInactive = true
): Promise<Category[]> {
  // Returns top-level categories with their children array — used for hierarchy display
  const { data } = await api.get<ApiEnvelope<Category[]>>("/categories", {
    params: { include_inactive: includeInactive },
  })
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
