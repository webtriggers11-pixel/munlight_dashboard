export interface Category {
  id         : number
  name       : string
  slug       : string
  description: string | null
  image      : string | null
  parent_id  : number | null
  sort_order : number
  is_active  : boolean
  created_at : string
  children   : Category[]
}

export interface CategoryCreate {
  name        : string
  slug?       : string
  description?: string
  image?      : string
  parent_id?  : number
  sort_order? : number
  is_active?  : boolean
}

export type CategoryUpdate = Partial<CategoryCreate> & { is_active?: boolean }
