import { API_URL } from '../config/app'

export function productImageUrl(value) {
  return /^https?:\/\//i.test(value || '') ? value : `${API_URL}${value || ''}`
}
