import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'

describe('createApp', () => {
  it('returns a demo brief for valid input', async () => {
    const response = await request(createApp()).post('/api/demo').send({
      topic: 'Perplexity',
      objective: 'Summarize competitive pressure and operating risks.',
      mode: 'risk-radar',
      audience: 'executive',
    })

    expect(response.status).toBe(200)
    expect(response.body.report.headline).toContain('Perplexity')
    expect(response.body.report.findings).toHaveLength(4)
  })

  it('normalizes padded topic and objective input before building a report', async () => {
    const response = await request(createApp()).post('/api/demo').send({
      topic: '  Perplexity   AI  ',
      objective:
        '  Summarize competitive pressure.  \n\n  Focus on execution risk and enterprise motion.  ',
      mode: 'risk-radar',
      audience: 'executive',
    })

    expect(response.status).toBe(200)
    expect(response.body.report.headline).toContain('Perplexity AI')
    expect(response.body.report.summary[0]).not.toContain('  ')
  })

  it('rejects malformed requests', async () => {
    const response = await request(createApp()).post('/api/demo').send({
      topic: '',
      objective: 'too short',
      mode: 'risk-radar',
      audience: 'executive',
    })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('Invalid demo briefing request.')
  })
})
