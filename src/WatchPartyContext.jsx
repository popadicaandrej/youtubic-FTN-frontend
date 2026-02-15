import { createContext, useContext, useState, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import { useAuth } from './AuthContext'

const WatchPartyContext = createContext(null)

// WebSocket: konekcija na /ws sa JWT (?token=...) – bez validnog tokena backend ne postavlja userId.
// Pretplata: tačno /topic/room/{roomId} (isti roomId kao soba).
// Kada kreator pošalje na /app/room/{roomId}/play-video sa { postId }, backend emituje na /topic/room/{roomId}
// poruku sa postId; ovde primamo body.postId i pozivamo navigateToVideo(body.postId).
function getWsUrl(token) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws?token=${encodeURIComponent(token || '')}`
}

export function WatchPartyProvider({ children }) {
    const { getToken } = useAuth()
    const [roomId, setRoomId] = useState(null)
    const [room, setRoom] = useState(null)
    const [isCreator, setIsCreator] = useState(false)
    const [wsConnected, setWsConnected] = useState(false)
    const [wsError, setWsError] = useState(null)
    const clientRef = useRef(null)
    const navigateToVideoRef = useRef(null)

    const setNavigateToVideo = useCallback((cb) => {
        navigateToVideoRef.current = cb
    }, [])

    const leaveRoom = useCallback(() => {
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

        const client = new Client({
            brokerURL: getWsUrl(token),
            reconnectDelay: 3000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                setWsConnected(true)
                setWsError(null)
                client.subscribe(`/topic/room/${roomIdToJoin}`, (message) => {
                    try {
                        const body = JSON.parse(message.body)
                        if (import.meta.env.DEV && body.postId != null) {
                            console.log('[Watch Party] Poruka sa /topic/room/' + roomIdToJoin + ', postId:', body.postId)
                        }
                        if (body.postId != null && navigateToVideoRef.current) {
                            navigateToVideoRef.current(body.postId)
                        }
                    } catch (_) {}
                })
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
        clientRef.current.publish({
            destination: `/app/room/${roomId}/play-video`,
            body: JSON.stringify({ postId: Number(postId) })
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
        setNavigateToVideo
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
