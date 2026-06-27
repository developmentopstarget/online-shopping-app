import { useState, useEffect } from 'react'
import type { CartItem } from '../types'

const STORAGE_KEY = 'sneaker_cart'

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as CartItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { ...item, quantity }]
    })
  }

  function updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product_id !== productId))
      return
    }
    setCart((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
    )
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((i) => i.product_id !== productId))
  }

  function clearCart() {
    setCart([])
  }

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return { cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, subtotal }
}
