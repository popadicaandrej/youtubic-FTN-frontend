import { useEffect, useState, useCallback } from 'react'
import { getLatestPopularVideos } from './api'
import { useAuth } from './AuthContext'

export default function PopularSection({ onOpenVideo }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { logout } = useAuth()

    const fetchPopularVideos = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const result = await getLatestPopularVideos()
            setData(result)
        } catch (err) {
            if (err.status === 401) {
                localStorage.removeItem('token')
                logout()
                return
            }
            
            setError('server')
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [logout])

    useEffect(() => {
        fetchPopularVideos()
    }, [fetchPopularVideos])

    function formatRunAt(runAt) {
        if (!runAt) return null
        const date = new Date(runAt)
        return new Intl.DateTimeFormat('sr-RS', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    if (loading) {
        return (
            <section className="popular-section">
                <h2 className="popular-title">Popularno</h2>
                <p>Učitavanje...</p>
            </section>
        )
    }

    if (error === 'server') {
        return (
            <section className="popular-section">
                <h2 className="popular-title">Popularno</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '0.9em', color: '#888', margin: 0 }}>Popularno trenutno nije dostupno</p>
                    <button
                        type="button"
                        onClick={fetchPopularVideos}
                        style={{
                            padding: '6px 12px',
                            fontSize: '0.85em',
                            background: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            color: '#eee',
                            cursor: 'pointer',
                            transition: 'background 0.2s, border-color 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = '#333'
                            e.target.style.borderColor = '#555'
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = '#2a2a2a'
                            e.target.style.borderColor = '#444'
                        }}
                    >
                        Pokušaj ponovo
                    </button>
                </div>
            </section>
        )
    }

    if (!data || !data.items || data.items.length === 0) {
        return (
            <section className="popular-section">
                <h2 className="popular-title">Popularno</h2>
                {data?.runAt ? (
                    <p style={{ fontSize: '0.75em', color: '#888', marginTop: '4px', marginBottom: '8px' }}>
                        Poslednje ažuriranje: {formatRunAt(data.runAt)}
                    </p>
                ) : (
                    <p style={{ fontSize: '0.75em', color: '#888', marginTop: '4px', marginBottom: '8px' }}>
                        Nije još generisano
                    </p>
                )}
                <p style={{ fontSize: '0.9em', color: '#888' }}>Još uvek nema popularnih videa</p>
            </section>
        )
    }

    return (
        <section className="popular-section">
            <h2 className="popular-title">Popularno</h2>
            {data.runAt ? (
                <p style={{ fontSize: '0.75em', color: '#888', marginTop: '4px', marginBottom: '12px' }}>
                    Poslednje ažuriranje: {formatRunAt(data.runAt)}
                </p>
            ) : (
                <p style={{ fontSize: '0.75em', color: '#888', marginTop: '4px', marginBottom: '12px' }}>
                    Nije još generisano
                </p>
            )}
            <div className="popular-grid">
                {data.items.map((item) => (
                    <div
                        key={item.videoId}
                        className="popular-video-card"
                        onClick={() => {
                            if (onOpenVideo) {
                                onOpenVideo(item.videoId)
                            }
                        }}
                    >
                        <div className="popular-thumbnail-container">
                            <img
                                src={`/api/files/thumbnails/${item.videoId}?v=${item.videoId}`}
                                alt={item.title}
                                className="popular-thumbnail"
                                key={`popular-thumbnail-${item.videoId}`}
                            />
                            <div className="popular-play-overlay">▶</div>
                            {item.score !== null && item.score !== undefined && (
                                <div className="popular-score-badge">
                                    {typeof item.score === 'number' ? item.score.toFixed(1) : item.score}
                                </div>
                            )}
                        </div>
                        <div className="popular-video-info">
                            <h3 className="popular-video-title">{item.title}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

