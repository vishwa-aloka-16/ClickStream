import { useEffect, useState } from 'react'
import { API_URL } from '../config/app'
import { EmptyState } from '../components/EmptyState'
import { Footer, Header } from '../components/Layout'
import { ProductCard } from '../components/ProductCard'
import { getFavoriteIds } from '../utils/storage'

export function FavoritesPage({ go }) {
  const [products, setProducts] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(getFavoriteIds)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load favorites.')
        setProducts(data.products)
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))

    const update = () => setFavoriteIds(getFavoriteIds())
    window.addEventListener('favorites-updated', update)
    return () => window.removeEventListener('favorites-updated', update)
  }, [])

  const favorites = products.filter((product) => favoriteIds.includes(String(product.id)))

  return (
    <>
      <Header go={go} />
      <main className="v-main search-page page-shell">
        <div className="results-head"><div><h1>Favorites</h1><p>{favorites.length} saved item{favorites.length === 1 ? '' : 's'}</p></div></div>
        {error ? <EmptyState icon="error" title="Could not load favorites" text={error} />
          : loading ? <EmptyState title="Loading favorites…" />
            : favorites.length === 0 ? (
              <EmptyState icon="favorite" title="No favorites yet" text="Select the heart on any product to save it here.">
                <button className="primary-btn empty-action" onClick={() => go('/search')}>Browse Products</button>
              </EmptyState>
            ) : (
              <div className="result-grid database-grid">
                {favorites.map((product) => <ProductCard key={product.id} product={product} go={go} />)}
              </div>
            )}
      </main>
      <Footer dark />
    </>
  )
}
