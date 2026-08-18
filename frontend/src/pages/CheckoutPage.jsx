import { useState } from 'react'
import { API_URL } from '../config/app'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { Footer, Header } from '../components/Layout'
import { LoginRequired } from '../components/LoginRequired'
import { OrderSummary } from '../components/OrderSummary'
import { getCart, readStorage, saveCart } from '../utils/storage'
import { trackEvent } from '../lib/tracking'

export function CheckoutPage({ go }) {
  const user = readStorage('vantage_user')
  const [items] = useState(getCart)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  const submit = async (event) => {
    event.preventDefault()
    setPlacing(true)
    setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      await trackEvent('checkout_started')
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          customerName: values.customerName,
          email: values.email,
          shippingAddress: `${values.address}, ${values.city}, ${values.postalCode}`,
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not place order.')
      await Promise.all(items.flatMap((item) => {
        const productDetails = {
          product_id: item.id,
          product_name: item.name,
          category: item.category ?? 'Bags',
          price: Number(item.price) * item.quantity,
          quantity: item.quantity,
          order_id: data.order.id,
        }
        return [
          trackEvent('payment_success', productDetails),
          trackEvent('order_created', productDetails),
        ]
      }))
      saveCart([])
      setOrder(data.order)
    } catch (requestError) {
      void trackEvent('payment_failed')
      setError(requestError.message)
    } finally {
      setPlacing(false)
    }
  }

  if (!user) return <LoginRequired go={go} />
  if (order) return (
    <>
      <Header go={go} />
      <main className="v-main confirmation-page page-shell">
        <div className="payment-confirmation">
          <div className="verified-icon"><Icon>verified</Icon></div><span>Payment verified</span>
          <h1>Your order is on the way</h1>
          <p>Order #{order.id} has been confirmed. No bank portal was used for this demonstration checkout.</p>
          <div className="confirmation-details">
            <div><small>Order status</small><b>{order.order_status}</b></div>
            <div><small>Estimated delivery</small><b>{new Date(order.estimated_delivery).toLocaleDateString()}</b></div>
            <div><small>Delivering to</small><b>{order.shipping_address}</b></div>
            <div><small>Total paid</small><b>${Number(order.total).toFixed(2)}</b></div>
          </div>
          <div className="confirmation-actions"><button className="primary-btn" onClick={() => go('/orders')}>View Order Details</button><button className="outline-btn" onClick={() => go('/search')}>Continue Shopping</button></div>
        </div>
      </main>
      <Footer />
    </>
  )
  if (!items.length) return (
    <><Header go={go} /><main className="v-main cart-page page-shell"><EmptyState icon="shopping_bag" title="Your bag is empty" text="Add a product before checking out."><button className="primary-btn empty-action" onClick={() => go('/search')}>View Products</button></EmptyState></main></>
  )

  return (
    <>
      <Header go={go} />
      <main className="v-main checkout-live page-shell">
        <div className="checkout-title"><h1>Checkout</h1><span><Icon>verified_user</Icon>Demo payment</span></div>
        <div className="checkout-live-layout">
          <form className="checkout-form" onSubmit={submit}>
            <section><h2>Shipping details</h2><div className="form-grid"><label className="wide"><span>Full name</span><input name="customerName" defaultValue={user.name} required /></label><label className="wide"><span>Email</span><input type="email" name="email" defaultValue={user.email} required /></label><label className="wide"><span>Address</span><input name="address" placeholder="123 Main Street" required /></label><label><span>City</span><input name="city" placeholder="Colombo" required /></label><label><span>Postal code</span><input name="postalCode" placeholder="00100" required /></label></div></section>
            <section><h2>Payment details</h2><p className="demo-note"><Icon>info</Icon>This is a demonstration. Payment will be marked verified without contacting a bank.</p><div className="form-grid"><label className="wide"><span>Card number</span><input inputMode="numeric" placeholder="4242 4242 4242 4242" required /></label><label><span>Expiry</span><input placeholder="12/30" required /></label><label><span>CVC</span><input placeholder="123" required /></label></div></section>
            {error && <p className="form-message error">{error}</p>}
            <button className="primary-btn" disabled={placing}>{placing ? 'Verifying payment…' : <>Pay ${total.toFixed(2)} <Icon>arrow_forward</Icon></>}</button>
          </form>
          <OrderSummary items={items} total={total} />
        </div>
      </main>
      <Footer />
    </>
  )
}
