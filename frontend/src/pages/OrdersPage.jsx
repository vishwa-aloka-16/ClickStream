import { useEffect, useState } from 'react'
import { API_URL } from '../config/app'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { Footer, Header } from '../components/Layout'
import { LoginRequired } from '../components/LoginRequired'
import { productImageUrl } from '../utils/products'
import { readStorage } from '../utils/storage'

export function OrdersPage({ go }) {
  const user = readStorage('vantage_user')
  const userId = user?.id
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetch(`${API_URL}/api/orders?userId=${userId}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load orders.')
        setOrders(data.orders)
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (!user) return <LoginRequired go={go} />

  return (
    <>
      <Header go={go} />
      <main className="v-main orders-page page-shell">
        <div className="orders-heading"><span>My account</span><h1>Order details</h1><p>Track current and previous Vantage orders.</p></div>
        {error ? <EmptyState icon="error" title="Could not load orders" text={error} />
          : loading ? <EmptyState title="Loading orders…" />
            : orders.length === 0 ? <EmptyState icon="receipt_long" title="No orders yet" text="Completed checkouts will appear here." />
              : (
                <div className="orders-list">
                  {orders.map((order) => (
                    <article className="order-history-card" key={order.id}>
                      <header><div><small>Order #{order.id}</small><h2>{order.order_status}</h2></div><span className="verified-pill"><Icon>verified</Icon>{order.payment_status}</span></header>
                      <div className="order-history-items">{order.items.map((item) => <div key={item.productId}><img src={productImageUrl(item.imageUrl)} alt={item.name} /><span><b>{item.name}</b><small>Qty {item.quantity}</small></span><strong>${(Number(item.price) * item.quantity).toFixed(2)}</strong></div>)}</div>
                      <footer><span><small>Ordered</small>{new Date(order.created_at).toLocaleDateString()}</span><span><small>Estimated delivery</small>{new Date(order.estimated_delivery).toLocaleDateString()}</span><span><small>Delivering to</small>{order.shipping_address}</span><b>${Number(order.total).toFixed(2)}</b></footer>
                    </article>
                  ))}
                </div>
              )}
      </main>
      <Footer />
    </>
  )
}
