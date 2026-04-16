import cors from 'cors'
import express from 'express'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'signal-desk-agent',
      timestamp: new Date().toISOString(),
    })
  })

  return app
}
