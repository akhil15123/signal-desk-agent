import type {
  BriefAudience,
  BriefMode,
} from '../../shared/briefing.ts'

export type { BriefAudience, BriefMode }

export type BriefRequest = {
  topic: string
  objective: string
  mode: BriefMode
  audience: BriefAudience
}

export type BriefFinding = {
  title: string
  category: string
  signal: string
  whyItMatters: string
  confidence: 'high' | 'medium' | 'low'
  sourceTitle: string
  sourceUrl: string
}

export type BriefTimelineEvent = {
  date: string
  event: string
  relevance: string
}

export type BriefRecommendation = {
  action: string
  owner: string
  expectedImpact: string
}

export type BriefSource = {
  title: string
  url: string
  note: string
}

export type BriefReport = {
  headline: string
  positioning: string
  summary: string[]
  findings: BriefFinding[]
  timeline: BriefTimelineEvent[]
  recommendations: BriefRecommendation[]
  watchlist: string[]
  sourcePack: BriefSource[]
}

export type AgentTrace = {
  tool: string
  detail: string
  timestamp: string
}

export type AgentResult = {
  report: BriefReport
  trace: AgentTrace[]
  meta: {
    model: string
    searchRuns: number
    usage: {
      inputTokens: number
      outputTokens: number
      totalTokens: number
    }
  }
}
