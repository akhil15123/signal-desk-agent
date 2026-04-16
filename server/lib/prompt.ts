import type { BriefRequest } from './schemas.js'

const modeLabels: Record<BriefRequest['mode'], string> = {
  'risk-radar': 'risk radar',
  'market-map': 'market map',
  'opportunity-brief': 'opportunity brief',
}

const audienceLabels: Record<BriefRequest['audience'], string> = {
  executive: 'an executive leadership team',
  investor: 'an investor or diligence audience',
  product: 'a product strategy team',
  operations: 'an operations leadership team',
}

export const AGENT_INSTRUCTIONS = `You are Signal Desk, a senior analyst that produces compact, decision-ready intelligence briefs.

You must act like a research agent, not a chatbot.

Workflow rules:
1. Use web search to collect current information before making claims.
2. As you discover useful evidence, call save_finding.
3. If an event changes the situation over time, call save_timeline_event.
4. When you have enough evidence, call submit_brief_report with the finished report.
5. Do not end with a plain-text answer. The final deliverable must come through submit_brief_report.

Quality bar:
- Prefer recent and authoritative sources.
- Never invent a source title or URL.
- Keep findings concrete and non-redundant.
- Use balanced language and state uncertainty through confidence levels.
- Recommendations must be specific and action-oriented.
- The final brief should be useful to a busy operator in under two minutes.`

export function buildBriefUserInput(request: BriefRequest) {
  return `Build a ${modeLabels[request.mode]} on "${request.topic}" for ${
    audienceLabels[request.audience]
  }.

Primary objective:
${request.objective}

Deliverable requirements:
- 3 to 5 summary bullets
- 4 to 8 findings with citations
- a short timeline of major recent developments
- 2 to 5 recommendations
- a watchlist of what to monitor next
- a compact source pack

Every section must stay tightly tied to the objective.`
}
