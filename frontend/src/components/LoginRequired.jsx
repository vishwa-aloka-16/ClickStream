import { EmptyState } from './EmptyState'
import { Header } from './Layout'

export function LoginRequired({ go }) {
  return (
    <>
      <Header go={go} />
      <main className="v-main cart-page page-shell">
        <EmptyState icon="lock" title="Sign in to continue" text="Your cart is saved. Sign in before checkout.">
          <button className="primary-btn empty-action" onClick={() => go('/login')}>Sign In</button>
        </EmptyState>
      </main>
    </>
  )
}
