export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token')
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    }

    if (token && token !== 'cookie-auth') {
        headers['Authorization'] = `Bearer ${token}`
    }

    const fetchOptions = {
        ...options,
        headers,
        credentials: 'include'
    }

    const startTimestamp = performance.now()
    const startTime = Date.now()

    try {
        const res = await fetch(url, fetchOptions)
        const endTimestamp = performance.now()
        const endTime = Date.now()
        const durationMs = endTimestamp - startTimestamp

        res.timing = {
            startTimestamp,
            endTimestamp,
            startTime,
            endTime,
            durationMs
        }

        return res
    } catch (error) {
        const endTimestamp = performance.now()
        const endTime = Date.now()
        const durationMs = endTimestamp - startTimestamp

        const errorWithTiming = new Error('Error communicating with server.')
        errorWithTiming.timing = {
            startTimestamp,
            endTimestamp,
            startTime,
            endTime,
            durationMs
        }
        throw errorWithTiming
    }
}

// --- Watch Party (rooms) ---
export async function createRoom(name = '') {
    const res = await apiFetch('/api/watch-party/rooms', {
        method: 'POST',
        body: JSON.stringify(name ? { name } : {})
    })
    return res
}

export async function getMyRooms() {
    const res = await apiFetch('/api/watch-party/rooms?type=my')
    return res
}

export async function joinRoomByInviteCode(inviteCode) {
    const res = await apiFetch('/api/watch-party/rooms/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: (inviteCode || '').trim() })
    })
    return res
}

export async function getRoom(roomId) {
    const res = await apiFetch(`/api/watch-party/rooms/${roomId}`)
    return res
}

export async function leaveRoom(roomId) {
    const res = await apiFetch(`/api/watch-party/rooms/${roomId}/leave`, { method: 'POST' })
    return res
}

export async function fetchTrendingVideos(latitude = null, longitude = null) {
    let url = '/api/trending'
    const params = new URLSearchParams()
    const headers = {}
    
    if (latitude != null && longitude != null) {
        params.append('latitude', latitude.toString())
        params.append('longitude', longitude.toString())
        headers['X-User-Latitude'] = latitude.toString()
        headers['X-User-Longitude'] = longitude.toString()
    }
    
    const queryString = params.toString()
    if (queryString) {
        url += `?${queryString}`
    }
    
    return apiFetch(url, { headers })
}

export async function getLatestPopularVideos() {
    const res = await apiFetch('/api/popular-videos/latest')
    
    if (!res.ok) {
        const error = new Error(`HTTP ${res.status}`)
        error.status = res.status
        error.response = res
        throw error
    }
    
    const data = await res.json().catch(() => null)
    
    if (!data || !data.items) {
        return { runAt: null, items: [] }
    }
    
    return {
        runAt: data.runAt || null,
        items: Array.isArray(data.items) ? data.items : []
    }
}

