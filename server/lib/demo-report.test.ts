import { describe, expect, it } from 'vitest'
import { buildDemoBriefing } from './demo-report.js'

describe('buildDemoBriefing', () => {
  it('produces a structured report with required sections', () => {
    const result = buildDemoBriefing({
      topic: 'OpenAI',
      objective: 'Evaluate how the product positions an AI research brief.',
      mode: 'opportunity-brief',
      audience: 'product',
    })

    expect(result.report.headline).toContain('OpenAI')
    expect(result.report.summary).toHaveLength(3)
    expect(result.report.findings.length).toBeGreaterThanOrEqual(4)
    expect(result.report.sourcePack.length).toBeGreaterThanOrEqual(4)
    expect(result.trace.map((entry) => entry.tool)).toContain('submit_brief_report')
  })
})
