import { useState } from 'react'
import type { CartItem } from '../types'

function CartItemImage({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [imgError, setImgError] = useState(false)
  return (
    <div className="h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden">
      {imageUrl && !imgError
        ? <img src={imageUrl} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        : '👟'}
    </div>
  )
}

interface Props {
  cart: CartItem[]
  subtotal: number
  isAuthenticated: boolean
  onUpdateQuantity: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  onPlaceOrder: () => void
  onBack: () => void
  onNavigateToLogin: () => void
  onNavigateToDetail: (productId: number) => void
  isSubmitting: boolean
  error: string | null
}

export default function CartView({
  cart,
  subtotal,
  isAuthenticated,
  onUpdateQuantity,
  onRemove,
  onPlaceOrder,
  onBack,
  onNavigateToLogin,
  onNavigateToDetail,
  isSubmitting,
  error,
}: Props) {
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  function handlePlaceOrderClick() {
    if (!isAuthenticated) {
      setShowAuthPrompt(true)
    } else {
      onPlaceOrder()
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-gray-500 text-sm">Your cart is empty.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900">
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Your cart</h1>
        </div>

        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.product_id}
              className="bg-white rounded-2xl border border-gray-200 flex items-center gap-4 overflow-hidden"
            >
              {/* Clickable zone: image + name/price — navigates to detail */}
              <button
                onClick={() => onNavigateToDetail(item.product_id)}
                className="flex items-center gap-4 flex-1 min-w-0 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400 hover:bg-gray-50 transition-colors"
              >
                <CartItemImage imageUrl={item.image_url} name={item.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                </div>
              </button>

              {/* Quantity controls + Remove — sibling zone, no nesting */}
              <div className="flex items-center gap-2 shrink-0 pr-4">
                <button
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-400 flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-400 flex items-center justify-center"
                >
                  +
                </button>
                <button
                  onClick={() => onRemove(item.product_id)}
                  className="ml-1 text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">Subtotal</span>
          <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {showAuthPrompt ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3 text-center">
            <p className="text-sm font-medium text-gray-900">Sign in to save your order history</p>
            <p className="text-xs text-gray-400">Or continue as a guest — your order will still go through.</p>
            <button
              onClick={() => {
                setShowAuthPrompt(false)
                onNavigateToLogin()
              }}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700"
            >
              Sign in / Create account
            </button>
            <button
              onClick={() => {
                setShowAuthPrompt(false)
                onPlaceOrder()
              }}
              disabled={isSubmitting}
              className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-gray-400 disabled:opacity-50"
            >
              {isSubmitting ? 'Placing order…' : 'Continue as guest'}
            </button>
          </div>
        ) : (
          <button
            onClick={handlePlaceOrderClick}
            disabled={isSubmitting}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Placing order…' : 'Place order'}
          </button>
        )}
      </div>
    </div>
  )
}
