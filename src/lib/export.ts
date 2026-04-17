import type { AgentResult } from './types'

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8',
) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export function buildReportMarkdown(result: AgentResult) {
  const sections = [
    `# ${result.report.headline}`,
    '',
    result.report.positioning,
    '',
    `Request ID: ${result.requestId}`,
    `Model: ${result.meta.model}`,
    '',
    '## Summary',
    ...result.report.summary.map((item) => `- ${item}`),
    '',
    '## Findings',
    ...result.report.findings.flatMap((finding) => [
      `### ${finding.title}`,
      `- Category: ${finding.category}`,
      `- Confidence: ${finding.confidence}`,
      `- Signal: ${finding.signal}`,
      `- Why it matters: ${finding.whyItMatters}`,
      `- Source: [${finding.sourceTitle}](${finding.sourceUrl})`,
      '',
    ]),
    '## Timeline',
    ...result.report.timeline.map(
      (event) => `- ${event.date}: ${event.event} (${event.relevance})`,
    ),
    '',
    '## Recommendations',
    ...result.report.recommendations.map(
      (item) => `- ${item.action} (${item.owner}: ${item.expectedImpact})`,
    ),
    '',
    '## Watchlist',
    ...result.report.watchlist.map((item) => `- ${item}`),
    '',
    '## Sources',
    ...result.report.sourcePack.map(
      (source) => `- [${source.title}](${source.url}) - ${source.note}`,
    ),
  ]

  return sections.join('\n')
}
