import { productImageUrl } from '../utils/products'
import { FavoriteButton } from './FavoriteButton'

export function ProductCard({ product, go }) {
  return (
    <article className="result-card" onClick={() => go(`/product/${product.id}`)}>
      <div>
        <img src={productImageUrl(product.image_url)} alt={product.name} />
        <FavoriteButton productId={product.id} />
      </div>
      <section>
        <h3>{product.name}</h3>
        {product.description && <p className="product-description">{product.description}</p>}
        <h2>${Number(product.price).toFixed(2)}</h2>
      </section>
    </article>
  )
}
