import cors from 'cors'
import { randomUUID } from 'node:crypto'
import express, { type NextFunction, type Request, type Response } from 'express'
import { normalizeBriefRequestPayload } from './lib/brief-request.js'
import { buildDemoBriefing } from './lib/demo-report.js'
import { isJsonParseError } from './lib/http-errors.js'
import { runBriefingAgent } from './lib/report-agent.js'
import { briefRequestSchema } from './lib/schemas.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))
  app.use((_req, res, next) => {
    const requestId = randomUUID()
    res.locals.requestId = requestId
    res.setHeader('X-Request-Id', requestId)
    next()
  })

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      requestId: res.locals.requestId,
      service: 'signal-desk-agent',
      timestamp: new Date().toISOString(),
    })
  })

  app.post('/api/brief', async (req, res) => {
    const parsed = briefRequestSchema.safeParse(
      normalizeBriefRequestPayload(req.body),
    )

    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid briefing request.',
        issues: parsed.error.issues,
        requestId: res.locals.requestId,
      })
      return
    }

    try {
      const result = await runBriefingAgent(parsed.data)
      res.json({
        ...result,
        requestId: res.locals.requestId,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected agent failure.'

      res.status(500).json({
        error: message,
        requestId: res.locals.requestId,
      })
    }
  })

  app.post('/api/demo', (req, res) => {
    const parsed = briefRequestSchema.safeParse(
      normalizeBriefRequestPayload(req.body),
    )

    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid demo briefing request.',
        issues: parsed.error.issues,
        requestId: res.locals.requestId,
      })
      return
    }

    res.json({
      ...buildDemoBriefing(parsed.data),
      requestId: res.locals.requestId,
    })
  })

  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      if (isJsonParseError(error)) {
        res.status(400).json({
          error: 'Invalid JSON payload.',
          requestId: res.locals.requestId,
        })
        return
      }

      next(error)
    },
  )

  return app
}
