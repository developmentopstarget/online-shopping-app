import { useState, useEffect } from 'react'
import type { Product } from '../types'

const API_URL = 'http://localhost:8000'

const STOCK_BADGE: Record<string, string> = {
  in_stock: 'bg-green-100 text-green-700',
  low_stock: 'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-600',
}

const STOCK_LABEL: Record<string, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
}

interface Props {
  productId: number
  onAddToCart: (product: Product, quantity: number) => void
  onBuyNow: (product: Product, quantity: number) => void
  onBack: () => void
}

export default function ProductDetailView({ productId, onAddToCart, onBuyNow, onBack }: Props) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/api/products/${productId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Product not found')
        return r.json()
      })
      .then((data: Product) => {
        setProduct(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [productId])

  function handleAddToCart() {
    if (!product) return
    onAddToCart(product, quantity)
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1500)
  }

  function handleBuyNow() {
    if (!product) return
    onBuyNow(product, quantity)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900">
            ← Back
          </button>
          <div className="w-full aspect-square bg-white rounded-2xl border border-gray-200 animate-pulse" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-100 rounded-lg animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-1/2" />
            <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-1/4" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center space-y-4">
          <p className="text-sm text-gray-500">{error ?? 'Product not found.'}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700"
          >
            Back to shop
          </button>
        </div>
      </div>
    )
  }

  const outOfStock = product.stock_status === 'out_of_stock'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900">
          ← Back
        </button>

        {/* Image */}
        <div className="w-full aspect-square bg-blue-50 rounded-2xl flex items-center justify-center text-8xl overflow-hidden">
          {product.image_url && !imgError
            ? <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            : '👟'}
        </div>

        {/* Info */}
        <div className="space-y-3">
          <h1 className="text-xl font-semibold text-gray-900 leading-snug">{product.name}</h1>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{product.category_name}</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-amber-500">
              ★ <span className="text-gray-600">{product.rating.toFixed(1)}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STOCK_BADGE[product.stock_status]}`}>
              {product.stock_status === 'low_stock'
                ? `Low stock (${product.stock} left)`
                : STOCK_LABEL[product.stock_status]}
            </span>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Quantity */}
        {!outOfStock && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-400 flex items-center justify-center disabled:opacity-40"
              >
                −
              </button>
              <span className="text-sm font-medium w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                disabled={quantity >= 10}
                className="w-8 h-8 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-400 flex items-center justify-center disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pb-6">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`w-full py-3.5 rounded-xl text-sm font-medium transition-colors
              ${outOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : addedFeedback
                  ? 'bg-green-600 text-white'
                  : 'border border-gray-900 text-gray-900 hover:bg-gray-50'
              }`}
          >
            {outOfStock ? 'Out of stock' : addedFeedback ? 'Added to cart ✓' : 'Add to cart'}
          </button>

          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className={`w-full py-3.5 rounded-xl text-sm font-medium transition-colors
              ${outOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-700 active:bg-gray-800'
              }`}
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  )
}
