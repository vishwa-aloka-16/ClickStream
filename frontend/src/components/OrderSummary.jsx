import { productImageUrl } from '../utils/products'

export function OrderSummary({ items, total }) {
  return (
    <aside className="order-card live-order-summary">
      <h3>Order Summary</h3>
      {items.map((item) => (
        <article className="order-item" key={item.id}>
          <img src={productImageUrl(item.image_url)} alt={item.name} />
          <div><div><b>{item.name}</b><span>${(Number(item.price) * item.quantity).toFixed(2)}</span></div><p>Qty: {item.quantity}</p></div>
        </article>
      ))}
      <hr />
      <div className="order-total"><b>Total</b><span>${total.toFixed(2)}</span></div>
    </aside>
  )
}
