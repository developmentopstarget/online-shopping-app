import { useState } from 'react'
import type { Product, CartItem } from '../types'

interface Props {
  product: Product
  cart: CartItem[]
  onAddToCart: (product: Product) => void
}

const STOCK_BADGE: Record<string, string> = {
  in_stock: 'bg-green-100 text-green-700',
  low_stock: 'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-600',
}

const STOCK_LABEL: Record<string, string> = {
  in_stock: 'In stock',
  low_stock: `Low stock`,
  out_of_stock: 'Out of stock',
}

export default function ProductCard({ product, cart, onAddToCart }: Props) {
  const outOfStock = product.stock_status === 'out_of_stock'
  const cartItem = cart.find((i) => i.product_id === product.id)
  const [imgError, setImgError] = useState(false)


  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Product image */}
      <div className="h-40 bg-blue-50 flex items-center justify-center text-5xl select-none overflow-hidden">
        {product.image_url && !imgError
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          : '👟'}
      </div>

      <div className="flex flex-col gap-2 p-4 flex-1">
        <p className="font-medium text-sm text-gray-900 leading-snug">{product.name}</p>
        <p className="text-xs text-gray-500">{product.category_name}</p>

        <div className="flex items-center gap-1.5 text-xs text-amber-500">
          <span>★</span>
          <span className="text-gray-600">{product.rating.toFixed(1)}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-semibold text-gray-900">${product.price.toFixed(2)}</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${STOCK_BADGE[product.stock_status]}`}
          >
            {product.stock_status === 'low_stock'
              ? `Low (${product.stock})`
              : STOCK_LABEL[product.stock_status]}
          </span>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          disabled={outOfStock}
          className={`mt-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors
            ${outOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-700 active:bg-gray-800'
            }`}
        >
          {outOfStock
            ? 'Out of stock'
            : cartItem
              ? `In cart (${cartItem.quantity})`
              : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}
