import './App.css'
import { useRoute } from './hooks/useRoute'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminPage } from './pages/AdminPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { LoginPage } from './pages/LoginPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductPage } from './pages/ProductPage'
import { StorefrontPage } from './pages/StorefrontPage'

function App() {
  const [route, go] = useRoute()
  const [pathname, queryString = ''] = route.split('?')
  const query = new URLSearchParams(queryString).get('q') || ''

  if (pathname.startsWith('/product/')) return <ProductPage go={go} productId={pathname.split('/').pop()} />
  if (pathname === '/search' || pathname === '/') return <StorefrontPage go={go} query={query} />
  if (pathname === '/cart') return <CartPage go={go} />
  if (pathname === '/favorites') return <FavoritesPage go={go} />
  if (pathname === '/checkout') return <CheckoutPage go={go} />
  if (pathname === '/orders') return <OrdersPage go={go} />
  if (pathname === '/admin') return <AdminPage go={go} />
  if (pathname === '/admin/login') return <AdminLoginPage go={go} />
  if (pathname === '/login') return <LoginPage go={go} />
  if (pathname === '/register') return <LoginPage go={go} mode="register" />

  return <StorefrontPage go={go} />
}

export default App
