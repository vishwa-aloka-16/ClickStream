export function readStorage(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback
  } catch {
    return fallback
  }
}

export function getCart() {
  return readStorage('vantage_cart', [])
}

export function getFavoriteIds() {
  return readStorage('vantage_favorites', []).map(String)
}

export function saveFavoriteIds(ids) {
  localStorage.setItem('vantage_favorites', JSON.stringify(ids))
  window.dispatchEvent(new Event('favorites-updated'))
}

export function saveCart(cart) {
  localStorage.setItem('vantage_cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
}
