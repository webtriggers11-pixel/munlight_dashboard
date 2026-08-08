import { api } from "@/lib/api"
import type { ApiEnvelope, Paginated, PaginatedEnvelope } from "@/types/common"
import type { Product, ProductCreate, ProductUpdate } from "@/types/product"

export async function listProducts(
  page = 1,
  pageSize = 20,
  includeInactive = true,
  search?: string
): Promise<Paginated<Product>> {
  const { data } = await api.get<PaginatedEnvelope<Product>>("/products", {
    params: {
      page,
      page_size: pageSize,
      include_inactive: includeInactive,
      search: search?.trim() || undefined,
    },
  })
  return {
    items: data.data,
    total: data.total,
    page: data.page,
    page_size: data.page_size,
    total_pages: data.total_pages,
  }
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const { data } = await api.get<ApiEnvelope<Product>>(`/products/${slug}`)
  return data.data
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

export type BulkImportStatus = "created" | "updated" | "revived" | "skipped"

export interface BulkImportRowResult {
  row: number
  sku: string | null
  name: string
  status: BulkImportStatus
  error: string | null
  warnings: string[]
}

export interface BulkImportSummary {
  dry_run: boolean
  total: number
  created: number
  updated: number
  revived: number
  skipped: number
  rows: BulkImportRowResult[]
}

// Upload a CSV or Excel sheet of products. Matching is by SKU — existing SKUs
// are updated in place, new SKUs are created. Pass dryRun=true to validate and
// preview the outcome without writing anything to the DB.
export async function bulkImportProducts(
  file: File,
  dryRun = false
): Promise<BulkImportSummary> {
  const form = new FormData()
  form.append("file", file)
  const { data } = await api.post<ApiEnvelope<BulkImportSummary>>(
    "/products/bulk-import",
    form,
    {
      params: { dry_run: dryRun },
      headers: { "Content-Type": "multipart/form-data" },
    }
  )
  return data.data
}
