import { useEffect } from 'react'
import { leaveRoom as leaveRoomApi, getRoom } from './api'
import { useWatchParty } from './WatchPartyContext'

function getInviteCode(room) {
    if (!room) return ''
    return (
        room.inviteCode ??
        room.code ??
        room.joinCode ??
        room.shareCode ??
        ''
    )
}

export default function RoomView({ roomId, onLeave, onOpenFeed }) {
    const { room, setRoom, leaveRoom, wsConnected, wsError, isCreator } = useWatchParty()

    useEffect(() => {
        return () => {
            // Optional: call backend leave on unmount (e.g. user navigates away)
        }
    }, [])

    useEffect(() => {
        if (!roomId || !setRoom) return
        if (getInviteCode(room)) return
        getRoom(roomId)
            .then((res) => {
                if (!res.ok) return
                return res.json()
            })
            .then((data) => {
                const r = data?.content ?? data?.data ?? data
                if (r) setRoom(r)
            })
            .catch(() => {})
    }, [roomId])

    async function handleLeave() {
        try {
            await leaveRoomApi(roomId)
        } catch (_) {}
        leaveRoom()
        onLeave()
    }

    const inviteCode = getInviteCode(room)
    const roomLink =
        typeof window !== 'undefined' && inviteCode
            ? (room?.joinLink ||
              `${window.location.origin}/watch-party/join?code=${encodeURIComponent(inviteCode)}`)
            : null

    function copyCode() {
        if (!inviteCode) return
        navigator.clipboard?.writeText(inviteCode).then(() => {})
    }

    function copyLink() {
        if (!roomLink) return
        navigator.clipboard?.writeText(roomLink).then(() => {})
    }

    return (
        <div className="room-view">
            <div className="room-view-header">
                <h2>Soba: {room?.name || room?.code || roomId || '…'}</h2>
                {inviteCode ? (
                    <p className="room-code">
                        Kod sobe: <strong>{inviteCode}</strong>
                        <button
                            type="button"
                            className="room-copy-btn"
                            onClick={copyCode}
                            title="Kopiraj kod"
                        >
                            Kopiraj kod
                        </button>
                    </p>
                ) : (
                    <p className="room-code room-code-muted">
                        Kod za pridruživanje trenutno nije dostupan.
                    </p>
                )}
                {roomLink && (
                    <p className="room-link">
                        Link za deljenje:{' '}
                        <a href={roomLink} target="_blank" rel="noopener noreferrer">
                            {roomLink}
                        </a>
                        <button
                            type="button"
                            className="room-copy-btn"
                            onClick={copyLink}
                            title="Kopiraj link"
                        >
                            Kopiraj link
                        </button>
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
                {isCreator && onOpenFeed && (
                    <button type="button" onClick={onOpenFeed}>
                        Izaberi video (Feed)
                    </button>
                )}
                {!isCreator && (
                    <p className="room-waiting-msg">Samo kreator sobe bira video. Čeka se da kreator pusti video – tada će vam se ovde automatski otvoriti isti video.</p>
                )}
                <button type="button" className="room-leave-btn" onClick={handleLeave}>
                    Napusti sobu
                </button>
            </div>
        </div>
    )
}
