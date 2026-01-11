import { useEffect, useState } from 'react'
import { apiFetch } from './api'

export default function ProfileView({ userId, onBack }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!userId) {
            setError('User not selected.')
            setLoading(false)
            return
        }

        async function fetchUser() {
            try {
                setLoading(true)
                setError(null)
                const res = await apiFetch(`/api/users/${userId}`)
                
                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error('User not found.')
                    }
                    throw new Error('Error loading profile.')
                }
                
                const data = await res.json()
                setUser(data)
            } catch (err) {
                setError(err.message || 'Error loading profile.')
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [userId])

    if (loading) {
        return (
            <div className="profile">
                <p>Loading...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="profile">
                <p style={{ color: 'red' }}>{error}</p>
                {onBack && (
                    <button onClick={onBack} style={{ marginTop: '10px' }}>
                        Back to feed
                    </button>
                )}
            </div>
        )
    }

    if (!user) {
        return (
            <div className="profile">
                <p>User not found.</p>
                {onBack && (
                    <button onClick={onBack} style={{ marginTop: '10px' }}>
                        Back to feed
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="profile">
            {onBack && (
                <button onClick={onBack} style={{ marginBottom: '20px' }}>
                    ← Back to feed
                </button>
            )}
            <h2>{user.username}</h2>
            <p>{user.firstName} {user.lastName}</p>
            {user.email && <p>Email: {user.email}</p>}
            {user.address && <p>Address: {user.address}</p>}
        </div>
    )
}