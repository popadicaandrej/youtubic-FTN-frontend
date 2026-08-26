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
import MetricsPage from './MetricsPage'
import { useAuth } from './AuthContext'
import { useWatchParty } from './WatchPartyContext'

export default function App() {
    const [page, setPage] = useState('feed')
    const [profileId, setProfileId] = useState(null)
    const [videoId, setVideoId] = useState(null)
    const [roomId, setRoomId] = useState(null)
    const [initialJoinCode, setInitialJoinCode] = useState(null)
    const { isAuthenticated, logout } = useAuth()
    const { roomId: ctxRoomId, isCreator: ctxIsCreator, setNavigateToVideo, sendPlayVideo } = useWatchParty()

    useEffect(() => {
        setNavigateToVideo((id) => {
            console.log('[APP] 🎬 navigateToVideo called with id:', id)
            setVideoId(id)
            setPage('video-detail')
        })
        console.log('[APP] ✅ setNavigateToVideo has been set')
        return () => setNavigateToVideo(null)
    }, [setNavigateToVideo])

    useEffect(() => {
        const pathname = window.location.pathname
        const params = new URLSearchParams(window.location.search)
        const codeFromUrl = params.get('code')
        const roomFromUrl = params.get('room')

        if (pathname === '/watch-party/join' && codeFromUrl) {
            setInitialJoinCode(codeFromUrl)
            setPage(isAuthenticated() ? 'watch-party' : 'login')
            return
        }
        if (roomFromUrl && isAuthenticated()) {
            setRoomId(roomFromUrl)
            setPage('room')
        }
    }, [])

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
                                    <button onClick={() => setPage('metrics')}>Metrics</button>
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
                        if (ctxRoomId && ctxIsCreator) sendPlayVideo(id)
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

            {page === 'login' && (
                <Login
                    onSuccess={() => setPage(initialJoinCode ? 'watch-party' : 'feed')}
                />
            )}
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
                    initialJoinCode={initialJoinCode}
                    onEnterRoom={(id) => {
                        setRoomId(id)
                        setInitialJoinCode(null)
                        setPage('room')
                    }}
                    onBack={() => {
                        setInitialJoinCode(null)
                        setPage('feed')
                    }}
                />
            )}

            {page === 'room' && (
                roomId ? (
                    <RoomView
                        roomId={roomId}
                        onLeave={() => {
                            setRoomId(null)
                            setPage('feed')
                        }}
                        onOpenFeed={() => setPage('feed')}
                    />
                ) : (
                    <div className="watch-party" style={{ padding: '1rem' }}>
                        <p>Soba nije pronađena ili link nije ispravan.</p>
                        <button type="button" onClick={() => setPage('watch-party')}>
                            Nazad na Watch Party
                        </button>
                    </div>
                )
            )}

            {page === 'video-detail' && (
                <VideoDetail
                    videoId={videoId}
                    onBack={ctxRoomId ? () => setPage('room') : () => setPage('feed')}
                    backLabel={ctxRoomId ? '← Nazad u sobu' : '← Back to feed'}
                />
            )}

            {page === 'load-test' && import.meta.env.DEV && <LoadTest />}

            {page === 'metrics' && import.meta.env.DEV && <MetricsPage />}
        </>
    )
}