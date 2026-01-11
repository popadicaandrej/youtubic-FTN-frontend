import { useState } from 'react'
import Feed from './Feed'
import Login from './Login'
import Register from './Register'
import ProfileView from './ProfileView'
import { useAuth } from './AuthContext'

export default function App() {
    const [page, setPage] = useState('feed')
    const [profileId, setProfileId] = useState(null)
    const { isAuthenticated, logout } = useAuth()

    return (
        <>
            <header className="topbar">
                <h2 className="logo" style={{ cursor: 'pointer' }} onClick={() => setPage('feed')}>Youtubic</h2>
                <div>
                    {isAuthenticated() ? (
                        <button onClick={logout}>Logout</button>
                    ) : (
                        <>
                            <button onClick={() => setPage('login')}>Login</button>
                            <button onClick={() => setPage('register')}>Register</button>
                        </>
                    )}
                </div>
            </header>

            {page === 'feed' && (
                <Feed onOpenProfile={(id) => {
                    setProfileId(id)
                    setPage('profile')
                }} />
            )}

            {page === 'login' && <Login onSuccess={() => setPage('feed')} />}
            {page === 'register' && <Register onSuccess={() => setPage('feed')} />}
            {page === 'profile' && (
                <ProfileView 
                    userId={profileId} 
                    onBack={() => setPage('feed')} 
                />
            )}
        </>
    )
}