import { useEffect, useState } from 'react'
import { API_URL } from '../config/app'
import { EmptyState } from '../components/EmptyState'
import { Footer, Header } from '../components/Layout'
import { Icon } from '../components/Icon'
import { ProductCard } from '../components/ProductCard'
import { trackEvent } from '../lib/tracking'

export function StorefrontPage({ go, query = '' }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load products.')
        setProducts(data.products)
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void trackEvent(query ? 'search' : 'page_view', query ? { search_term: query } : {})
  }, [query])

  const normalizedQuery = query.trim().toLowerCase()
  const visibleProducts = products.filter((product) =>
    !normalizedQuery ||
    product.name.toLowerCase().includes(normalizedQuery) ||
    product.description.toLowerCase().includes(normalizedQuery),
  )

  return (
    <>
      <Header go={go} active="Shop" />
      <main className="v-main search-page page-shell">
        <div className="results-head">
          <div>
            <h1>{query ? `Search results for “${query}”` : 'Products'}</h1>
            <p>{loading ? 'Loading products…' : `${visibleProducts.length} matching item${visibleProducts.length === 1 ? '' : 's'}`}</p>
          </div>
          {query && <button className="clear-search" onClick={() => go('/search')}><Icon>close</Icon>Clear search</button>}
        </div>
        {error ? <EmptyState icon="error" title="Could not load products" text={error} />
          : loading ? <EmptyState title="Loading products…" />
            : visibleProducts.length === 0 ? (
              <EmptyState icon="search_off" title="No products found" text={`No products match “${query}”. Try another search.`}>
                <button className="primary-btn empty-action" onClick={() => go('/search')}>View All Products</button>
              </EmptyState>
            ) : (
              <div className="result-grid database-grid">
                {visibleProducts.map((product) => <ProductCard key={product.id} product={product} go={go} />)}
              </div>
            )}
      </main>
      <Footer dark />
    </>
  )
}
