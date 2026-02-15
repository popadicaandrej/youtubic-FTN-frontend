import { useEffect, useState } from 'react'
import { apiFetch } from './api'
import { useAuth } from './AuthContext'
import PopularSection from './PopularSection'

export default function Feed({ onOpenProfile, onOpenVideo }) {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isMyVideos, setIsMyVideos] = useState(false)
    const { isAuthenticated, logout } = useAuth()

    useEffect(() => {
        async function fetchPosts() {
            try {
                setLoading(true)
                setError(null)
                const endpoint = isAuthenticated() ? '/api/posts' : '/api/posts/public'
                const res = await apiFetch(endpoint)
                
                if (!res.ok) {
                    if (res.status === 403 && isAuthenticated()) {
                        localStorage.removeItem('token')
                        logout()
                        const publicRes = await apiFetch('/api/posts/public')
                        if (publicRes.ok) {
                            const data = await publicRes.json()
                            setIsMyVideos(false)
                            const filteredPosts = Array.isArray(data) 
                                ? data.filter(post => {
                                    if (post.status === 'SCHEDULED' && post.scheduledAt) {
                                        const scheduledDate = new Date(post.scheduledAt)
                                        const now = new Date()
                                        if (scheduledDate > now) {
                                            return false
                                        }
                                    }
                                    return true
                                })
                                : []
                            const sortedPosts = filteredPosts.sort((a, b) => {
                                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                                return dateB - dateA
                            })
                            setPosts(sortedPosts)
                            return
                        }
                    }
                    throw new Error('Error loading posts.')
                }
                
                const data = await res.json()
                const isMyVideosFeed = isAuthenticated() && endpoint === '/api/posts'
                setIsMyVideos(isMyVideosFeed)
                const filteredPosts = Array.isArray(data) 
                    ? data.filter(post => {
                        if (!isMyVideosFeed && post.status === 'SCHEDULED' && post.scheduledAt) {
                            const scheduledDate = new Date(post.scheduledAt)
                            const now = new Date()
                            if (scheduledDate > now) {
                                return false
                            }
                        }
                        return true
                    })
                    : []
                const sortedPosts = filteredPosts.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                    return dateB - dateA
                })
                setPosts(sortedPosts)
            } catch (err) {
                setError(err.message || 'Error loading posts.')
            } finally {
                setLoading(false)
            }
        }

        fetchPosts()
    }, [isAuthenticated, logout])

    function needLogin() {
        alert('You must login to use this option.')
    }

    function formatScheduledDate(dateString) {
        if (!dateString) return ''
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('sr-RS', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    return (
        <>
            {isAuthenticated() && (
                <PopularSection onOpenVideo={onOpenVideo} />
            )}
            {loading && (
                <main className="feed">
                    <p>Loading posts...</p>
                </main>
            )}
            {error && (
                <main className="feed">
                    <p style={{ color: 'red' }}>{error}</p>
                </main>
            )}
            {!loading && !error && posts.length === 0 && (
                <main className="feed">
                    <p>No posts to display.</p>
                </main>
            )}
            {!loading && !error && posts.length > 0 && (
            <main className="feed">
                {posts.map(p => {
                    const isScheduled = p.status === 'SCHEDULED' && p.scheduledAt
                    const scheduledDate = isScheduled ? new Date(p.scheduledAt) : null
                    const isFutureScheduled = scheduledDate && scheduledDate > new Date()
                    
                    return (
                    <div className="post" key={p.id}>
                        <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                                className="username"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenProfile(p.userId)
                                }}
                            >
                                {p.username}
                            </span>
                            {isMyVideos && isScheduled && isFutureScheduled && (
                                <span style={{
                                    background: '#ff9800',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75em',
                                    fontWeight: 'bold'
                                }}>
                                    Zakazano
                                </span>
                            )}
                        </div>

                        {p.id && (
                            <div 
                                className="video-thumbnail"
                                style={{ 
                                    cursor: 'pointer', 
                                    position: 'relative', 
                                    marginBottom: '6px',
                                    width: '100%',
                                    maxHeight: '400px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden'
                                }}
                                onClick={() => {
                                    if (onOpenVideo) {
                                        onOpenVideo(p.id)
                                    }
                                }}
                            >
                                <img 
                                    src={`/api/files/thumbnails/${p.id}?v=${p.id}`}
                                    alt={p.title}
                                    key={`thumbnail-${p.id}`}
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '400px',
                                        width: 'auto',
                                        height: 'auto',
                                        display: 'block', 
                                        borderRadius: '6px',
                                        objectFit: 'contain'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: '36px',
                                    color: 'white',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                    pointerEvents: 'none'
                                }}>▶</div>
                            </div>
                        )}
                        <h3>{p.title}</h3>
                        <p style={{ display: 'none' }}>{p.content}</p>
                        {isMyVideos && isScheduled && isFutureScheduled && (
                            <p style={{ 
                                fontSize: '0.85em', 
                                color: '#aaa', 
                                marginTop: '4px',
                                marginBottom: '4px'
                            }}>
                                Dostupno od: {formatScheduledDate(p.scheduledAt)}
                            </p>
                        )}

                        <div 
                            className="actions"
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex', gap: '8px', fontSize: '0.85em' }}
                        >
                            <span>👍 {p.likesCount || 0}</span>
                            <span>💬 {p.commentsCount || 0}</span>
                            <span>👁️ {(() => {
                                try {
                                    const count = p.viewsCount != null ? Number(p.viewsCount) : 0
                                    return isNaN(count) || count < 0 ? 0 : count.toLocaleString()
                                } catch {
                                    return 0
                                }
                            })()}</span>
                        </div>
                    </div>
                    )
                })}
            </main>
            )}
        </>
    )
}