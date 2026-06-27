import { useState } from 'react'
import type { Product, Category } from '../types'

const API_URL = 'http://localhost:8000'

interface Props {
  token: string
  categories: Category[]
  product?: Product
  onSaved: () => void
  onCancel: () => void
}

interface FormFields {
  name: string
  price: string
  category_id: string
  description: string
  rating: string
  stock: string
  image_url: string
}

export default function AdminProductForm({ token, categories, product, onSaved, onCancel }: Props) {
  const isEdit = product !== undefined

  const [fields, setFields] = useState<FormFields>({
    name: product?.name ?? '',
    price: product ? String(product.price) : '',
    category_id: product ? String(product.category_id) : (categories[0]?.id ? String(categories[0].id) : ''),
    description: product?.description ?? '',
    rating: product ? String(product.rating) : '0',
    stock: product ? String(product.stock) : '0',
    image_url: product?.image_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormFields, string>>>({})

  function set(key: keyof FormFields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFields((f) => ({ ...f, [key]: e.target.value }))
      setFieldErrors((fe) => ({ ...fe, [key]: undefined }))
    }
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormFields, string>> = {}
    if (!fields.name.trim()) errs.name = 'Name is required'
    const price = parseFloat(fields.price)
    if (isNaN(price) || price <= 0) errs.price = 'Price must be greater than 0'
    if (!fields.category_id) errs.category_id = 'Category is required'
    const stock = parseInt(fields.stock, 10)
    if (isNaN(stock) || stock < 0) errs.stock = 'Stock must be 0 or more'
    const rating = parseFloat(fields.rating)
    if (isNaN(rating) || rating < 0 || rating > 5) errs.rating = 'Rating must be between 0 and 5'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setError(null)

    const body = {
      name: fields.name.trim(),
      price: parseFloat(fields.price),
      category_id: parseInt(fields.category_id, 10),
      description: fields.description.trim(),
      rating: parseFloat(fields.rating),
      stock: parseInt(fields.stock, 10),
      image_url: fields.image_url.trim() || null,
    }

    try {
      const url = isEdit
        ? `${API_URL}/admin/products/${product!.id}`
        : `${API_URL}/admin/products`
      const resp = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { detail?: unknown }
        const msg = Array.isArray(data.detail)
          ? (data.detail as { msg: string }[]).map((e) => e.msg).join(', ')
          : (data.detail as string | undefined) ?? 'Save failed.'
        setError(msg)
        return
      }
      onSaved()
    } catch {
      setError('Could not reach the server.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600">
            ← Products
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            Admin · {isEdit ? 'Edit product' : 'Add product'}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          {/* Image URL / placeholder */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Image URL
            </label>
            <input
              type="url"
              value={fields.image_url}
              onChange={set('image_url')}
              placeholder="https://example.com/shoe.jpg (optional)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
            {fields.image_url && (
              <div className="mt-2 w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                <img src={fields.image_url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Name */}
          <Field label="Name" error={fieldErrors.name}>
            <input
              type="text"
              value={fields.name}
              onChange={set('name')}
              placeholder="Product name"
              className={inputClass(!!fieldErrors.name)}
            />
          </Field>

          {/* Price + Stock row */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price ($)" error={fieldErrors.price}>
              <input
                type="number"
                value={fields.price}
                onChange={set('price')}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className={inputClass(!!fieldErrors.price)}
              />
            </Field>
            <Field label="Stock" error={fieldErrors.stock}>
              <input
                type="number"
                value={fields.stock}
                onChange={set('stock')}
                min="0"
                step="1"
                placeholder="0"
                className={inputClass(!!fieldErrors.stock)}
              />
            </Field>
          </div>

          {/* Category + Rating row */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" error={fieldErrors.category_id}>
              <select
                value={fields.category_id}
                onChange={set('category_id')}
                className={inputClass(!!fieldErrors.category_id)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Rating (0–5)" error={fieldErrors.rating}>
              <input
                type="number"
                value={fields.rating}
                onChange={set('rating')}
                min="0"
                max="5"
                step="0.1"
                placeholder="0.0"
                className={inputClass(!!fieldErrors.rating)}
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description" error={fieldErrors.description}>
            <textarea
              value={fields.description}
              onChange={set('description')}
              rows={3}
              placeholder="Short product description"
              className={`resize-none ${inputClass(!!fieldErrors.description)}`}
            />
          </Field>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-100 ${
    hasError ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
  }`
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
