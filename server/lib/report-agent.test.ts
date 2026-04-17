import { beforeEach, describe, expect, it, vi } from 'vitest'

const { responsesCreate } = vi.hoisted(() => ({
  responsesCreate: vi.fn(),
}))

vi.mock('openai', () => {
  class MockOpenAI {
    responses = {
      create: responsesCreate,
    }

    constructor(_options: unknown) {}
  }

  return {
    default: MockOpenAI,
  }
})

import { runBriefingAgent } from './report-agent.js'

describe('runBriefingAgent', () => {
  beforeEach(() => {
    responsesCreate.mockReset()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('returns a structured brief from a multi-step tool loop', async () => {
    responsesCreate
      .mockResolvedValueOnce({
        id: 'resp_1',
        output: [
          { type: 'web_search_call' },
          {
            type: 'function_call',
            name: 'save_finding',
            arguments: JSON.stringify({
              title: 'Enterprise demand keeps climbing',
              category: 'Demand',
              signal:
                'The market is showing stronger enterprise pull as buyers consolidate around fewer vendors.',
              whyItMatters:
                'Signal Desk needs to surface clear demand shifts instead of vague market chatter.',
              confidence: 'high',
              sourceTitle: 'Market note',
              sourceUrl: 'https://example.com/market-note',
            }),
            call_id: 'call_1',
          },
        ],
        usage: {
          input_tokens: 50,
          output_tokens: 120,
          total_tokens: 170,
        },
      })
      .mockResolvedValueOnce({
        id: 'resp_2',
        output: [
          {
            type: 'function_call',
            name: 'submit_brief_report',
            arguments: JSON.stringify({
              headline: 'Anthropic demand keeps rising in enterprise accounts',
              positioning:
                'Anthropic appears to be gaining commercial traction, but operator confidence still depends on execution clarity and buyer proof points.',
              summary: [
                'Enterprise AI budgets remain concentrated around a small number of vendors.',
                'Signal Desk can compress noisy category chatter into a decision-ready brief.',
                'The reporting flow stays strongest when structured citations back each finding.',
              ],
              findings: [
                {
                  title: 'Enterprise demand keeps climbing',
                  category: 'Demand',
                  signal:
                    'The market is showing stronger enterprise pull as buyers consolidate around fewer vendors.',
                  whyItMatters:
                    'Signal Desk needs to surface clear demand shifts instead of vague market chatter.',
                  confidence: 'high',
                  sourceTitle: 'Market note',
                  sourceUrl: 'https://example.com/market-note',
                },
                {
                  title: 'Buyer diligence is getting tighter',
                  category: 'Buyer behavior',
                  signal:
                    'Decision-makers increasingly want concrete adoption proof before expanding AI platform spend.',
                  whyItMatters:
                    'A sharper diligence bar changes how operators should frame near-term positioning.',
                  confidence: 'medium',
                  sourceTitle: 'Buyer note',
                  sourceUrl: 'https://example.com/buyer-note',
                },
                {
                  title: 'Category narratives are converging',
                  category: 'Narrative',
                  signal:
                    'Vendors are converging on similar product claims, making evidence quality a bigger separator.',
                  whyItMatters:
                    'Weak differentiation increases the value of operator-facing intelligence products.',
                  confidence: 'medium',
                  sourceTitle: 'Narrative note',
                  sourceUrl: 'https://example.com/narrative-note',
                },
                {
                  title: 'Execution proof is still decisive',
                  category: 'Execution',
                  signal:
                    'Operators keep prioritizing shipping velocity and deployment evidence over broad promises.',
                  whyItMatters:
                    'The final brief should help users focus on execution proof, not just category momentum.',
                  confidence: 'high',
                  sourceTitle: 'Execution note',
                  sourceUrl: 'https://example.com/execution-note',
                },
              ],
              timeline: [
                {
                  date: '2026-04-01',
                  event: 'Enterprise buyers tightened diligence requirements',
                  relevance:
                    'This raised the bar for what counts as a convincing AI platform narrative.',
                },
                {
                  date: '2026-04-10',
                  event: 'Signal Desk-style operator workflows gained more attention',
                  relevance:
                    'Structured research output is becoming easier to evaluate than long chat transcripts.',
                },
              ],
              recommendations: [
                {
                  action: 'Focus the next brief on where enterprise demand is strongest.',
                  owner: 'Research lead',
                  expectedImpact:
                    'This will keep the final brief grounded in the most decision-relevant demand signals.',
                },
                {
                  action: 'Use structured citations to separate hard evidence from narrative noise.',
                  owner: 'Operator',
                  expectedImpact:
                    'This keeps the report trustworthy when category narratives get repetitive.',
                },
              ],
              watchlist: [
                'Whether enterprise demand remains concentrated around a few vendors',
                'How fast buyer diligence standards keep rising',
              ],
              sourcePack: [
                {
                  title: 'Market note',
                  url: 'https://example.com/market-note',
                  note: 'Supports the strongest enterprise demand finding.',
                },
                {
                  title: 'Buyer note',
                  url: 'https://example.com/buyer-note',
                  note: 'Tracks tighter buying requirements.',
                },
                {
                  title: 'Narrative note',
                  url: 'https://example.com/narrative-note',
                  note: 'Shows where category stories are converging.',
                },
                {
                  title: 'Execution note',
                  url: 'https://example.com/execution-note',
                  note: 'Anchors the execution proof argument.',
                },
              ],
            }),
            call_id: 'call_2',
          },
        ],
        usage: {
          input_tokens: 90,
          output_tokens: 180,
          total_tokens: 270,
        },
      })

    const result = await runBriefingAgent({
      topic: 'Anthropic',
      objective:
        'Assess competitive pressure, enterprise momentum, and the most important near-term risks.',
      mode: 'risk-radar',
      audience: 'executive',
    })

    expect(result.report.headline).toContain('Anthropic')
    expect(result.trace.map((entry) => entry.tool)).toContain('save_finding')
    expect(result.trace.map((entry) => entry.tool)).toContain('submit_brief_report')
    expect(result.meta.searchRuns).toBe(1)
    expect(result.meta.usage.totalTokens).toBe(440)
  })
})
