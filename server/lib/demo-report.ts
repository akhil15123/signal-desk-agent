import { reportSchema, type BriefRequest } from './schemas.js'

export function buildDemoBriefing(request: BriefRequest) {
  const now = new Date().toISOString()

  return {
    report: reportSchema.parse({
      headline: `${request.topic}: demo intelligence brief`,
      positioning: `Illustrative ${request.mode} output shaped for a ${request.audience} audience. This path is intentionally static so the interface can be explored before a live OpenAI key is added.`,
      summary: [
        `${request.topic} is presented as a fast-moving operating environment with mixed execution and narrative signals.`,
        `The demo emphasizes how Signal Desk compresses a broad objective into a compact decision brief instead of a long transcript.`,
        `Live mode replaces these sample findings with web-researched evidence, citations, and tool-captured trace events.`,
      ],
      findings: [
        {
          title: 'Narrative pressure is concentrated in execution clarity',
          category: 'Narrative',
          signal:
            'The sample brief assumes decision-makers need a tighter picture of what is changing, why it matters, and where confidence is weakest.',
          whyItMatters:
            'This is the core shape of the product: turn a vague research ask into prioritized operating signals.',
          confidence: 'medium',
          sourceTitle: 'Signal Desk demo source',
          sourceUrl: 'https://example.com/demo/narrative-pressure',
        },
        {
          title: 'Leadership audiences want compact recommendations',
          category: 'Audience',
          signal:
            'The interface is tuned around summary bullets, action items, and watchlist signals rather than open-ended chat.',
          whyItMatters:
            'This keeps the project grounded in operator workflows and makes the AI agent feel purpose-built.',
          confidence: 'high',
          sourceTitle: 'Signal Desk demo source',
          sourceUrl: 'https://example.com/demo/operator-workflow',
        },
        {
          title: 'Structured tool calls improve result quality',
          category: 'Architecture',
          signal:
            'The backend forces the model to save findings, save timeline events, and finally submit a typed report object.',
          whyItMatters:
            'A typed report is easier to test, render, and evolve than loosely formatted markdown.',
          confidence: 'high',
          sourceTitle: 'Signal Desk demo source',
          sourceUrl: 'https://example.com/demo/tool-architecture',
        },
        {
          title: 'Demo mode lowers setup friction',
          category: 'Adoption',
          signal:
            'A no-key sample route lets users explore the product flow immediately before wiring live credentials.',
          whyItMatters:
            'That makes the repo easier to evaluate, demo, and share on GitHub.',
          confidence: 'medium',
          sourceTitle: 'Signal Desk demo source',
          sourceUrl: 'https://example.com/demo/demo-mode',
        },
      ],
      timeline: [
        {
          date: 'T-00',
          event: 'User frames a research mission in the intake panel',
          relevance:
            'The agent gets a sharper objective and can optimize the brief around a concrete question.',
        },
        {
          date: 'T+01',
          event: 'Agent route assembles structured findings and actions',
          relevance:
            'The response is ready for UI rendering without extra markdown parsing.',
        },
      ],
      recommendations: [
        {
          action: 'Use the demo route to validate the experience before wiring secrets.',
          owner: 'Builder',
          expectedImpact:
            'You can verify the report layout, cards, and trace panel in minutes.',
        },
        {
          action: 'Switch to live mode after adding OPENAI_API_KEY in the environment.',
          owner: 'Operator',
          expectedImpact:
            'The app will replace placeholder evidence with current web-backed research.',
        },
      ],
      watchlist: [
        'How quickly live research converges on a final report for complex topics',
        'Whether findings remain non-redundant as more tools or report sections are added',
      ],
      sourcePack: [
        {
          title: 'Demo source: narrative pressure',
          url: 'https://example.com/demo/narrative-pressure',
          note: 'Illustrative placeholder used to preview citation rendering.',
        },
        {
          title: 'Demo source: operator workflow',
          url: 'https://example.com/demo/operator-workflow',
          note: 'Illustrative placeholder used to preview citation rendering.',
        },
        {
          title: 'Demo source: tool architecture',
          url: 'https://example.com/demo/tool-architecture',
          note: 'Illustrative placeholder used to preview citation rendering.',
        },
        {
          title: 'Demo source: demo mode',
          url: 'https://example.com/demo/demo-mode',
          note: 'Illustrative placeholder used to preview citation rendering.',
        },
      ],
    }),
    trace: [
      {
        tool: 'save_finding',
        detail: `Captured a demo market signal for ${request.topic}.`,
        timestamp: now,
      },
      {
        tool: 'save_timeline_event',
        detail: 'Recorded the user request as the starting event.',
        timestamp: now,
      },
      {
        tool: 'submit_brief_report',
        detail: `Published demo report for ${request.mode}.`,
        timestamp: now,
      },
    ],
    meta: {
      model: 'demo-mode',
      searchRuns: 0,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    },
  }
}
