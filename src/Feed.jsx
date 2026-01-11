import { useEffect, useState } from 'react'
import { apiFetch } from './api'

export default function Feed({ onOpenProfile }) {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchPosts() {
            try {
                setLoading(true)
                setError(null)
                const res = await apiFetch('/api/posts')
                
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
        <main className="feed">
            {posts.map(p => (
                <div className="post" key={p.id}>
                    <div className="post-header">
                        <img src="https://via.placeholder.com/40" alt="Avatar" />
                        <span
                            className="username"
                            onClick={() => onOpenProfile(p.authorId)}
                        >
                            {p.authorUsername}
                        </span>
                    </div>

                    <h3>{p.title}</h3>
                    <p>{p.content}</p>

                    <div className="actions">
                        <button onClick={needLogin}>👍 {p.likes || 0}</button>
                        <button onClick={needLogin}>💬 {p.comments || 0}</button>
                    </div>
                </div>
            ))}
        </main>
    )
}