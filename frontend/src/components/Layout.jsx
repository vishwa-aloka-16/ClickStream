import { useEffect, useState } from 'react'
import { VANTAGE_LOGO } from '../config/app'
import { getCart, getFavoriteIds, readStorage } from '../utils/storage'
import { Icon } from './Icon'

export function Header({ go, active = '' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(() => getCart().reduce((sum, item) => sum + item.quantity, 0))
  const [favoriteCount, setFavoriteCount] = useState(() => getFavoriteIds().length)
  const [searchText, setSearchText] = useState(() => new URLSearchParams(window.location.search).get('q') || '')
  const user = readStorage('vantage_user')

  useEffect(() => {
    const updateCount = () => setCartCount(getCart().reduce((sum, item) => sum + item.quantity, 0))
    const updateFavorites = () => setFavoriteCount(getFavoriteIds().length)
    window.addEventListener('cart-updated', updateCount)
    window.addEventListener('favorites-updated', updateFavorites)
    return () => {
      window.removeEventListener('cart-updated', updateCount)
      window.removeEventListener('favorites-updated', updateFavorites)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('vantage_user')
    setMenuOpen(false)
    go('/login')
  }

  const search = (event) => {
    event.preventDefault()
    const query = searchText.trim()
    go(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <header className="v-header">
      <div className="v-header-inner">
        <div className="brand-nav">
          <button className="brand" onClick={() => go('/search')}>
            <img src={VANTAGE_LOGO} alt="Vantage Logo" />
            <b>Vantage</b>
          </button>
          <nav>
            {['Shop', 'New Arrivals', 'Collections', 'About'].map((item) => (
              <button key={item} className={active === item ? 'active' : ''} onClick={() => go('/search')}>
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="header-actions">
          <form className="search-pill" onSubmit={search}>
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search products..." aria-label="Search products" />
            <button type="submit" aria-label="Submit search"><Icon>search</Icon></button>
          </form>
          <button className={`icon-button favorite-nav ${favoriteCount ? 'has-favorites' : ''}`} onClick={() => go('/favorites')} aria-label="Favorites">
            <Icon>favorite</Icon>{favoriteCount > 0 && <span>{favoriteCount}</span>}
          </button>
          <button className="icon-button bag-icon" onClick={() => go('/cart')} aria-label="Shopping bag">
            <Icon>shopping_bag</Icon>{cartCount > 0 && <span>{cartCount}</span>}
          </button>
          <div className="account-control">
            <button className="profile" onClick={() => user ? setMenuOpen(!menuOpen) : go('/login')} aria-label="Account"><Icon>person</Icon></button>
            {user && menuOpen && (
              <div className="account-menu">
                <div className="account-summary"><b>{user.name}</b><span>{user.email}</span></div>
                <button onClick={() => { setMenuOpen(false); go('/orders') }}><Icon>receipt_long</Icon>Order details</button>
                <button onClick={logout}><Icon>logout</Icon>Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export function Footer({ dark = false }) {
  return (
    <footer className={`footer ${dark ? 'dark' : ''}`}>
      <div className="footer-grid page-shell">
        <div className="footer-brand">
          <div className="brand"><img src={VANTAGE_LOGO} alt="Vantage Logo" /><b>Vantage</b></div>
          <p>Curated essentials for the modern lifestyle.</p>
        </div>
        <div><h4>Support</h4><a>Order Tracking</a><a>Returns</a><a>Size Guide</a></div>
        <div><h4>Company</h4><a>Our Story</a><a>Careers</a><a>Sustainability</a></div>
        <div><h4>Help</h4><a>Terms & Conditions</a><a>Privacy</a></div>
      </div>
      <div className="copyright page-shell">© 2026 Vantage Premium Commerce.</div>
    </footer>
  )
}
