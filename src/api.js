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

    try {
        const res = await fetch(url, fetchOptions)
        return res
    } catch (error) {
        throw new Error('Error communicating with server.')
    }
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

