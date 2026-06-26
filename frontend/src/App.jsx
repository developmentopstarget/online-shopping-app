import { useState, useEffect } from 'react'

// The backend's address. In production this would come from an
// environment variable, but a plain constant is fine for v1.
const API_URL = 'http://localhost:8000'

function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([]) // array of { product_id, quantity }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [orderResult, setOrderResult] = useState(null)

  // Fetch products from the backend once, when the app first loads.
  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load products')
        return res.json()
      })
      .then((data) => {
        setProducts(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  function addToCart(productId) {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === productId)
      if (existing) {
        return prevCart.map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { product_id: productId, quantity: 1 }]
    })
  }

  function totalItemsInCart() {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  function handleCheckout() {
    fetch(`${API_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart }),
    })
      .then((res) => res.json())
      .then((data) => {
        setOrderResult(data)
        setCart([])
      })
      .catch((err) => setError(err.message))
  }

  // --- Render states ---

  if (loading) {
    return (
      <div className="app">
        <p className="status-message">Loading products…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <p className="status-message">
          Couldn't reach the backend. Is it running on port 8000?
          <br />
          ({error})
        </p>
      </div>
    )
  }

  if (orderResult) {
    return (
      <div className="app">
        <div className="status-message">
          <p style={{ fontWeight: 500 }}>Order placed (test mode)</p>
          <p>Order ID: {orderResult.order_id}</p>
          <p>Total: ${orderResult.total.toFixed(2)}</p>
          <p style={{ color: '#6b6b68', fontSize: 13 }}>{orderResult.message}</p>
          <button onClick={() => setOrderResult(null)}>Back to shop</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Sneaker shop</h1>
        <span>🛒 {totalItemsInCart()}</span>
      </div>

      <div className="product-list">
        {products.map((product) => (
          <div className="product-card" key={product.id}>
            <div className="product-icon">👟</div>
            <div className="product-info">
              <p className="product-name">{product.name}</p>
              <p className="product-price">${product.price.toFixed(2)}</p>
            </div>
            <button onClick={() => addToCart(product.id)}>Add</button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="cart-bar">
          <button className="primary" onClick={handleCheckout}>
            Checkout ({totalItemsInCart()} item{totalItemsInCart() !== 1 ? 's' : ''}) — test mode
          </button>
        </div>
      )}
    </div>
  )
}

export default App
