export interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  price: number
  mrp: number
  stock: number
  images: string[] | null
  category_id: number | null
  tags: string[] | null
  is_active: boolean
  is_handmade: boolean
  is_featured: boolean
  is_new: boolean
  is_bestseller: boolean
  avg_rating: number
  review_count: number
  weight: number | null
  sku: string | null
  created_at: string
}

export interface ProductCreate {
  name: string
  description?: string
  price: number
  mrp: number
  stock?: number
  images?: string[]
  category_id?: number
  tags?: string[]
  is_handmade?: boolean
  is_featured?: boolean
  is_new?: boolean
  is_bestseller?: boolean
  weight?: number
  sku?: string
}

export type ProductUpdate = Partial<ProductCreate> & { is_active?: boolean }
