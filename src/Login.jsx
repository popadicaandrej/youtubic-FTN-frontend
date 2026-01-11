import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function Login({ onSuccess }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [msg, setMsg] = useState(null)
    const { login } = useAuth()

    async function handleLogin(e) {
        e.preventDefault()
        setMsg(null)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            if (res.status === 403) {
                setMsg('Account not activated or too many login attempts.')
            } else if (!res.ok) {
                setMsg('Invalid credentials.')
            } else {
                const data = await res.json().catch(() => ({}))
                const token = data.token || res.headers.get('Authorization')?.replace('Bearer ', '')
                
                if (token) {
                    login(token)
                    if (onSuccess) onSuccess()
                } else {
                    login('cookie-auth')
                    if (onSuccess) onSuccess()
                }
            }
        } catch (error) {
            setMsg('Login error. Please try again.')
        }
    }

    return (
        <form className="auth" onSubmit={handleLogin}>
            <h2>Login</h2>

            <input 
                type="email" 
                placeholder="Email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)} 
            />

            <input 
                type="password" 
                placeholder="Password"
                className="password-red"
                required 
                value={password}
                onChange={e => setPassword(e.target.value)} 
            />

            {msg && <p>{msg}</p>}
            <button>Login</button>
        </form>
    )
}
