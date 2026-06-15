export interface Product {
  id              : number
  name            : string
  slug            : string
  description     : string | null
  price           : number
  mrp             : number
  stock           : number
  images          : string[] | null
  category_id     : number | null
  category_slug   : string | null
  subcategory_slug: string | null
  tags            : string[] | null
  is_active       : boolean
  is_handmade     : boolean
  is_featured     : boolean
  is_new          : boolean
  is_bestseller   : boolean
  avg_rating      : number
  review_count    : number
  weight          : number | null
  length          : number | null
  breadth         : number | null
  height          : number | null
  hsn_code        : string | null
  sku             : string | null
  collection      : string | null
  material        : string | null
  color           : string | null
  created_at      : string
}

export interface ProductCreate {
  name         : string
  slug?        : string
  description? : string
  price        : number
  mrp          : number
  stock?       : number
  images?      : string[]
  category_id? : number
  tags?        : string[]
  is_handmade? : boolean
  is_featured? : boolean
  is_new?      : boolean
  is_bestseller?: boolean
  weight?      : number
  length?      : number
  breadth?     : number
  height?      : number
  hsn_code?    : string
  sku?         : string
  collection?  : string
  material?    : string
  color?       : string
}

export type ProductUpdate = Partial<ProductCreate> & { is_active?: boolean }
