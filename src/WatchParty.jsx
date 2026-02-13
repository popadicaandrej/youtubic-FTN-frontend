import { useState, useEffect } from 'react'
import {
    createRoom,
    getMyRooms,
    joinRoomByCode,
    getRoom,
    leaveRoom
} from './api'
import { useWatchParty } from './WatchPartyContext'

export default function WatchParty({ onEnterRoom, onBack }) {
    const [mode, setMode] = useState('menu') // 'menu' | 'create' | 'join' | 'list'
    const [createName, setCreateName] = useState('')
    const [joinCode, setJoinCode] = useState('')
    const [myRooms, setMyRooms] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const { connectToRoom, setRoom } = useWatchParty()

    useEffect(() => {
        if (mode === 'list') {
            setError(null)
            setLoading(true)
            getMyRooms()
                .then((res) => {
                    if (!res.ok) throw new Error('Failed to load rooms.')
                    return res.json()
                })
                .then((data) => {
                    const list = Array.isArray(data) ? data : (data?.content && Array.isArray(data.content) ? data.content : [])
                    setMyRooms(list)
                })
                .catch((e) => setError(e.message || 'Error loading rooms.'))
                .finally(() => setLoading(false))
        }
    }, [mode])

    async function handleCreateRoom(e) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const res = await createRoom(createName)
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.message || 'Failed to create room.')
            }
            const room = await res.json()
            setRoom(room)
            await connectToRoom(room.id, true)
            onEnterRoom(room.id)
        } catch (err) {
            setError(err.message || 'Error creating room.')
        } finally {
            setLoading(false)
        }
    }

    async function handleJoinByCode(e) {
        e.preventDefault()
        if (!joinCode.trim()) {
            setError('Unesite kod sobe.')
            return
        }
        setError(null)
        setLoading(true)
        try {
            const res = await joinRoomByCode(joinCode)
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.message || 'Ne možete da se pridružite sobi.')
            }
            const room = await res.json()
            setRoom(room)
            await connectToRoom(room.id, false)
            onEnterRoom(room.id)
        } catch (err) {
            setError(err.message || 'Greška pri pridruživanju.')
        } finally {
            setLoading(false)
        }
    }

    async function handleEnterRoom(roomId) {
        setError(null)
        setLoading(true)
        try {
            const res = await getRoom(roomId)
            if (!res.ok) throw new Error('Room not found.')
            const room = await res.json()
            setRoom(room)
            const isCreator = room.creatorId != null && room.isCreator === true
            await connectToRoom(roomId, isCreator)
            onEnterRoom(roomId)
        } catch (err) {
            setError(err.message || 'Error entering room.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="watch-party">
            {onBack && (
                <button type="button" className="back-button" onClick={onBack}>
                    ← Nazad
                </button>
            )}
            <h2>Watch Party</h2>

            {mode === 'menu' && (
                <div className="watch-party-menu">
                    <button type="button" onClick={() => setMode('create')}>
                        Kreiraj sobu
                    </button>
                    <button type="button" onClick={() => setMode('join')}>
                        Pridruži se (kod / link)
                    </button>
                    <button type="button" onClick={() => setMode('list')}>
                        Moje sobe
                    </button>
                </div>
            )}

            {mode === 'create' && (
                <form className="watch-party-form" onSubmit={handleCreateRoom}>
                    <input
                        type="text"
                        placeholder="Naziv sobe (opciono)"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                    />
                    <div className="watch-party-form-actions">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Kreiranje...' : 'Kreiraj sobu'}
                        </button>
                        <button type="button" onClick={() => setMode('menu')}>
                            Odustani
                        </button>
                    </div>
                </form>
            )}

            {mode === 'join' && (
                <form className="watch-party-form" onSubmit={handleJoinByCode}>
                    <input
                        type="text"
                        placeholder="Kod sobe (npr. ABC123)"
                        value={joinCode}
                        onChange={(e) => {
                            setJoinCode(e.target.value)
                            setError(null)
                        }}
                    />
                    <div className="watch-party-form-actions">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Pridruživanje...' : 'Pridruži se'}
                        </button>
                        <button type="button" onClick={() => setMode('menu')}>
                            Odustani
                        </button>
                    </div>
                </form>
            )}

            {mode === 'list' && (
                <div className="watch-party-list">
                    {loading && <p>Učitavanje soba...</p>}
                    {error && <p className="watch-party-error">{error}</p>}
                    {!loading && myRooms.length === 0 && !error && (
                        <p>Nemate soba. Kreirajte sobu ili se pridružite putem koda.</p>
                    )}
                    {!loading && myRooms.length > 0 && (
                        <ul>
                            {myRooms.map((r) => (
                                <li key={r.id}>
                                    <span>{r.name || `Soba ${r.code || r.id}`}</span>
                                    {r.code && <code>{r.code}</code>}
                                    <button
                                        type="button"
                                        onClick={() => handleEnterRoom(r.id)}
                                        disabled={loading}
                                    >
                                        Uđi
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <button type="button" onClick={() => setMode('menu')}>
                        Nazad na meni
                    </button>
                </div>
            )}

            {error && mode !== 'list' && (
                <p className="watch-party-error">{error}</p>
            )}
        </div>
    )
}
