import { useEffect, useState } from 'react'
import { getFavoriteIds, saveFavoriteIds } from '../utils/storage'
import { Icon } from './Icon'

export function FavoriteButton({ productId }) {
  const [favorite, setFavorite] = useState(() => getFavoriteIds().includes(String(productId)))

  useEffect(() => {
    const update = () => setFavorite(getFavoriteIds().includes(String(productId)))
    window.addEventListener('favorites-updated', update)
    return () => window.removeEventListener('favorites-updated', update)
  }, [productId])

  const toggle = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const id = String(productId)
    const favorites = getFavoriteIds()
    saveFavoriteIds(favorites.includes(id) ? favorites.filter((favoriteId) => favoriteId !== id) : [...favorites, id])
  }

  return (
    <button className={`favorite-button ${favorite ? 'selected' : ''}`} aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={favorite} onClick={toggle}>
      <Icon>favorite</Icon>
    </button>
  )
}
