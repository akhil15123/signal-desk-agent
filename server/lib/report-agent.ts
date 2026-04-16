import OpenAI from 'openai'
import { ZodError } from 'zod'
import { AGENT_INSTRUCTIONS, buildBriefUserInput } from './prompt.js'
import {
  type BriefFinding,
  type BriefReport,
  type BriefRequest,
  type BriefSource,
  type BriefTimelineEvent,
  findingSchema,
  reportSchema,
  sourceSchema,
  timelineEventSchema,
} from './schemas.js'

type ToolOutput = {
  ok: boolean
  message: string
}

type FunctionCall = {
  type: 'function_call'
  name: string
  arguments: string
  call_id: string
}

type UsageSnapshot = {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
}

type OutputItem = {
  type?: string
}

type ResponseSnapshot = {
  output?: OutputItem[]
  usage?: UsageSnapshot
}

type UsageSummary = {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

type TraceEntry = {
  tool: string
  detail: string
  timestamp: string
}

type AgentState = {
  findings: BriefFinding[]
  timeline: BriefTimelineEvent[]
  finalReport: BriefReport | null
  trace: TraceEntry[]
  searchRuns: number
  usage: UsageSummary
}

const MAX_AGENT_ROUNDS = 8
const MODEL_NAME = process.env.OPENAI_MODEL ?? 'gpt-5-mini'

const findingTool = {
  type: 'function' as const,
  name: 'save_finding',
  description:
    'Persist a vetted research finding so it can appear in the final brief.',
  strict: true,
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      category: { type: 'string' },
      signal: { type: 'string' },
      whyItMatters: { type: 'string' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      sourceTitle: { type: 'string' },
      sourceUrl: { type: 'string' },
    },
    required: [
      'title',
      'category',
      'signal',
      'whyItMatters',
      'confidence',
      'sourceTitle',
      'sourceUrl',
    ],
  },
}

const timelineTool = {
  type: 'function' as const,
  name: 'save_timeline_event',
  description: 'Store a dated event that materially shapes the brief.',
  strict: true,
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      date: { type: 'string' },
      event: { type: 'string' },
      relevance: { type: 'string' },
    },
    required: ['date', 'event', 'relevance'],
  },
}

const reportTool = {
  type: 'function' as const,
  name: 'submit_brief_report',
  description:
    'Submit the complete structured report after enough research is complete.',
  strict: true,
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      headline: { type: 'string' },
      positioning: { type: 'string' },
      summary: {
        type: 'array',
        items: { type: 'string' },
      },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            category: { type: 'string' },
            signal: { type: 'string' },
            whyItMatters: { type: 'string' },
            confidence: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
            },
            sourceTitle: { type: 'string' },
            sourceUrl: { type: 'string' },
          },
          required: [
            'title',
            'category',
            'signal',
            'whyItMatters',
            'confidence',
            'sourceTitle',
            'sourceUrl',
          ],
        },
      },
      timeline: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            date: { type: 'string' },
            event: { type: 'string' },
            relevance: { type: 'string' },
          },
          required: ['date', 'event', 'relevance'],
        },
      },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            action: { type: 'string' },
            owner: { type: 'string' },
            expectedImpact: { type: 'string' },
          },
          required: ['action', 'owner', 'expectedImpact'],
        },
      },
      watchlist: {
        type: 'array',
        items: { type: 'string' },
      },
      sourcePack: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            url: { type: 'string' },
            note: { type: 'string' },
          },
          required: ['title', 'url', 'note'],
        },
      },
    },
    required: [
      'headline',
      'positioning',
      'summary',
      'findings',
      'timeline',
      'recommendations',
      'watchlist',
      'sourcePack',
    ],
  },
}

const agentTools = [
  { type: 'web_search_preview' as const },
  findingTool,
  timelineTool,
  reportTool,
]

function createClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is missing. Add it to your environment before running a live brief.',
    )
  }

  return new OpenAI({ apiKey })
}

function createEmptyState(): AgentState {
  return {
    findings: [],
    timeline: [],
    finalReport: null,
    trace: [],
    searchRuns: 0,
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
  }
}

function addTrace(state: AgentState, tool: string, detail: string) {
  state.trace.push({
    tool,
    detail,
    timestamp: new Date().toISOString(),
  })
}

function mergeUsage(state: AgentState, response: ResponseSnapshot) {
  const usage = response.usage

  if (!usage) {
    return
  }

  state.usage.inputTokens += usage.input_tokens ?? 0
  state.usage.outputTokens += usage.output_tokens ?? 0
  state.usage.totalTokens += usage.total_tokens ?? 0
}

function indexBuiltInCalls(state: AgentState, response: ResponseSnapshot) {
  for (const item of response.output ?? []) {
    if (item?.type === 'web_search_call') {
      state.searchRuns += 1
    }
  }
}

function mergeFindings(
  submitted: BriefFinding[],
  saved: BriefFinding[],
): BriefFinding[] {
  const merged = [...saved, ...submitted]
  const deduped = new Map<string, BriefFinding>()

  for (const finding of merged) {
    deduped.set(
      `${finding.title.toLowerCase()}::${finding.sourceUrl.toLowerCase()}`,
      finding,
    )
  }

  return [...deduped.values()].slice(0, 8)
}

