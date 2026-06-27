import type { CheckoutResult } from '../types'

interface Props {
  result: CheckoutResult
  isAuthenticated: boolean
  onBackToShop: () => void
  onViewOrders: () => void
}

export default function OrderConfirmation({ result, isAuthenticated, onBackToShop, onViewOrders }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center space-y-3">
        <div className="text-4xl">✅</div>
        <p className="font-semibold text-gray-900">Order placed!</p>
        <p className="text-sm text-gray-500">Order #{result.order_id}</p>
        <p className="text-lg font-medium text-gray-900">${result.total.toFixed(2)}</p>
        <div className="pt-2 space-y-2">
          {isAuthenticated && (
            <button
              onClick={onViewOrders}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700"
            >
              View my orders
            </button>
          )}
          <button
            onClick={onBackToShop}
            className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-gray-400"
          >
            Back to shop
          </button>
        </div>
      </div>
    </div>
  )
}
