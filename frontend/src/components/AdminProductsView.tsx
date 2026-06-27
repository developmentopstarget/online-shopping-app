import { useState, useEffect, useCallback } from 'react'
import type { Product, Category } from '../types'
import AdminProductForm from './AdminProductForm'

const API_URL = 'http://localhost:8000'

interface Props {
  token: string
  onBack: () => void
}

type Modal =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'edit'; product: Product }
  | { kind: 'delete'; product: Product }

export default function AdminProductsView({ token, onBack }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>({ kind: 'none' })
  const [deleting, setDeleting] = useState(false)

  const authHeaders = { Authorization: `Bearer ${token}` }

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_URL}/admin/products`, { headers: authHeaders })
      if (!resp.ok) throw new Error(`${resp.status}`)
      setProducts(await resp.json())
    } catch {
      setError('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProducts()
    fetch(`${API_URL}/api/categories`)
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => {})
  }, [loadProducts])

  async function handleDelete(product: Product) {
    setDeleting(true)
    try {
      const resp = await fetch(`${API_URL}/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!resp.ok) throw new Error()
      setModal({ kind: 'none' })
      await loadProducts()
    } catch {
      setError('Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  if (modal.kind === 'create' || modal.kind === 'edit') {
    return (
      <AdminProductForm
        token={token}
        categories={categories}
        product={modal.kind === 'edit' ? modal.product : undefined}
        onSaved={() => {
          setModal({ kind: 'none' })
          loadProducts()
        }}
        onCancel={() => setModal({ kind: 'none' })}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
              ← Shop
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Admin · Products</h1>
          </div>
          <button
            onClick={() => setModal({ kind: 'create' })}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700"
          >
            + New product
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-2xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-16">No products yet.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Rating</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100" />
                        )}
                        <span className="font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category_name}</td>
                    <td className="px-4 py-3 text-right text-gray-900">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          p.stock === 0
                            ? 'text-red-500'
                            : p.stock <= 5
                            ? 'text-amber-500'
                            : 'text-gray-700'
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.rating.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal({ kind: 'edit', product: p })}
                          className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setModal({ kind: 'delete', product: p })}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {modal.kind === 'delete' && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm w-full space-y-4">
            <h2 className="font-semibold text-gray-900">Delete product?</h2>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">{modal.product.name}</span> will be permanently
              removed from the catalogue. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModal({ kind: 'none' })}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(modal.product)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
