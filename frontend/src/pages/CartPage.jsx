import { useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { Footer, Header } from '../components/Layout'
import { productImageUrl } from '../utils/products'
import { getCart, readStorage, saveCart } from '../utils/storage'

export function CartPage({ go }) {
  const [items, setItems] = useState(getCart)
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  const updateCart = (next) => { setItems(next); saveCart(next) }
  const changeQuantity = (id, delta) => updateCart(items.map((item) => String(item.id) === String(id) ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
  const remove = (id) => updateCart(items.filter((item) => String(item.id) !== String(id)))
  const checkout = () => readStorage('vantage_user') ? go('/checkout') : go('/login')

  return (
    <>
      <Header go={go} />
      <main className="v-main cart-page page-shell">
        <div className="cart-title"><h1>Your Bag</h1><span>{items.reduce((sum, item) => sum + item.quantity, 0)} Items</span></div>
        {items.length === 0 ? (
          <EmptyState icon="shopping_bag" title="Your bag is empty" text="Choose a product to get started.">
            <button className="primary-btn empty-action" onClick={() => go('/search')}>Continue Shopping</button>
          </EmptyState>
        ) : (
          <div className="cart-layout">
            <section className="cart-content">
              <div className="cart-items">
                {items.map((item) => (
                  <article key={item.id}>
                    <img src={productImageUrl(item.image_url)} alt={item.name} />
                    <div className="cart-item-copy">
                      <div><div><h3>{item.name}</h3><p>${Number(item.price).toFixed(2)} each</p></div><h3>${(Number(item.price) * item.quantity).toFixed(2)}</h3></div>
                      <div>
                        <div className="qty"><button onClick={() => changeQuantity(item.id, -1)}><Icon>remove</Icon></button><b>{item.quantity}</b><button onClick={() => changeQuantity(item.id, 1)}><Icon>add</Icon></button></div>
                        <button className="remove" onClick={() => remove(item.id)}><Icon>delete</Icon><span>Remove</span></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <aside className="summary">
              <h2>Order Summary</h2>
              <div><span>Subtotal</span><b>${subtotal.toFixed(2)}</b></div>
              <div><span>Shipping</span><b>Free</b></div><hr />
              <div className="total"><span>Total</span><b>${subtotal.toFixed(2)}</b></div>
              <button className="primary-btn" onClick={checkout}>Proceed to Checkout <Icon>arrow_forward</Icon></button>
              <small><Icon>verified_user</Icon>Dummy payment—no bank portal</small>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
