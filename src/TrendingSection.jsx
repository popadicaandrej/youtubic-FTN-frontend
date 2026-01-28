import { useEffect, useState } from 'react'
import { fetchTrendingVideos } from './api'

export default function TrendingSection({ onOpenVideo }) {
    const [trendingVideos, setTrendingVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function loadTrendingVideos() {
            try {
                setLoading(true)
                setError(null)
                
                const res = await fetchTrendingVideos()
                
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

        loadTrendingVideos()
    }, [])

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

    if (trendingVideos.length === 0) {
        return null
    }

    return (
        <section className="trending-section">
            <h2 className="trending-title">🔥 Trending Now</h2>
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
        </section>
    )
}

