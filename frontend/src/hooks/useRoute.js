import { useEffect, useState } from 'react'

function currentRoute() {
  return `${window.location.pathname}${window.location.search}`
}

export function useRoute() {
  const [route, setRoute] = useState(currentRoute)

  useEffect(() => {
    const onPop = () => setRoute(currentRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = (path) => {
    window.history.pushState({}, '', path)
    setRoute(currentRoute())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return [route, go]
}
