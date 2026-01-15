import { useState } from 'react'
import Feed from './Feed'
import Login from './Login'
import Register from './Register'
import ProfileView from './ProfileView'
import CreatePost from './CreatePost'
import VideoDetail from './VideoDetail'
import { useAuth } from './AuthContext'

export default function App() {
    const [page, setPage] = useState('feed')
    const [profileId, setProfileId] = useState(null)
    const [videoId, setVideoId] = useState(null)
    const { isAuthenticated, logout } = useAuth()

    return (
        <>
            <header className="topbar">
                <div className="topbar-left">
                    <h2 className="logo" style={{ cursor: 'pointer' }} onClick={() => setPage('feed')}>Youtubic</h2>
                    {!isAuthenticated() && (
                        <>
                            <button onClick={() => setPage('login')}>Login</button>
                            <button onClick={() => setPage('register')}>Register</button>
                        </>
                    )}
                </div>
                <div className="topbar-right">
                    {isAuthenticated() && (
                        <>
                            <button onClick={() => setPage('create-post')}>Create Post</button>
                            <button onClick={logout}>Logout</button>
                        </>
                    )}
                </div>
            </header>

            {page === 'feed' && (
                <Feed 
                    onOpenProfile={(id) => {
                        setProfileId(id)
                        setPage('profile')
                    }}
                    onOpenVideo={(id) => {
                        setVideoId(id)
                        setPage('video-detail')
                    }}
                />
            )}

            {page === 'login' && <Login onSuccess={() => setPage('feed')} />}
            {page === 'register' && <Register onSuccess={() => setPage('feed')} />}
            {page === 'profile' && (
                <ProfileView 
                    userId={profileId} 
                    onBack={() => setPage('feed')} 
                />
            )}

            {page === 'create-post' && isAuthenticated() && (
                <CreatePost onSuccess={() => setPage('feed')} />
            )}

            {page === 'video-detail' && (
                <VideoDetail 
                    videoId={videoId} 
                    onBack={() => setPage('feed')} 
                />
            )}
        </>
    )
}