import { useEffect, useState } from 'react'

export default function ProfileView({ userId }) {
    const [user, setUser] = useState(null)

    useEffect(() => {
        fetch(`/api/users/${userId}`)
            .then(r => r.json())
            .then(setUser)
    }, [userId])

    if (!user) return <p>Učitavanje...</p>

    return (
        <div className="profile">
            <h2>{user.username}</h2>
            <p>{user.firstName} {user.lastName}</p>
        </div>
    )
}