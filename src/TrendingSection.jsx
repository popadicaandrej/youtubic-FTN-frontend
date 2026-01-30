import { useEffect, useState } from 'react'
import { fetchTrendingVideos } from './api'

export default function TrendingSection({ onOpenVideo }) {
    const [trendingVideos, setTrendingVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [userLocation, setUserLocation] = useState(null)
    const [userLocationString, setUserLocationString] = useState(null)
    const [locationLoading, setLocationLoading] = useState(false)
    const [locationError, setLocationError] = useState(null)

    async function reverseGeocode(lat, lon) {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'YoutubicApp/1.0' } }
        )
        if (!res.ok) return null
        const data = await res.json()
        const addr = data?.address
        if (!addr) return null
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.state || addr.county
        const country = addr.country
        if (city && country) return `${city}, ${country}`
        if (country) return country
        return data?.display_name || null
    }

    const REFUSED_KEY = 'trending_location_refused'

    function requestLocation() {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported.')
            return
        }
        if (sessionStorage.getItem(REFUSED_KEY)) {
            setLocationError('Location was declined. Trending is shown by approximate location.')
            return
        }
        setLocationLoading(true)
        setLocationError(null)
        setUserLocationString(null)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lon = position.coords.longitude
                setUserLocation({ lat, lon })
                setLocationError(null)
                sessionStorage.removeItem(REFUSED_KEY)
                setLocationLoading(false)
                reverseGeocode(lat, lon).then(str => {
                    if (str) {
                        setUserLocationString(str)
                    }
                }).catch(() => {})
            },
            (err) => {
                setUserLocation(null)
                setLocationLoading(false)
                if (err.code === 1) {
                    sessionStorage.setItem(REFUSED_KEY, '1')
                    setLocationError(null)
                } else if (err.code === 2) {
                    setLocationError('Location is unavailable.')
                } else if (err.code === 3) {
                    setLocationError('Request timed out.')
                } else {
                    setLocationError('Error getting location.')
                }
            },
            { timeout: 10000, maximumAge: 300000 }
        )
    }

    async function loadTrendingVideos() {
        try {
            setLoading(true)
            setError(null)
            const latitude = userLocation?.lat ?? null
            const longitude = userLocation?.lon ?? null
            const res = await fetchTrendingVideos(latitude, longitude)
            if (!res.ok) {
                throw new Error('Error loading trending videos.')
            }
            const data = await res.json()
            setTrendingVideos(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err.message || 'Error loading trending videos.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTrendingVideos()
    }, [userLocation])

    if (loading) {
        return (
            <section className="trending-section">
                <h2 className="trending-title">🔥 Trending Now</h2>
                <p>Loading trending videos...</p>
            </section>
        )
    }

    if (error) {
        return (
            <section className="trending-section">
                <h2 className="trending-title">🔥 Trending Now</h2>
                <p style={{ color: 'red' }}>{error}</p>
            </section>
        )
    }

    return (
        <section className="trending-section">
            <div style={{ marginBottom: '6px' }}>
                <h2 className="trending-title">🔥 Trending Now</h2>
                <button
                    type="button"
                    className="trending-location-btn"
                    onClick={requestLocation}
                    disabled={locationLoading}
                >
                    {locationLoading ? 'Getting location...' : 'Trending near me'}
                </button>
            </div>
            {locationError && (
                <p style={{ fontSize: '0.8em', marginTop: '2px' }}>
                    <span style={{ color: locationError.includes('declined') ? '#888' : 'red' }}>{locationError}</span>
                    {locationError.includes('declined') && (
                        <button
                            type="button"
                            style={{ marginLeft: '8px', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline', color: 'inherit', padding: 0 }}
                            onClick={() => {
                                sessionStorage.removeItem(REFUSED_KEY)
                                setLocationError(null)
                                requestLocation()
                            }}
                        >
                            Try again
                        </button>
                    )}
                </p>
            )}
            <p style={{ fontSize: '0.78em', color: '#888', marginTop: '2px', marginBottom: '6px' }}>
                {userLocationString
                    ? `Your location: ${userLocationString}`
                    : 'Trending by approximate location (IP)'}
            </p>
            {trendingVideos.length === 0 ? (
                <p style={{ fontSize: '0.8em', color: '#888' }}>No trending videos.</p>
            ) : (
            <div className="trending-grid">
                {trendingVideos.map((video) => (
                    <div 
                        key={video.id} 
                        className="trending-video-card"
                        onClick={() => {
                            if (onOpenVideo) {
                                onOpenVideo(video.id)
                            }
                        }}
                    >
                        <div className="trending-thumbnail-container">
                            <img 
                                src={`/api/files/thumbnails/${video.id}`}
                                alt={video.title}
                                className="trending-thumbnail"
                            />
                            <div className="trending-play-overlay">▶</div>
                            {video.popularityScore !== null && video.popularityScore !== undefined && (
                                <div className="trending-score-badge">
                                    {video.popularityScore.toFixed(1)}
                                </div>
                            )}
                        </div>
                        <div className="trending-video-info">
                            <h3 className="trending-video-title">{video.title}</h3>
                            <div className="trending-video-stats">
                                <span>👁️ {video.viewsCount?.toLocaleString() || 0}</span>
                                <span>👍 {video.likesCount || 0}</span>
                                <span>💬 {video.commentsCount || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            )}
        </section>
    )
}

