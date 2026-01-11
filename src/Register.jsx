import { useState } from 'react'

export default function Register() {
    const [f, setF] = useState({})
    const [msg, setMsg] = useState(null)

    function change(e) {
        setF({ ...f, [e.target.name]: e.target.value })
    }

    async function submit(e) {
        e.preventDefault()

        if (f.password !== f.confirmPassword) {
            setMsg('Lozinke se ne poklapaju.')
            return
        }

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(f)
        })

        if (res.ok)
            setMsg('Registracija uspešna. Proverite email.')
        else
            setMsg('Greška pri registraciji.')
    }

    return (
        <form className="auth" onSubmit={submit}>
            <h2>Registracija</h2>

            <input name="email" placeholder="Email" required onChange={change} />
            <input name="username" placeholder="Korisničko ime" required onChange={change} />
            <input name="firstName" placeholder="Ime" required onChange={change} />
            <input name="lastName" placeholder="Prezime" required onChange={change} />
            <input name="address" placeholder="Adresa" required onChange={change} />

            <input type="password" name="password"
                   placeholder="Lozinka"
                   className="password-red"
                   required onChange={change} />

            <input type="password" name="confirmPassword"
                   placeholder="Ponovi lozinku"
                   className="password-red"
                   required onChange={change} />

            {msg && <p>{msg}</p>}
            <button>Registruj se</button>
        </form>
    )
}
