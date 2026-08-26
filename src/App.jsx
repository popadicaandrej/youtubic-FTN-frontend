import { useState, useEffect } from 'react'
import Feed from './Feed'
import Login from './Login'
import Register from './Register'
import ProfileView from './ProfileView'
import CreatePost from './CreatePost'
import VideoDetail from './VideoDetail'
import TrendingSection from './TrendingSection'
import WatchParty from './WatchParty'
import RoomView from './RoomView'
import LoadTest from './LoadTest'
import { useAuth } from './AuthContext'
import { useWatchParty } from './WatchPartyContext'

export default function App() {
    const [page, setPage] = useState('feed')
    const [profileId, setProfileId] = useState(null)
    const [videoId, setVideoId] = useState(null)
    const [roomId, setRoomId] = useState(null)
    const { isAuthenticated, logout } = useAuth()
    const { roomId: ctxRoomId, setNavigateToVideo } = useWatchParty()

    useEffect(() => {
        setNavigateToVideo((id) => {
            setVideoId(id)
            setPage('video-detail')
        })
        return () => setNavigateToVideo(null)
    }, [setNavigateToVideo])

    const openGrafana = () => {
        const url = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3001'
        window.open(url, '_blank')
    }

    const openPrometheus = () => {
        const url = import.meta.env.VITE_PROMETHEUS_URL || 'http://localhost:9090'
        window.open(url, '_blank')
    }

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
                            <button onClick={() => setPage('watch-party')}>Watch Party</button>
                            {import.meta.env.DEV && (
                                <>
                                    <button onClick={() => setPage('load-test')}>Load Test</button>
                                    <button onClick={openGrafana}>Grafana</button>
                                    <button onClick={openPrometheus}>Prometheus</button>
                                </>
                            )}
                            <button onClick={logout}>Logout</button>
                        </>
                    )}
                </div>
            </header>

            {isAuthenticated() && (page === 'feed' || page === 'trending') && (
                <nav className="nav-bar">
                    <button
                        type="button"
                        className={`nav-bar-btn ${page === 'feed' ? 'active' : ''}`}
                        onClick={() => setPage('feed')}
                    >
                        Feed
                    </button>
                    <button
                        type="button"
                        className={`nav-bar-btn ${page === 'trending' ? 'active' : ''}`}
                        onClick={() => setPage('trending')}
                    >
                        Trending
                    </button>
                </nav>
            )}

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

            {page === 'trending' && (
                <TrendingSection
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

            {page === 'watch-party' && (
                <WatchParty
                    onEnterRoom={(id) => {
                        setRoomId(id)
                        setPage('room')
                    }}
                    onBack={() => setPage('feed')}
                />
            )}

            {page === 'room' && roomId && (
                <RoomView
                    roomId={roomId}
                    onLeave={() => {
                        setRoomId(null)
                        setPage('feed')
                    }}
                    onOpenFeed={() => setPage('feed')}
                />
            )}

            {page === 'video-detail' && (
                <VideoDetail
                    videoId={videoId}
                    onBack={ctxRoomId ? () => setPage('room') : () => setPage('feed')}
                    backLabel={ctxRoomId ? '← Nazad u sobu' : '← Back to feed'}
                />
            )}

            {page === 'load-test' && import.meta.env.DEV && <LoadTest />}
        </>
    )
}