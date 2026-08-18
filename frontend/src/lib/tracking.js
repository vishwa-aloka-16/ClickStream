import { API_URL } from '../config/app'
import { readStorage } from '../utils/storage'

function getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId')

    if (!sessionId) {
        sessionId = crypto.randomUUID()
        sessionStorage.setItem('sessionId', sessionId)
    }

    return sessionId
}

export async function trackEvent(eventName, details = {}) {
    try {
        const user = readStorage('vantage_user')
        const response = await fetch(`${API_URL}/api/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: eventName,
                session_id: getSessionId(),
                user_id: user?.id ?? null,
                page_url: `${window.location.pathname}${window.location.search}`,
                ...details
            })
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
            throw new Error(data.message || `Tracking request failed with status ${response.status}.`)
        }

        return data
    } catch (error) {
        console.error('Error tracking event:', error)
        return null
    }
}
