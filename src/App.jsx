import { useState } from 'react'
import Feed from './Feed'
import Login from './Login'
import Register from './Register'
import ProfileView from './ProfileView'

export default function App() {
    const [page, setPage] = useState('feed')
    const [profileId, setProfileId] = useState(null)

    return (
        <>
            <header className="topbar">
                <h2 className="logo">Youtubic</h2>
                <div>
                    <button onClick={() => setPage('login')}>Prijava</button>
                    <button onClick={() => setPage('register')}>Registracija</button>
                </div>
            </header>

            {page === 'feed' && (
                <Feed onOpenProfile={(id) => {
                    setProfileId(id)
                    setPage('profile')
                }} />
            )}

            {page === 'login' && <Login />}
            {page === 'register' && <Register />}
            {page === 'profile' && <ProfileView userId={profileId} />}
        </>
    )
}