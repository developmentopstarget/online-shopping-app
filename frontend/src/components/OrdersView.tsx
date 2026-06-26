import { useState, useEffect } from 'react'
import type { Order, OrderDetail } from '../types'

const API_URL = 'http://localhost:8000'

interface Props {
  onBack: () => void
}

export default function OrdersView({ onBack }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/orders`)
      .then((r) => r.json())
      .then((data: Order[]) => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function viewDetail(orderId: number) {
    const resp = await fetch(`${API_URL}/api/orders/${orderId}`)
    const data = (await resp.json()) as OrderDetail
    setSelected(data)
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              ← Orders
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Order #{selected.id}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {new Date(selected.created_at).toLocaleString()}
          </p>
          <div className="space-y-2">
            {selected.items.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">${selected.total.toFixed(2)}</span>
          </div>
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
          <h1 className="text-xl font-semibold text-gray-900">My orders</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => viewDetail(order.id)}
                className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between text-left hover:border-gray-400 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">Order #{order.id}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()} ·{' '}
                    {order.item_count} item{order.item_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-green-600 capitalize">{order.status}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
