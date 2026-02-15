import { useState, useEffect, useRef } from 'react'
import { apiFetch } from './api'

export default function LoadTest() {
    const [rps, setRps] = useState(10)
    const [duration, setDuration] = useState(10)
    const [endpointTemplate, setEndpointTemplate] = useState('GET /api/posts/public')
    const [isRunning, setIsRunning] = useState(false)
    const [stats, setStats] = useState({
        total: 0,
        success: 0,
        errors: 0,
        responseTimes: []
    })

    const timersRef = useRef([])
    const startTimeRef = useRef(null)
    const stopRequestedRef = useRef(false)

    const endpointTemplates = [
        { label: 'GET /api/posts/public', value: 'GET /api/posts/public' },
        { label: 'GET /api/posts', value: 'GET /api/posts' },
        { label: 'GET /api/trending', value: 'GET /api/trending' },
        { label: 'GET /api/posts/{id}', value: 'GET /api/posts/{id}' }
    ]

    const buildUrl = (template) => {
        if (template.includes('{id}')) {
            const id = Math.floor(Math.random() * 1000) + 1
            return template.replace('{id}', id).replace('GET ', '').replace('POST ', '').replace('PUT ', '').replace('DELETE ', '')
        }
        return template.replace('GET ', '').replace('POST ', '').replace('PUT ', '').replace('DELETE ', '')
    }

    const makeRequest = async () => {
        const url = buildUrl(endpointTemplate)
        
        try {
            const res = await apiFetch(url)
            const durationMs = res.timing?.durationMs || 0
            
            setStats(prev => ({
                total: prev.total + 1,
                success: res.ok ? prev.success + 1 : prev.success,
                errors: res.ok ? prev.errors : prev.errors + 1,
                responseTimes: [...prev.responseTimes, durationMs]
            }))
        } catch (error) {
            const durationMs = error.timing?.durationMs || 0
            
            setStats(prev => ({
                total: prev.total + 1,
                success: prev.success,
                errors: prev.errors + 1,
                responseTimes: [...prev.responseTimes, durationMs]
            }))
        }
    }

    const startLoadTest = () => {
        if (isRunning) return

        setStats({ total: 0, success: 0, errors: 0, responseTimes: [] })
        setIsRunning(true)
        stopRequestedRef.current = false
        startTimeRef.current = Date.now()
        timersRef.current = []

        const intervalMs = 1000 / rps
        const endTime = startTimeRef.current + (duration * 1000)

        const sendBatch = () => {
            if (stopRequestedRef.current || Date.now() >= endTime) {
                setIsRunning(false)
                return
            }

            const requestsInBatch = Math.min(rps, 50)
            for (let i = 0; i < requestsInBatch; i++) {
                const delay = i * intervalMs
                const timer = setTimeout(() => {
                    if (!stopRequestedRef.current && Date.now() < endTime) {
                        makeRequest()
                    }
                }, delay)
                timersRef.current.push(timer)
            }
        }

        sendBatch()

        const intervalTimer = setInterval(() => {
            if (stopRequestedRef.current || Date.now() >= endTime) {
                clearInterval(intervalTimer)
                setIsRunning(false)
                return
            }
            sendBatch()
        }, 1000)

        timersRef.current.push(intervalTimer)

        const endTimer = setTimeout(() => {
            stopLoadTest()
        }, duration * 1000)
        timersRef.current.push(endTimer)
    }

    const stopLoadTest = () => {
        stopRequestedRef.current = true
        timersRef.current.forEach(timer => {
            clearTimeout(timer)
            clearInterval(timer)
        })
        timersRef.current = []
        setIsRunning(false)
    }

    useEffect(() => {
        return () => {
            timersRef.current.forEach(timer => clearTimeout(timer))
        }
    }, [])

    const calculatePercentile = (sorted, percentile) => {
        if (sorted.length === 0) return 0
        const index = Math.ceil((percentile / 100) * sorted.length) - 1
        return sorted[Math.max(0, index)]
    }

    const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b)
    const avgResponseTime = stats.responseTimes.length > 0
        ? (stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length).toFixed(2)
        : 0
    const p95ResponseTime = calculatePercentile(sortedTimes, 95).toFixed(2)

    if (!import.meta.env.DEV) {
        return (
            <main style={{ padding: '40px 20px', textAlign: 'center', color: '#fff' }}>
                <h2>404 - Page Not Found</h2>
            </main>
        )
    }

    return (
        <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px', color: '#fff' }}>
            <h2 style={{ marginBottom: '24px' }}>Load Test</h2>
            
            <div style={{ 
                background: '#1e1e1e', 
                padding: '24px', 
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>
                        Requests per second (1-500)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="500"
                        value={rps}
                        onChange={(e) => setRps(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                        disabled={isRunning}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            background: '#2a2a2a',
                            color: '#fff',
                            fontSize: '1em'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>
                        Duration (seconds)
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={isRunning}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            background: '#2a2a2a',
                            color: '#fff',
                            fontSize: '1em'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>
                        Endpoint Template
                    </label>
                    <select
                        value={endpointTemplate}
                        onChange={(e) => setEndpointTemplate(e.target.value)}
                        disabled={isRunning}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            background: '#2a2a2a',
                            color: '#fff',
                            fontSize: '1em',
                            cursor: isRunning ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {endpointTemplates.map(template => (
                            <option key={template.value} value={template.value}>
                                {template.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                        onClick={isRunning ? stopLoadTest : startLoadTest}
                        disabled={!isRunning && (rps < 1 || duration < 1)}
                        style={{
                            padding: '12px 24px',
                            fontSize: '1em',
                            background: isRunning ? '#dc3545' : '#646cff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isRunning || (rps >= 1 && duration >= 1) ? 'pointer' : 'not-allowed',
                            fontWeight: '500',
                            opacity: (!isRunning && (rps < 1 || duration < 1)) ? 0.6 : 1
                        }}
                    >
                        {isRunning ? 'Stop' : 'Start'}
                    </button>
                </div>
            </div>

            <div style={{ 
                background: '#1e1e1e', 
                padding: '24px', 
                borderRadius: '12px'
            }}>
                <h3 style={{ marginBottom: '16px', color: '#fff' }}>Statistics</h3>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px'
                }}>
                    <div>
                        <div style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '4px' }}>Total Requests</div>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#fff' }}>{stats.total}</div>
                    </div>
                    <div>
                        <div style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '4px' }}>Successful</div>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#4caf50' }}>{stats.success}</div>
                    </div>
                    <div>
                        <div style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '4px' }}>Errors</div>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#f44336' }}>{stats.errors}</div>
                    </div>
                    <div>
                        <div style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '4px' }}>Avg Response Time</div>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#fff' }}>
                            {avgResponseTime}ms
                        </div>
                    </div>
                    <div>
                        <div style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '4px' }}>P95 Response Time</div>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#fff' }}>
                            {p95ResponseTime}ms
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

