import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            setUser({ token })
        }
        setLoading(false)
    }, [])

    const login = (token) => {
        localStorage.setItem('token', token)
        setUser({ token })
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    const isAuthenticated = () => {
        return user !== null && localStorage.getItem('token') !== null
    }

    const getToken = () => {
        return localStorage.getItem('token')
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, getToken, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

