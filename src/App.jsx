import { useEffect, useState } from 'react'

export default function App() {
  const [msg, setMsg] = useState('Loading...')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.text())
      .then(setMsg)
      .catch(() => setMsg('ERROR'))
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Frontend ↔ Backend test</h1>
      <p>/api/health says: <b>{msg}</b></p>
    </div>
  )
}
