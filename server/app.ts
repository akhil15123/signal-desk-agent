import cors from 'cors'
import express from 'express'
import { buildDemoBriefing } from './lib/demo-report.js'
import { runBriefingAgent } from './lib/report-agent.js'
import { briefRequestSchema } from './lib/schemas.js'

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

  app.post('/api/brief', async (req, res) => {
    const parsed = briefRequestSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid briefing request.',
        issues: parsed.error.issues,
      })
      return
    }

    try {
      const result = await runBriefingAgent(parsed.data)
      res.json(result)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected agent failure.'

      res.status(500).json({
        error: message,
      })
    }
  })

  app.post('/api/demo', (req, res) => {
    const parsed = briefRequestSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid demo briefing request.',
        issues: parsed.error.issues,
      })
      return
    }

    res.json(buildDemoBriefing(parsed.data))
  })

  return app
}
