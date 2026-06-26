export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  price: number
  category_id: number
  category_name: string
  description: string
  rating: number
  stock: number
  image_url: string | null
  stock_status: StockStatus
}

export interface ProductListResponse {
  items: Product[]
  total: number
}

export interface CartItem {
  product_id: number
  quantity: number
}
