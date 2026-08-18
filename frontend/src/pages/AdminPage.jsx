import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { API_URL, VANTAGE_LOGO } from '../config/app'
import { productImageUrl } from '../utils/products'
import { readStorage } from '../utils/storage'
import { AdminLoginPage } from './AdminLoginPage'

function ProductManager({ products, loading, saving, message, submit }) {
  return (
    <div className="admin-layout">
      <section className="admin-form-card">
        <h2>Add an item</h2>
        <p>Product details and the uploaded image appear in the catalog immediately.</p>
        <form onSubmit={submit}>
          <label><span>Product name</span><input name="name" placeholder="Minimal Leather Bag" required /></label>
          <label><span>Description</span><textarea name="description" placeholder="Describe the product..." rows="4" /></label>
          <label><span>Category</span><input name="category" placeholder="Bags" defaultValue="Bags" required /></label>
          <label><span>Price</span><div className="price-input"><b>$</b><input type="number" name="price" min="0" step="0.01" placeholder="0.00" required /></div></label>
          <label><span>Product image</span><input className="file-input" type="file" name="image" accept="image/png,image/jpeg,image/webp,image/gif" required /><small>JPG, PNG, WebP, or GIF. Maximum 5 MB.</small></label>
          {message && <p className="form-message success">{message}</p>}
          <button className="primary-btn" disabled={saving}>{saving ? 'Uploading…' : <>Add Product <Icon>add</Icon></>}</button>
        </form>
      </section>
      <section className="admin-products">
        <div className="admin-products-head"><h2>Database items</h2></div>
        {loading ? <EmptyState title="Loading products…" />
          : products.length === 0 ? <EmptyState icon="inventory_2" title="No products yet" />
            : <div className="admin-product-grid">{products.map((product) => <article key={product.id}><img src={productImageUrl(product.image_url)} alt={product.name} /><div><small>#{product.id}</small><h3>{product.name}</h3><p>{product.description || 'No description provided.'}</p><footer><b>${Number(product.price).toFixed(2)}</b><span>{new Date(product.created_at).toLocaleDateString()}</span></footer></div></article>)}</div>}
      </section>
    </div>
  )
}

function OrderManager({ orders, loading, completeOrder }) {
  if (loading) return <EmptyState title="Loading orders…" />
  if (orders.length === 0) return <EmptyState icon="receipt_long" title="No orders yet" text="Customer orders will appear here after checkout." />

  return (
    <div className="admin-orders-list">
      {orders.map((order) => (
        <article className="admin-order-card" key={order.id}>
          <header><div><small>Order #{order.id}</small><h2>{order.customer_name}</h2><span>{order.email}</span></div><b className={order.order_status === 'Completed' ? 'status-complete' : 'status-transit'}>{order.order_status}</b></header>
          <div className="admin-order-meta"><span><small>Deliver to</small>{order.shipping_address}</span><span><small>Placed</small>{new Date(order.created_at).toLocaleString()}</span><span><small>Payment</small>{order.payment_status}</span></div>
          <div className="admin-order-items">{order.items.map((item) => <div key={item.productId}><img src={productImageUrl(item.imageUrl)} alt={item.name} /><span><b>{item.name}</b><small>Qty {item.quantity}</small></span><strong>${(Number(item.price) * item.quantity).toFixed(2)}</strong></div>)}</div>
          <footer><b>Total: ${Number(order.total).toFixed(2)}</b>{order.order_status === 'Completed' ? <span className="completed-label"><Icon>task_alt</Icon>Order completed</span> : <button className="primary-btn complete-order-btn" onClick={() => completeOrder(order.id)}><Icon>task_alt</Icon>Complete Order</button>}</footer>
        </article>
      ))}
    </div>
  )
}

export function AdminPage({ go }) {
  const admin = readStorage('vantage_admin')
  const adminId = admin?.id
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!adminId) { setLoading(false); return }
    Promise.all([
      fetch(`${API_URL}/api/products`).then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load products.')
        return data.products
      }),
      fetch(`${API_URL}/api/admin/orders`).then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load orders.')
        return data.orders
      }),
    ]).then(([productRows, orderRows]) => {
      setProducts(productRows)
      setOrders(orderRows)
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [adminId])

  if (!admin) return <AdminLoginPage go={go} />

  const submit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    setSaving(true); setMessage(''); setError('')
    try {
      const response = await fetch(`${API_URL}/api/products`, { method: 'POST', body: new FormData(form) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not add product.')
      setProducts((current) => [data.product, ...current])
      setMessage(data.message)
      form.reset()
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }

  const completeOrder = async (orderId) => {
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/complete`, { method: 'PATCH' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not complete order.')
      setOrders((current) => current.map((order) => String(order.id) === String(orderId) ? data.order : order))
    } catch (requestError) { setError(requestError.message) }
  }

  const logout = () => { localStorage.removeItem('vantage_admin'); go('/admin/login') }
  const itemCount = tab === 'products' ? products.length : orders.length

  return (
    <main className="admin-page">
      <header className="admin-header">
        <button className="brand" onClick={() => go('/search')}><img src={VANTAGE_LOGO} alt="Vantage Logo" /><b>Vantage Admin</b></button>
        <div className="admin-header-actions"><span>{admin.name}</span><button className="outline-btn admin-store-link" onClick={() => go('/search')}>View Store</button><button className="admin-logout" onClick={logout}><Icon>logout</Icon></button></div>
      </header>
      <div className="admin-shell">
        <section className="admin-intro"><div><span>Store management</span><h1>{tab === 'products' ? 'Products' : 'Orders'}</h1><p>{tab === 'products' ? 'Add items and manage the PostgreSQL catalog.' : 'Review customer orders and mark fulfilled deliveries as complete.'}</p></div><b>{itemCount} items</b></section>
        <nav className="admin-tabs"><button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}><Icon>inventory_2</Icon>Products</button><button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><Icon>receipt_long</Icon>Orders{orders.filter((order) => order.order_status !== 'Completed').length > 0 && <span>{orders.filter((order) => order.order_status !== 'Completed').length}</span>}</button></nav>
        {error && <p className="form-message error admin-global-message">{error}</p>}
        {tab === 'products' ? <ProductManager products={products} loading={loading} saving={saving} message={message} submit={submit} /> : <section className="admin-orders-panel"><OrderManager orders={orders} loading={loading} completeOrder={completeOrder} /></section>}
      </div>
    </main>
  )
}
