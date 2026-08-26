import { useState, useRef, useEffect } from 'react'
import { useWatchParty } from './WatchPartyContext'

function formatSentAt(sentAt) {
    if (!sentAt) return ''
    try {
        const d = new Date(sentAt)
        return isNaN(d.getTime()) ? sentAt : d.toLocaleString()
    } catch {
        return sentAt
    }
}

export default function StreamChat() {
    const { messages, sendChatMessage, wsConnected } = useWatchParty()
    const [inputText, setInputText] = useState('')
    const messagesEndRef = useRef(null)

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight
        }
    }, [messages.length])

    function handleSubmit(e) {
        e.preventDefault()
        const trimmed = inputText.trim()
        if (!trimmed) return
        const text = trimmed.length > 500 ? trimmed.slice(0, 500) : trimmed
        sendChatMessage(text)
        setInputText('')
    }

    return (
        <div className="stream-chat">
            {!wsConnected && (
                <p className="stream-chat-disconnected">Čet nije povezan.</p>
            )}
            <div
                ref={messagesEndRef}
                className="stream-chat-messages"
                style={{ maxHeight: '200px', overflowY: 'auto' }}
            >
                {messages.map((msg, i) => (
                    <div
                        key={`${msg.userId}-${msg.sentAt}-${i}`}
                        className="stream-chat-message"
                    >
                        <span className="stream-chat-message-author">
                            {msg.username || '?'}:
                        </span>{' '}
                        <span className="stream-chat-message-text">{msg.text}</span>
                        <span className="stream-chat-message-time">
                            {formatSentAt(msg.sentAt)}
                        </span>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="stream-chat-form">
                <input
                    type="text"
                    className="stream-chat-input"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    maxLength={500}
                    placeholder="Poruka..."
                    disabled={!wsConnected}
                />
                <button
                    type="submit"
                    className="stream-chat-send"
                    disabled={!wsConnected}
                >
                    Pošalji
                </button>
            </form>
        </div>
    )
}
