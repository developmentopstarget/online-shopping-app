export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface AuthUser {
  id: number
  email: string
  is_admin: boolean
}

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
  name: string
  price: number
  image_url: string | null
}

export interface CheckoutResult {
  success: boolean
  order_id: number
  total: number
  message: string
}

export interface OrderItem {
  product_id: number
  product_name: string
  price: number
  quantity: number
}

export interface Order {
  id: number
  created_at: string
  status: string
  total: number
  item_count: number
}

export interface OrderDetail {
  id: number
  created_at: string
  status: string
  total: number
  items: OrderItem[]
}
