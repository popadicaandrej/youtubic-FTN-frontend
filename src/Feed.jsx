import { useEffect, useState } from 'react'
import { apiFetch } from './api'

export default function Feed({ onOpenProfile }) {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [playingVideo, setPlayingVideo] = useState(null)
    const [videoAspectRatios, setVideoAspectRatios] = useState({})

    useEffect(() => {
        async function fetchPosts() {
            try {
                setLoading(true)
                setError(null)
                const res = await apiFetch('/api/posts/public')
                
                if (!res.ok) {
                    throw new Error('Error loading posts.')
                }
                
                const data = await res.json()
                const sortedPosts = Array.isArray(data) 
                    ? data.sort((a, b) => {
                        const dateA = new Date(a.createdAt || a.createdDate || a.id || 0)
                        const dateB = new Date(b.createdAt || b.createdDate || b.id || 0)
                        return dateB - dateA
                    })
                    : []
                setPosts(sortedPosts)
            } catch (err) {
                setError(err.message || 'Error loading posts.')
            } finally {
                setLoading(false)
            }
        }

        fetchPosts()
    }, [])

    function needLogin() {
        alert('You must login to use this option.')
    }

    if (loading) {
        return (
            <main className="feed">
                <p>Loading posts...</p>
            </main>
        )
    }

    if (error) {
        return (
            <main className="feed">
                <p style={{ color: 'red' }}>{error}</p>
            </main>
        )
    }

    if (posts.length === 0) {
        return (
            <main className="feed">
                <p>No posts to display.</p>
            </main>
        )
    }

    return (
        <>
            <main className="feed">
                {posts.map(p => (
                    <div className="post" key={p.id}>
                        <div className="post-header">
                            <span
                                className="username"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenProfile(p.userId)
                                }}
                            >
                                {p.username}
                            </span>
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
                                    if (playingVideo === p.id) {
                                        setPlayingVideo(null)
                                    } else {
                                        setPlayingVideo(p.id)
                                    }
                                }}
                            >
                                {playingVideo === p.id ? (
                                    <video 
                                        src={`/api/files/videos/${p.id}`}
                                        controls
                                        autoPlay
                                        onLoadedMetadata={(e) => {
                                            const video = e.target
                                            const aspectRatio = video.videoWidth / video.videoHeight
                                            setVideoAspectRatios({ ...videoAspectRatios, [p.id]: aspectRatio })
                                        }}
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '400px',
                                            width: 'auto',
                                            height: 'auto',
                                            display: 'block', 
                                            borderRadius: '6px'
                                        }}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <>
                                        <img 
                                            src={`/api/files/thumbnails/${p.id}`}
                                            alt={p.title}
                                            style={{ 
                                                maxWidth: '100%', 
                                                maxHeight: '400px',
                                                width: 'auto',
                                                height: 'auto',
                                                display: 'block', 
                                                borderRadius: '6px',
                                                objectFit: 'contain'
                                            }}
                                            onLoad={(e) => {
                                                const img = e.target
                                                const aspectRatio = img.naturalWidth / img.naturalHeight
                                                setVideoAspectRatios({ ...videoAspectRatios, [p.id]: aspectRatio })
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
                                    </>
                                )}
                            </div>
                        )}
                        <h3>{p.title}</h3>
                        <p style={{ display: 'none' }}>{p.content}</p>

                        <div 
                            className="actions"
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex', gap: '8px', fontSize: '0.85em' }}
                        >
                            <span>👍 {p.likesCount || 0}</span>
                            <span>💬 {p.commentsCount || 0}</span>
                        </div>
                    </div>
                ))}
            </main>

        </>
    )
}