import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { apiFetch } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const pingIntervalRef = useRef(null)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            setUser({ token })
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        if (user && localStorage.getItem('token')) {
            const startPing = () => {
                const ping = async () => {
                    try {
                        await apiFetch('/api/posts')
                    } catch (error) {
                    }
                }

                pingIntervalRef.current = setInterval(ping, 5 * 60 * 1000)
                ping()
            }

            startPing()

            return () => {
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current)
                    pingIntervalRef.current = null
                }
            }
        } else {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current)
                pingIntervalRef.current = null
            }
        }
    }, [user])

    const login = (token) => {
        localStorage.setItem('token', token)
        setUser({ token })
    }

    const logout = () => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current)
            pingIntervalRef.current = null
        }
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

