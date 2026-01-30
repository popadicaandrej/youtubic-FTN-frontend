import { useState } from 'react'

export default function Register({ onSuccess }) {
    const [f, setF] = useState({})
    const [msg, setMsg] = useState(null)
    const [errors, setErrors] = useState({})

    function change(e) {
        setF({ ...f, [e.target.name]: e.target.value })
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null })
        }
    }

    function validate() {
        const newErrors = {}

        if (!f.email) {
            newErrors.email = 'Email is required.'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
            newErrors.email = 'Email is not in valid format.'
        }

        if (!f.username || f.username.trim().length < 3) {
            newErrors.username = 'Username must be at least 3 characters long.'
        }

        if (!f.firstName || f.firstName.trim().length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters long.'
        }

        if (!f.lastName || f.lastName.trim().length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters long.'
        }

        if (!f.address || f.address.trim().length < 5) {
            newErrors.address = 'Address must be at least 5 characters long.'
        }

        if (!f.password || f.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long.'
        }

        if (f.password !== f.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    async function submit(e) {
        e.preventDefault()
        setMsg(null)

        if (!validate()) {
            setMsg('Please fix errors in the form.')
            return
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(f)
            })

            if (res.ok) {
                setMsg('Registration successful. Please check your email to activate your account.')
                setTimeout(() => {
                    if (onSuccess) onSuccess()
                }, 2000)
            } else {
                const errorData = await res.json().catch(() => ({}))
                
                const backendErrors = {}
                let generalError = null
                
                const fieldNames = ['email', 'username', 'password', 'confirmPassword', 'firstName', 'lastName', 'address']
                fieldNames.forEach(field => {
                    if (errorData[field]) {
                        backendErrors[field] = errorData[field]
                    }
                })
                
                if (Object.keys(backendErrors).length > 0) {
                    setErrors({ ...errors, ...backendErrors })
                    if (errorData.error) {
                        generalError = errorData.error
                    } else {
                        generalError = 'Please fix errors in the form.'
                    }
                } else {
                    generalError = errorData.error || errorData.message || 'Registration error.'
                }
                
                setMsg(generalError)
            }
        } catch (error) {
            setMsg('Registration error. Please try again.')
        }
    }

    return (
        <form className="auth" onSubmit={submit}>
            <h2>Register</h2>

            <input 
                name="email" 
                type="email"
                placeholder="Email" 
                required 
                value={f.email || ''}
                onChange={change} 
            />
            {errors.email && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.email}</p>}

            <input 
                name="username" 
                placeholder="Username" 
                required 
                value={f.username || ''}
                onChange={change} 
            />
            {errors.username && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.username}</p>}

            <input 
                name="firstName" 
                placeholder="First Name" 
                required 
                value={f.firstName || ''}
                onChange={change} 
            />
            {errors.firstName && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.firstName}</p>}

            <input 
                name="lastName" 
                placeholder="Last Name" 
                required 
                value={f.lastName || ''}
                onChange={change} 
            />
            {errors.lastName && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.lastName}</p>}

            <input 
                name="address" 
                placeholder="Address" 
                required 
                value={f.address || ''}
                onChange={change} 
            />
            {errors.address && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.address}</p>}

            <input 
                type="password" 
                name="password"
                placeholder="Password"
                className="password-red"
                required 
                value={f.password || ''}
                onChange={change} 
            />
            {errors.password && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.password}</p>}

            <input 
                type="password" 
                name="confirmPassword"
                placeholder="Confirm Password"
                className="password-red"
                required 
                value={f.confirmPassword || ''}
                onChange={change} 
            />
            {errors.confirmPassword && <p style={{ color: 'red', fontSize: '0.9em' }}>{errors.confirmPassword}</p>}

            {msg && <p>{msg}</p>}
            <button>Register</button>
        </form>
    )
}
