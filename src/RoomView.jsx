import { useEffect } from 'react'
import { leaveRoom as leaveRoomApi } from './api'
import { useWatchParty } from './WatchPartyContext'

export default function RoomView({ roomId, onLeave, onOpenFeed }) {
    const { room, leaveRoom, wsConnected, wsError, isCreator } = useWatchParty()

    useEffect(() => {
        return () => {
            // Optional: call backend leave on unmount (e.g. user navigates away)
        }
    }, [])

    async function handleLeave() {
        try {
            await leaveRoomApi(roomId)
        } catch (_) {}
        leaveRoom()
        onLeave()
    }

    return (
        <div className="room-view">
            <div className="room-view-header">
                <h2>Soba: {room?.name || room?.code || roomId}</h2>
                {room?.code && (
                    <p className="room-code">
                        Kod za pridruživanje: <strong>{room.code}</strong>
                    </p>
                )}
                {isCreator && (
                    <p className="room-role">Vi ste kreator – kada pustite video, svi u sobi će ga videti.</p>
                )}
            </div>

            {wsConnected && (
                <p className="room-status room-status-connected">Povezani sa sobom.</p>
            )}
            {wsError && (
                <p className="room-status room-status-error">{wsError}</p>
            )}

            <div className="room-view-actions">
                {onOpenFeed && (
                    <button type="button" onClick={onOpenFeed}>
                        Izaberi video (Feed)
                    </button>
                )}
                <button type="button" className="room-leave-btn" onClick={handleLeave}>
                    Napusti sobu
                </button>
            </div>
        </div>
    )
}
