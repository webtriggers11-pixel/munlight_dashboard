import { api } from "@/lib/api"
import type { ApiEnvelope, Paginated, PaginatedEnvelope } from "@/types/common"
import type { Product, ProductCreate, ProductUpdate } from "@/types/product"

export async function listProducts(
  page = 1,
  pageSize = 20
): Promise<Paginated<Product>> {
  const { data } = await api.get<PaginatedEnvelope<Product>>("/products", {
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

export async function createProduct(payload: ProductCreate): Promise<Product> {
  const { data } = await api.post<ApiEnvelope<Product>>("/products", payload)
  return data.data
}

export async function updateProduct(
  productId: number,
  payload: ProductUpdate
): Promise<Product> {
  const { data } = await api.put<ApiEnvelope<Product>>(
    `/products/${productId}`,
    payload
  )
  return data.data
}

export async function deleteProduct(productId: number): Promise<void> {
  await api.delete(`/products/${productId}`)
}
