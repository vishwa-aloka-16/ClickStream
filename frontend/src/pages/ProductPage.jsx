import { useEffect, useState } from 'react'
import { API_URL } from '../config/app'
import { EmptyState } from '../components/EmptyState'
import { FavoriteButton } from '../components/FavoriteButton'
import { Icon } from '../components/Icon'
import { Footer, Header } from '../components/Layout'
import { productImageUrl } from '../utils/products'
import { getCart, saveCart } from '../utils/storage'
import { trackEvent } from '../lib/tracking'

export function ProductPage({ go, productId }) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!product) return

    void trackEvent('product_view', {
      product_id: product.id,
      product_name: product.name,
      category: product.category ?? 'Bags',
      price: Number(product.price),
    })
  }, [product])

  useEffect(() => {
    fetch(`${API_URL}/api/products/${productId}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load product.')
        setProduct(data.product)
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [productId])

  const addToCart = () => {
    const cart = getCart()
    const existing = cart.find((item) => String(item.id) === String(product.id))
    if (existing) {
      existing.quantity += quantity
      existing.category = product.category ?? existing.category ?? 'Bags'
    } else {
      cart.push({ id: product.id, name: product.name, category: product.category ?? 'Bags', price: Number(product.price), image_url: product.image_url, quantity })
    }
    saveCart(cart)
    void trackEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      category: product.category ?? 'Bags',
      price: Number(product.price),
      quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <>
      <Header go={go} active="Shop" />
      <main className="v-main product-page-live page-shell">
        {loading ? <EmptyState title="Loading product…" />
          : error ? <EmptyState icon="error" title="Product unavailable" text={error} />
            : (
              <div className="live-product-detail">
                <div className="live-product-image">
                  <img src={productImageUrl(product.image_url)} alt={product.name} />
                  <FavoriteButton productId={product.id} />
                </div>
                <section className="live-product-copy">
                  <button className="back-link" onClick={() => go('/search')}><Icon>arrow_back</Icon>Back to products</button>
                  <span className="eyebrow">Vantage Collection</span>
                  <h1>{product.name}</h1>
                  <h2>${Number(product.price).toFixed(2)}</h2>
                  <p>{product.description || 'A carefully selected addition to the Vantage collection.'}</p>
                  <hr />
                  <div className="quantity-row">
                    <b>Quantity</b>
                    <div className="qty">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Icon>remove</Icon></button>
                      <span>{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)}><Icon>add</Icon></button>
                    </div>
                  </div>
                  <button className="primary-btn product-add" onClick={addToCart}><Icon>{added ? 'check' : 'shopping_bag'}</Icon>{added ? 'Added to cart' : 'Add to cart'}</button>
                  <div className="product-benefits"><span><Icon>payments</Icon>Verified dummy payment</span><span><Icon>local_shipping</Icon>Tracked delivery</span></div>
                </section>
              </div>
            )}
      </main>
      <Footer />
    </>
  )
}
