import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app.js'

describe('createApp', () => {
  const originalApiKey = process.env.OPENAI_API_KEY

  beforeEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey
  })

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey
  })

  it('returns a demo brief for valid input', async () => {
    const response = await request(createApp()).post('/api/demo').send({
      topic: 'Perplexity',
      objective: 'Summarize competitive pressure and operating risks.',
      mode: 'risk-radar',
      audience: 'executive',
    })

    expect(response.status).toBe(200)
    expect(response.headers['x-request-id']).toBeTruthy()
    expect(response.body.requestId).toBe(response.headers['x-request-id'])
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
    expect(response.body.requestId).toBe(response.headers['x-request-id'])
  })

  it('returns 400 for malformed JSON payloads', async () => {
    const response = await request(createApp())
      .post('/api/demo')
      .set('Content-Type', 'application/json')
      .send('{"topic": ')

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('Invalid JSON payload.')
    expect(response.body.requestId).toBe(response.headers['x-request-id'])
  })

  it('returns a request id from the health endpoint', async () => {
    const response = await request(createApp()).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.requestId).toBe(response.headers['x-request-id'])
  })

  it('returns a clear error when the live route has no API key configured', async () => {
    delete process.env.OPENAI_API_KEY

    const response = await request(createApp()).post('/api/brief').send({
      topic: 'Anthropic',
      objective:
        'Assess competitive pressure, enterprise momentum, and the most important near-term risks.',
      mode: 'risk-radar',
      audience: 'executive',
    })

    expect(response.status).toBe(500)
    expect(response.body.error).toContain('OPENAI_API_KEY is missing')
    expect(response.body.requestId).toBe(response.headers['x-request-id'])
  })
})
