import { useState, useEffect } from 'react'
import type { Product, Category, CheckoutResult } from './types'
import { useDebounce } from './hooks/useDebounce'
import { useCart } from './hooks/useCart'
import ProductCard from './components/ProductCard'
import CategoryChips from './components/CategoryChips'
import CartView from './components/CartView'
import OrderConfirmation from './components/OrderConfirmation'
import OrdersView from './components/OrdersView'

const API_URL = 'http://localhost:8000'

type View = 'shop' | 'cart' | 'confirmation' | 'orders'
type SortOption = '' | 'price_asc' | 'price_desc'

export default function App() {
  const [view, setView] = useState<View>('shop')
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [sort, setSort] = useState<SortOption>('')
  const [page, setPage] = useState(1)

  const [orderResult, setOrderResult] = useState<CheckoutResult | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, subtotal } =
    useCart()

  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('q', debouncedSearch)
    if (selectedCategory !== null) params.set('category', String(selectedCategory))
    if (sort) params.set('sort', sort)
    params.set('page', String(page))

    fetch(`${API_URL}/api/products?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load products')
        return r.json()
      })
      .then((data: { items: Product[]; total: number }) => {
        setProducts(data.items)
        setTotal(data.total)
        setLoading(false)
      })
      .catch((err: Error) => {
        setFetchError(err.message)
        setLoading(false)
      })
  }, [debouncedSearch, selectedCategory, sort, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedCategory, sort])

  async function handlePlaceOrder() {
    setIsSubmitting(true)
    setCheckoutError(null)
    try {
      const resp = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(({ product_id, quantity }) => ({ product_id, quantity })),
        }),
      })
      const data = (await resp.json()) as CheckoutResult & { detail?: string }
      if (!resp.ok) {
        setCheckoutError(data.detail ?? 'Checkout failed')
        return
      }
      clearCart()
      setOrderResult(data)
      setView('confirmation')
    } catch {
      setCheckoutError('Could not reach the server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPages = Math.ceil(total / 12)

  if (view === 'confirmation' && orderResult) {
    return (
      <OrderConfirmation
        result={orderResult}
        onBackToShop={() => {
          setOrderResult(null)
          setView('shop')
        }}
        onViewOrders={() => {
          setOrderResult(null)
          setView('orders')
        }}
      />
    )
  }

  if (view === 'orders') {
    return <OrdersView onBack={() => setView('shop')} />
  }

  if (view === 'cart') {
    return (
      <CartView
        cart={cart}
        subtotal={subtotal}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onPlaceOrder={handlePlaceOrder}
        onBack={() => setView('shop')}
        isSubmitting={isSubmitting}
        error={checkoutError}
      />
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center">
          <p className="text-sm text-gray-500">
            Couldn't reach the backend. Is it running on port 8000?
          </p>
          <p className="text-xs text-red-400 mt-2">{fetchError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Sneaker shop</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('orders')}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Orders
            </button>
            <button
              onClick={() => setView('cart')}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              🛒 {totalItems}
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search sneakers…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
        />

        {/* Category chips + sort */}
        <div className="space-y-3">
          <CategoryChips
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:border-gray-400"
            >
              <option value="">Default</option>
              <option value="price_asc">Price: low → high</option>
              <option value="price_desc">Price: high → low</option>
            </select>
            {total > 0 && (
              <span className="ml-auto text-xs text-gray-400">
                {total} product{total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 bg-white rounded-2xl border border-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No products match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cart={cart}
                onAddToCart={(p) =>
                  addToCart({
                    product_id: p.id,
                    name: p.name,
                    price: p.price,
                    image_url: p.image_url,
                  })
                }
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-gray-400 bg-white"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-gray-400 bg-white"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Sticky cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => setView('cart')}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700"
            >
              View cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
