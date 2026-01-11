import { useState } from 'react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [msg, setMsg] = useState(null)

    async function login(e) {
        e.preventDefault()
        setMsg(null)

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })

        if (res.status === 403) {
            setMsg('Nalog nije aktiviran ili previše pokušaja prijave.')
        } else if (!res.ok) {
            setMsg('Pogrešni kredencijali.')
        } else {
            setMsg('Uspešna prijava.')
        }
    }

    return (
        <form className="auth" onSubmit={login}>
            <h2>Prijava</h2>

            <input type="email" placeholder="Email" required
                   onChange={e => setEmail(e.target.value)} />

            <input type="password" placeholder="Lozinka"
                   className="password-red"
                   required onChange={e => setPassword(e.target.value)} />

            {msg && <p>{msg}</p>}
            <button>Prijavi se</button>
        </form>
    )
}
