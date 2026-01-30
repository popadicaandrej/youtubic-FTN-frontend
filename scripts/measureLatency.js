import { writeFileSync } from 'fs'
import { join } from 'path'
import { METRICS_ENDPOINTS } from '../src/metricsConfig.js'

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080'
const DURATION_MS = 2 * 60 * 1000
const INTERVAL_MS = 15 * 1000

async function measureLatency(endpoint) {
  const url = BASE_URL + endpoint.url
  const start = performance.now()
  try {
    const res = await fetch(url, { method: endpoint.method })
    await res.text()
  } catch (err) {
    return { name: endpoint.name, ms: null, error: err.message }
  }
  const ms = Math.round(performance.now() - start)
  return { name: endpoint.name, ms }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
  const results = []
  const endAt = Date.now() + DURATION_MS
  while (Date.now() < endAt) {
    const timestamp = new Date().toISOString()
    for (const ep of METRICS_ENDPOINTS) {
      const result = await measureLatency(ep)
      results.push({
        timestamp,
        endpoint: result.name,
        ms: result.ms,
        error: result.error || null
      })
    }
    if (Date.now() + INTERVAL_MS <= endAt) {
      await sleep(INTERVAL_MS)
    }
  }
  const outPath = join(process.cwd(), 'public', 'metrics-results.json')
  writeFileSync(outPath, JSON.stringify(results, null, 2))
}

run()