function mergeTimeline(
  submitted: BriefTimelineEvent[],
  saved: BriefTimelineEvent[],
): BriefTimelineEvent[] {
  const merged = [...saved, ...submitted]
  const deduped = new Map<string, BriefTimelineEvent>()

  for (const event of merged) {
    deduped.set(`${event.date.toLowerCase()}::${event.event.toLowerCase()}`, event)
  }

  return [...deduped.values()].slice(0, 6)
}

function buildSourcePack(
  submitted: BriefSource[],
  savedFindings: BriefFinding[],
): BriefSource[] {
  const fromFindings = savedFindings.map((finding) =>
    sourceSchema.parse({
      title: finding.sourceTitle,
      url: finding.sourceUrl,
      note: finding.whyItMatters,
    }),
  )

  const deduped = new Map<string, BriefSource>()

  for (const source of [...fromFindings, ...submitted]) {
    deduped.set(source.url.toLowerCase(), source)
  }

  return [...deduped.values()].slice(0, 10)
}

function normalizeReport(report: BriefReport, state: AgentState): BriefReport {
  return reportSchema.parse({
    ...report,
    findings: mergeFindings(report.findings, state.findings),
    timeline: mergeTimeline(report.timeline, state.timeline),
    sourcePack: buildSourcePack(report.sourcePack, state.findings),
  })
}

function toValidationMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ')
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown validation error.'
}

async function handleToolCall(
  state: AgentState,
  call: FunctionCall,
): Promise<ToolOutput> {
  const parsedArgs = JSON.parse(call.arguments)

  if (call.name === 'save_finding') {
    try {
      const finding = findingSchema.parse(parsedArgs)
      const key = `${finding.title.toLowerCase()}::${finding.sourceUrl.toLowerCase()}`
      const alreadySaved = state.findings.some(
        (item) =>
          `${item.title.toLowerCase()}::${item.sourceUrl.toLowerCase()}` === key,
      )

      if (!alreadySaved) {
        state.findings.push(finding)
      }

      addTrace(state, call.name, finding.title)
      return {
        ok: true,
        message: `Finding saved. Total findings: ${state.findings.length}.`,
      }
    } catch (error) {
      return {
        ok: false,
        message: `save_finding validation failed: ${toValidationMessage(error)}`,
      }
    }
  }

  if (call.name === 'save_timeline_event') {
    try {
      const event = timelineEventSchema.parse(parsedArgs)
      const key = `${event.date.toLowerCase()}::${event.event.toLowerCase()}`
      const alreadySaved = state.timeline.some(
        (item) =>
          `${item.date.toLowerCase()}::${item.event.toLowerCase()}` === key,
      )

      if (!alreadySaved) {
        state.timeline.push(event)
      }

      addTrace(state, call.name, `${event.date} - ${event.event}`)
      return {
        ok: true,
        message: `Timeline event saved. Total events: ${state.timeline.length}.`,
      }
    } catch (error) {
      return {
        ok: false,
        message: `save_timeline_event validation failed: ${toValidationMessage(error)}`,
      }
    }
  }

  if (call.name === 'submit_brief_report') {
    try {
      const report = reportSchema.parse(parsedArgs)
      state.finalReport = normalizeReport(report, state)
      addTrace(state, call.name, state.finalReport.headline)

      return {
        ok: true,
        message: 'Report accepted.',
      }
    } catch (error) {
      return {
        ok: false,
        message: `submit_brief_report validation failed: ${toValidationMessage(error)}`,
      }
    }
  }

  return {
    ok: false,
    message: `Unknown tool: ${call.name}`,
  }
}

function isFunctionCall(item: OutputItem): item is FunctionCall {
  return item.type === 'function_call'
}

function getFunctionCalls(response: ResponseSnapshot): FunctionCall[] {
  return (response.output ?? []).filter(
    (item): item is FunctionCall => isFunctionCall(item),
  )
}

export async function runBriefingAgent(request: BriefRequest) {
  const client = createClient()
  const state = createEmptyState()

  let response = await client.responses.create({
    model: MODEL_NAME,
    instructions: AGENT_INSTRUCTIONS,
    input: buildBriefUserInput(request),
    tools: agentTools,
    tool_choice: 'auto',
    reasoning: { effort: 'medium' },
  })

  mergeUsage(state, response)
  indexBuiltInCalls(state, response)

  for (let round = 0; round < MAX_AGENT_ROUNDS; round += 1) {
    const functionCalls = getFunctionCalls(response)

    if (functionCalls.length === 0) {
      break
    }

    const toolOutputs = []

    for (const call of functionCalls) {
      const result = await handleToolCall(state, call)
      toolOutputs.push({
        type: 'function_call_output' as const,
        call_id: call.call_id,
        output: JSON.stringify(result),
      })
    }

    if (state.finalReport) {
      break
    }

    response = await client.responses.create({
      model: MODEL_NAME,
      previous_response_id: response.id,
      input: toolOutputs,
      tools: agentTools,
      tool_choice: 'auto',
      reasoning: { effort: 'medium' },
    })

    mergeUsage(state, response)
    indexBuiltInCalls(state, response)
  }

  if (!state.finalReport) {
    throw new Error(
      'The agent did not finish a structured brief. Try broadening the topic or objective and rerun.',
    )
  }

  return {
    report: state.finalReport,
    trace: state.trace,
    meta: {
      model: MODEL_NAME,
      searchRuns: state.searchRuns,
      usage: state.usage,
    },
  }
}
