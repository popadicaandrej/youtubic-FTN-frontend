import { createContext, useContext, useState, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import { useAuth } from './AuthContext'

const WatchPartyContext = createContext(null)

// WebSocket mora ići na BACKEND (npr. ws://localhost:8080/ws), ne na frontend (window.location.host = 5173).
function getWsUrl(token) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    let wsBase
    if (import.meta.env.VITE_WS_URL) {
        wsBase = String(import.meta.env.VITE_WS_URL).replace(/\/$/, '')
    } else if (import.meta.env.VITE_API_URL) {
        const api = String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
        wsBase = api.replace(/^http/, 'ws') + '/ws'
    } else if (import.meta.env.DEV) {
        wsBase = 'ws://localhost:8080/ws'
    } else {
        wsBase = `${protocol}//${window.location.host}/ws`
    }
    const sep = wsBase.includes('?') ? '&' : '?'
    return `${wsBase}${sep}token=${encodeURIComponent(token || '')}`
}

export function WatchPartyProvider({ children }) {
    const { getToken } = useAuth()
    const [roomId, setRoomId] = useState(null)
    const [room, setRoom] = useState(null)
    const [isCreator, setIsCreator] = useState(false)
    const [wsConnected, setWsConnected] = useState(false)
    const [wsError, setWsError] = useState(null)
    const clientRef = useRef(null)
    const subscriptionRef = useRef(null)
    const controlSubscriptionRef = useRef(null)
    const navigateToVideoRef = useRef(null)
    const videoControlCallback = useRef(null)

    const setNavigateToVideo = useCallback((cb) => {
        navigateToVideoRef.current = cb
    }, [])

    const setVideoControlCallback = useCallback((cb) => {
        videoControlCallback.current = cb
    }, [])

    const leaveRoom = useCallback(() => {
        if (subscriptionRef.current) {
            try {
                subscriptionRef.current.unsubscribe()
            } catch (_) {}
            subscriptionRef.current = null
        }
        if (controlSubscriptionRef.current) {
            try {
                controlSubscriptionRef.current.unsubscribe()
            } catch (_) {}
            controlSubscriptionRef.current = null
        }
        if (clientRef.current) {
            try {
                clientRef.current.deactivate()
            } catch (_) {}
            clientRef.current = null
        }
        setRoomId(null)
        setRoom(null)
        setIsCreator(false)
        setWsConnected(false)
        setWsError(null)
    }, [])

    const connectToRoom = useCallback((roomIdToJoin, creator = false) => {
        const token = getToken()
        if (!token || token === 'cookie-auth') {
            setWsError('Not authenticated.')
            return Promise.reject(new Error('Not authenticated'))
        }

        leaveRoom()
        setRoomId(roomIdToJoin)
        setIsCreator(creator)

        const wsUrl = getWsUrl(token)
        console.log('[WS] 🔗 Connecting to:', wsUrl)
        console.log('[WS] 🏠 Room ID:', roomIdToJoin)
        console.log('[WS] 👤 Is creator:', creator)

        const client = new Client({
            brokerURL: wsUrl,
            reconnectDelay: 3000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('[WS] ✅ Connected to WebSocket')
                console.log('[WS] 📡 Subscribing to /topic/room/' + roomIdToJoin)
                setWsConnected(true)
                setWsError(null)
                const topic = `/topic/room/${roomIdToJoin}`
                const sub = client.subscribe(topic, (message) => {
                    console.log('[WS] 📬 MESSAGE RECEIVED:', message.body)
                    try {
                        const body = JSON.parse(message.body)
                        console.log('[WS] 📦 Parsed body:', body)
                        if (body.postId != null) {
                            console.log('[WS] 🎬 PostId detected:', body.postId)
                            console.log('[WS] 🔗 navigateToVideoRef.current:', navigateToVideoRef.current)
                            if (navigateToVideoRef.current) {
                                console.log('[WS] ✅ CALLING navigateToVideo with postId:', body.postId)
                                navigateToVideoRef.current(body.postId)
                            } else {
                                console.error('[WS] ❌ navigateToVideoRef.current is NULL!')
                            }
                        } else {
                            console.warn('[WS] ⚠️ No postId in message')
                        }
                    } catch (e) {
                        console.error('[WS] ❌ Parse error:', e)
                    }
                })
                subscriptionRef.current = sub

                // Kontrolna subscription - OBAVEZNO
                console.log('[WS] 📡 Subscribing to /topic/room/' + roomIdToJoin + '/control')
                const controlSubscription = client.subscribe(`/topic/room/${roomIdToJoin}/control`, (message) => {
                    console.log('[WS] 🎮 Control message received:', message.body)
                    try {
                        const data = JSON.parse(message.body)
                        console.log('[WS] 🎮 Parsed control:', data)
                        if (videoControlCallback.current) {
                            console.log('[WS] 🎮 Calling videoControlCallback')
                            videoControlCallback.current(data)
                        } else {
                            console.warn('[WS] ⚠️ videoControlCallback is null')
                        }
                    } catch (e) {
                        console.error('[WS] ❌ Control parse error:', e)
                    }
                })
                controlSubscriptionRef.current = controlSubscription
            },
            onStompError: (frame) => {
                setWsError(frame.headers?.message || 'WebSocket error')
            },
            onWebSocketClose: () => {
                setWsConnected(false)
            }
        })
        client.activate()
        clientRef.current = client
        return Promise.resolve()
    }, [getToken, leaveRoom])

    const sendPlayVideo = useCallback((postId) => {
        if (!roomId || !clientRef.current?.connected) return
        const dest = `/app/room/${roomId}/play-video`
        const body = { postId: Number(postId) }
        if (import.meta.env.DEV) {
            console.log('[Watch Party] Kreator šalje poruku – destination:', dest, ', postId:', body.postId)
        }
        clientRef.current.publish({
            destination: dest,
            body: JSON.stringify(body)
        })
    }, [roomId])

    const sendVideoControl = useCallback((action, data = {}) => {
        if (!roomId || !clientRef.current?.connected) {
            console.log('[WS] ❌ Cannot send control - not connected')
            return
        }
        console.log('[WS] 📤 Sending video control:', action, data)
        clientRef.current.publish({
            destination: `/app/room/${roomId}/video-control`,
            body: JSON.stringify({ action, ...data })
        })
    }, [roomId])

    const value = {
        roomId,
        room,
        setRoom,
        isCreator,
        wsConnected,
        wsError,
        connectToRoom,
        leaveRoom,
        sendPlayVideo,
        sendVideoControl,
        setNavigateToVideo,
        setVideoControlCallback
    }

    return (
        <WatchPartyContext.Provider value={value}>
            {children}
        </WatchPartyContext.Provider>
    )
}

export function useWatchParty() {
    const ctx = useContext(WatchPartyContext)
    if (!ctx) throw new Error('useWatchParty must be used within WatchPartyProvider')
    return ctx
}
