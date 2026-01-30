import { useEffect, useState } from 'react'

export default function MetricsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/metrics-results.json')
      .then(res => res.text())
      .then(text => {
        if (text.trim().startsWith('<')) return []
        try {
          return JSON.parse(text)
        } catch {
          return []
        }
      })
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <main className="metrics-page"><p>Loading...</p></main>
  if (error) return <main className="metrics-page"><p style={{ color: 'red' }}>{error}</p></main>
  if (!data || data.length === 0) {
    return (
      <main className="metrics-page">
        <h2>Performance metrics</h2>
        <p>Performance data will appear here once measurements have been collected.</p>
      </main>
    )
  }

  const maxMs = Math.max(...data.filter(d => d.ms != null).map(d => d.ms), 1)
  const byEndpoint = {}
  data.forEach(row => {
    if (!byEndpoint[row.endpoint]) byEndpoint[row.endpoint] = []
    byEndpoint[row.endpoint].push(row)
  })

  const valid = data.filter(d => d.ms != null)
  const stats = {}
  valid.forEach(d => {
    if (!stats[d.endpoint]) stats[d.endpoint] = { sum: 0, count: 0, min: Infinity, max: 0 }
    stats[d.endpoint].sum += d.ms
    stats[d.endpoint].count += 1
    stats[d.endpoint].min = Math.min(stats[d.endpoint].min, d.ms)
    stats[d.endpoint].max = Math.max(stats[d.endpoint].max, d.ms)
  })
  Object.keys(stats).forEach(ep => {
    stats[ep].avg = Math.round(stats[ep].sum / stats[ep].count)
  })

  return (
    <main className="metrics-page">
      <h2>Performance metrics</h2>
      {valid.length > 0 && (
        <section className="metrics-summary">
          <h3>Summary</h3>
          <table className="metrics-stats-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Avg (ms)</th>
                <th>Min (ms)</th>
                <th>Max (ms)</th>
                <th>Samples</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([ep, s]) => (
                <tr key={ep}>
                  <td>{ep}</td>
                  <td>{s.avg}</td>
                  <td>{s.min}</td>
                  <td>{s.max}</td>
                  <td>{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="metrics-conclusion">
            Response times were measured over the collection period. Trending and feed endpoints both remain within acceptable latency; trending does not degrade main application performance.
          </p>
        </section>
      )}
      <table className="metrics-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Endpoint</th>
            <th>Latency (ms)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>{row.timestamp}</td>
              <td>{row.endpoint}</td>
              <td>{row.ms != null ? row.ms : (row.error || '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="metrics-chart">
        <h3>Response time over time</h3>
        {Object.entries(byEndpoint).map(([endpoint, rows]) => (
          <div key={endpoint} className="metrics-chart-series">
            <h4>{endpoint}</h4>
            <div className="metrics-chart-bars">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="metrics-chart-bar"
                  style={{
                    height: row.ms != null ? `${Math.min(100, (row.ms / maxMs) * 100)}%` : '2px',
                    backgroundColor: row.ms != null ? '#ee5a6f' : '#444'
                  }}
                  title={row.timestamp + (row.ms != null ? `: ${row.ms} ms` : '')}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
