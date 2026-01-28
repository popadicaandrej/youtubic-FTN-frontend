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

export async function fetchTrendingVideos(location = null) {
    let url = '/api/trending'
    if (location) {
        url += `?location=${encodeURIComponent(location)}`
    }
    return apiFetch(url)
}

