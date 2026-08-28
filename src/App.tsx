import { useEffect, useRef, useState } from 'react'
import {
  briefAudienceMeta,
  briefAudiences,
  briefRequestLimits,
  briefModeMeta,
  briefModes,
} from '../shared/briefing.ts'
import { BriefRequestError, requestBrief } from './lib/api'
import { loadStoredDraft, saveDraft } from './lib/draft-storage'
import { buildReportMarkdown, downloadTextFile } from './lib/export'
import type {
  AgentResult,
  BriefAudience,
  BriefMode,
  BriefRequest,
} from './lib/types'

const modeCards: Array<{ id: BriefMode } & (typeof briefModeMeta)[BriefMode]> =
  briefModes.map((mode) => ({
    id: mode,
    ...briefModeMeta[mode],
  }))

const audiences: BriefAudience[] = [...briefAudiences]

const sampleSignals = [
  'Fresh web research with a structured source pack',
  'Agent trace showing what was saved during the run',
  'Decision-ready findings instead of freeform chat',
]

const initialDraft: BriefRequest = {
  topic: 'Anthropic',
  objective:
    'Assess competitive pressure, enterprise momentum, and the most important near-term risks.',
  mode: 'risk-radar',
  audience: 'executive',
}

const starterPresets: Array<{
  label: string
  description: string
  draft: BriefRequest
}> = [
  {
    label: 'Model race',
    description: 'Competitive pressure and execution risk',
    draft: {
      topic: 'Anthropic',
      objective:
        'Assess competitive pressure, enterprise momentum, and the most important near-term risks.',
      mode: 'risk-radar',
      audience: 'executive',
    },
  },
  {
    label: 'Search stack',
    description: 'Positioning, narrative, and buyer pull',
    draft: {
      topic: 'Perplexity',
      objective:
        'Map category positioning, buyer momentum, and the most important execution questions for the next two quarters.',
      mode: 'market-map',
      audience: 'investor',
    },
  },
  {
    label: 'Platform opening',
    description: 'New opportunity framing for product leaders',
    draft: {
      topic: 'OpenAI enterprise tools',
      objective:
        'Identify product openings, adoption asymmetries, and concrete actions a product strategy team should test next.',
      mode: 'opportunity-brief',
      audience: 'product',
    },
  },
]

const reportSections = [
  { id: 'brief-findings', label: 'Findings' },
  { id: 'brief-timeline', label: 'Timeline' },
  { id: 'brief-actions', label: 'Actions' },
  { id: 'brief-watchlist', label: 'Watchlist' },
  { id: 'brief-trace', label: 'Trace' },
  { id: 'brief-sources', label: 'Sources' },
] as const

function formatTokens(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatSourceDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatTraceTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function App() {
  const [draft, setDraft] = useState<BriefRequest>(() =>
    loadStoredDraft(initialDraft),
  )
  const [result, setResult] = useState<AgentResult | null>(null)
  const [error, setError] = useState<{
    message: string
    requestId?: string
  } | null>(null)
  const [runMode, setRunMode] = useState<'live' | 'demo' | null>(null)
  const [summaryCopied, setSummaryCopied] = useState(false)
  const reportPanelRef = useRef<HTMLElement | null>(null)

  const isLoading = runMode !== null
  const topicLength = draft.topic.trim().length
  const objectiveLength = draft.objective.trim().length
  const canRun =
    topicLength >= briefRequestLimits.topic.min &&
    objectiveLength >= briefRequestLimits.objective.min

  const topicMessage =
    topicLength < briefRequestLimits.topic.min
      ? `Use at least ${briefRequestLimits.topic.min} characters so the agent has a concrete target.`
      : topicLength > briefRequestLimits.topic.max
        ? `Keep the topic under ${briefRequestLimits.topic.max} characters to avoid a noisy mission.`
        : 'Name the company, market, product, or issue you want the brief to center on.'

  const objectiveMessage =
    objectiveLength < briefRequestLimits.objective.min
      ? `Use at least ${briefRequestLimits.objective.min} characters so the objective is specific enough to optimize for.`
      : objectiveLength > briefRequestLimits.objective.max
        ? `Keep the objective under ${briefRequestLimits.objective.max} characters so the run stays focused.`
        : 'Spell out the decision, risk, or opportunity the agent should optimize around.'

  const topicCounterClass =
    topicLength > briefRequestLimits.topic.max ? 'is-error' : ''

  const objectiveCounterClass =
    objectiveLength > briefRequestLimits.objective.max ? 'is-error' : ''

  useEffect(() => {
    if ((runMode || result || error) && reportPanelRef.current) {
      reportPanelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [runMode, result, error])

  useEffect(() => {
    saveDraft(draft)
  }, [draft])

  async function handleRun(mode: 'live' | 'demo') {
    if (!canRun) {
      return
    }

    setRunMode(mode)
    setError(null)
    setSummaryCopied(false)

    try {
      const payload = await requestBrief(draft, mode)
      setResult(payload)
    } catch (runError) {
      setError(
        runError instanceof BriefRequestError
          ? {
              message: runError.message,
              requestId: runError.requestId,
            }
          : {
              message:
                runError instanceof Error
                  ? runError.message
                  : 'The agent could not build a brief.',
            },
      )
    } finally {
      setRunMode(null)
    }
  }

  return (
    <div className="app-shell">
      <div className="orb orb-amber" aria-hidden="true" />
      <div className="orb orb-cyan" aria-hidden="true" />

      <header className="hero-banner">
        <div className="hero-copy">
          <p className="eyebrow">Signal Desk Agent</p>
          <h1>Turn live market noise into a sharp intelligence brief.</h1>
          <p className="hero-text">
            Research mode for operators who need cited signals, timeline shifts,
            and the next move in one pass.
          </p>
        </div>

        <div className="hero-metrics">
          <div>
            <span className="metric-value">Web + Tools</span>
            <span className="metric-label">OpenAI Responses orchestration</span>
          </div>
          <div>
            <span className="metric-value">Structured</span>
            <span className="metric-label">brief, findings, timeline, actions</span>
          </div>
          <div>
            <span className="metric-value">Fast</span>
            <span className="metric-label">built for operator-grade scanning</span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="panel panel-intake">
          <div className="panel-heading">
            <p className="eyebrow">Brief Setup</p>
            <h2>Shape the run</h2>
            <p>
              Pick the operating frame, tune the audience, and hand the agent a
              concrete mission.
            </p>
          </div>

          <div className="mode-grid">
            {modeCards.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`mode-card ${draft.mode === mode.id ? 'is-active' : ''}`}
                onClick={() => setDraft((current) => ({ ...current, mode: mode.id }))}
              >
                <span className="mode-eyebrow">{mode.eyebrow}</span>
                <strong>{mode.title}</strong>
                <span>{mode.detail}</span>
              </button>
            ))}
          </div>

          <div className="preset-row">
            {starterPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="preset-card"
                onClick={() => setDraft(preset.draft)}
              >
                <strong>{preset.label}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
          </div>

          <label className="field">
            <span>Topic</span>
            <input
              value={draft.topic}
              onChange={(event) =>
                setDraft((current) => ({ ...current, topic: event.target.value }))
              }
              placeholder="Company, market, product, or strategic issue"
            />
            <div className="field-meta">
              <p
                className={`field-message ${
                  topicLength < briefRequestLimits.topic.min ||
                  topicLength > briefRequestLimits.topic.max
                    ? 'is-error'
                    : ''
                }`}
              >
                {topicMessage}
              </p>
              <span className={`field-counter ${topicCounterClass}`}>
                {topicLength}/{briefRequestLimits.topic.max}
              </span>
            </div>
          </label>

          <label className="field">
            <span>Objective</span>
            <textarea
              rows={5}
              value={draft.objective}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  objective: event.target.value,
                }))
              }
              placeholder="What should the agent optimize for?"
            />
            <div className="field-meta">
              <p
                className={`field-message ${
                  objectiveLength < briefRequestLimits.objective.min ||
                  objectiveLength > briefRequestLimits.objective.max
                    ? 'is-error'
                    : ''
                }`}
              >
                {objectiveMessage}
              </p>
              <span className={`field-counter ${objectiveCounterClass}`}>
                {objectiveLength}/{briefRequestLimits.objective.max}
              </span>
            </div>
          </label>

          <div className="field">
            <span>Audience</span>
            <div className="chip-row">
              {audiences.map((audience) => (
                <button
                  key={audience}
                  type="button"
                  className={`chip ${draft.audience === audience ? 'is-selected' : ''}`}
                  onClick={() =>
                    setDraft((current) => ({ ...current, audience }))
                  }
                >
                  {briefAudienceMeta[audience].title}
                </button>
              ))}
            </div>
          </div>

          <div className="action-row">
            <button
              type="button"
              className="primary-button"
              disabled={!canRun || isLoading}
              onClick={() => void handleRun('live')}
            >
              {runMode === 'live' ? 'Researching live sources...' : 'Run live brief'}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={isLoading}
              onClick={() => void handleRun('demo')}
            >
              {runMode === 'demo' ? 'Loading demo...' : 'Load demo'}
            </button>
            <button
              type="button"
              className="tertiary-button"
              disabled={isLoading}
              onClick={() => {
                setDraft(initialDraft)
                setError(null)
              }}
            >
              Reset draft
            </button>
          </div>

          <p className="helper-text">
            Live mode calls the backend agent. Demo mode renders a sample report
            so the experience works before credentials are added.
          </p>
        </section>

        <section ref={reportPanelRef} className="panel panel-preview">
          <div className="panel-heading">
            <p className="eyebrow">What You Get</p>
            <h2>Operator-ready output</h2>
            <p>
              The agent runs web research, records findings with tool calls, and
              assembles a briefing package instead of a chat transcript.
            </p>
          </div>

          <div className="stack-card terminal-card">
            <div className="terminal-topline">
              <span />
              <span />
              <span />
            </div>
            <p className="terminal-label">Current draft mission</p>
            <code>{draft.mode}</code>
            <h3>{draft.topic || 'Waiting for topic'}</h3>
            <p>{draft.objective || 'Add an objective to sharpen the brief.'}</p>
          </div>

          {error ? (
            <article className="stack-card error-card">
              <div className="report-tag">Run failed</div>
              <h3>{error.message}</h3>
              <p>
                Live mode needs a valid backend configuration. Demo mode is still
                available for UI previewing.
              </p>
              {error.requestId ? (
                <p className="request-copy">Request ID: {error.requestId}</p>
              ) : null}
            </article>
          ) : null}

          {isLoading ? (
            <article className="stack-card loading-card">
              <div className="report-tag">Agent in flight</div>
              <h3>
                {runMode === 'live'
                  ? 'Collecting evidence and assembling the brief.'
                  : 'Preparing the sample briefing package.'}
              </h3>
              <p>
                The result panel will update with findings, recommendations, a
                timeline, and the source pack when the run finishes.
              </p>
            </article>
          ) : null}

          {result ? (
            <div className="report-stack">
              <article className="stack-card report-header-card">
                <div className="meta-row">
                  <span className="pill">{result.meta.model}</span>
                  <span className="pill">
                    {result.meta.searchRuns} web search
                    {result.meta.searchRuns === 1 ? '' : 'es'}
                  </span>
                  <span className="pill">
                    {formatTokens(result.meta.usage.totalTokens)} tokens
                  </span>
                  <span className="pill">request {result.requestId}</span>
                </div>
                <div className="report-tag">Brief ready</div>
                <h3>{result.report.headline}</h3>
                <p>{result.report.positioning}</p>
                <div className="report-actions">
                  <button
                    type="button"
                    className="utility-button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        result.report.summary
                          .map((item) => `- ${item}`)
                          .join('\n'),
                      )
                      setSummaryCopied(true)
                      window.setTimeout(() => {
                        setSummaryCopied(false)
                      }, 1500)
                    }}
                  >
                    {summaryCopied ? 'Summary copied' : 'Copy summary'}
                  </button>
                  <button
                    type="button"
                    className="utility-button"
                    onClick={() =>
                      downloadTextFile(
                        `${result.report.headline
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')}-brief.md`,
                        buildReportMarkdown(result),
                        'text/markdown;charset=utf-8',
                      )
                    }
                  >
                    Export markdown
                  </button>
                  <button
                    type="button"
                    className="utility-button"
                    onClick={() =>
                      downloadTextFile(
                        `${result.report.headline
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')}-brief.json`,
                        JSON.stringify(result, null, 2),
                        'application/json;charset=utf-8',
                      )
                    }
                  >
                    Export JSON
                  </button>
                </div>
              </article>

              <section className="insight-strip">
                <article className="stack-card insight-card">
                  <span className="report-tag">Findings</span>
                  <strong>{result.report.findings.length}</strong>
                </article>
                <article className="stack-card insight-card">
                  <span className="report-tag">Timeline</span>
                  <strong>{result.report.timeline.length}</strong>
                </article>
                <article className="stack-card insight-card">
                  <span className="report-tag">Actions</span>
                  <strong>{result.report.recommendations.length}</strong>
                </article>
                <article className="stack-card insight-card">
                  <span className="report-tag">Sources</span>
                  <strong>{result.report.sourcePack.length}</strong>
                </article>
              </section>

              <nav className="report-jump-nav" aria-label="Brief sections">
                {reportSections.map((section) => (
                  <a key={section.id} href={`#${section.id}`}>
                    {section.label}
                  </a>
                ))}
              </nav>

              <section className="summary-grid">
                {result.report.summary.map((item) => (
                  <article key={item} className="stack-card summary-card">
                    <p>{item}</p>
                  </article>
                ))}
              </section>

              <section id="brief-findings" className="report-section">
                <div className="section-head">
                  <div className="report-tag">Findings</div>
                  <h3>Key signals</h3>
                </div>
                <div className="findings-grid">
                  {result.report.findings.map((finding) => (
                    <article
                      key={`${finding.title}-${finding.sourceUrl}`}
                      className="stack-card finding-card"
                    >
                      <div className="finding-topline">
                        <span className="report-tag">{finding.category}</span>
                        <span className={`confidence confidence-${finding.confidence}`}>
                          {finding.confidence}
                        </span>
                      </div>
                      <h3>{finding.title}</h3>
                      <p>{finding.signal}</p>
                      <p className="subtle-copy">{finding.whyItMatters}</p>
                      <a href={finding.sourceUrl} target="_blank" rel="noreferrer">
                        {finding.sourceTitle}
                      </a>
                    </article>
                  ))}
                </div>
              </section>

              <section className="report-section two-up">
                <article className="stack-card">
                  <div id="brief-timeline" className="section-head">
                    <div className="report-tag">Timeline</div>
                    <h3>Recent shifts</h3>
                  </div>
                  <div className="timeline-list">
                    {result.report.timeline.map((event) => (
                      <div key={`${event.date}-${event.event}`} className="timeline-item">
                        <strong>{event.date}</strong>
                        <p>{event.event}</p>
                        <span>{event.relevance}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="stack-card">
                  <div id="brief-actions" className="section-head">
                    <div className="report-tag">Actions</div>
                    <h3>Recommended moves</h3>
                  </div>
                  <div className="recommendation-list">
                    {result.report.recommendations.map((recommendation) => (
                      <div key={recommendation.action} className="recommendation-item">
                        <p>{recommendation.action}</p>
                        <span>
                          {recommendation.owner} · {recommendation.expectedImpact}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="report-section two-up">
                <article className="stack-card">
                  <div id="brief-watchlist" className="section-head">
                    <div className="report-tag">Watchlist</div>
                    <h3>Keep an eye on</h3>
                  </div>
                  <ul className="watchlist">
                    {result.report.watchlist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="stack-card">
                  <div id="brief-trace" className="section-head">
                    <div className="report-tag">Trace</div>
                    <h3>Agent actions</h3>
                  </div>
                  <div className="trace-list">
                    {result.trace.map((entry) => (
                      <div key={`${entry.tool}-${entry.timestamp}`} className="trace-item">
                        <div className="trace-head">
                          <strong>{entry.tool}</strong>
                          <span>{formatTraceTimestamp(entry.timestamp)}</span>
                        </div>
                        <p>{entry.detail}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section id="brief-sources" className="report-section">
                <div className="section-head">
                  <div className="report-tag">Sources</div>
                  <h3>Source pack</h3>
                </div>
                <div className="source-grid">
                  {result.report.sourcePack.map((source) => (
                    <a
                      key={source.url}
                      className="stack-card source-card"
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="source-domain">
                        {formatSourceDomain(source.url)}
                      </span>
                      <strong>{source.title}</strong>
                      <p>{source.note}</p>
                    </a>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <>
              <div className="signal-list">
                {sampleSignals.map((signal) => (
                  <article key={signal} className="stack-card signal-card">
                    <p>{signal}</p>
                  </article>
                ))}
              </div>

              <article className="stack-card ghost-report">
                <div className="report-tag">Next panel</div>
                <h3>
                  Run a live brief to populate findings, timeline events, and action items.
                </h3>
                <p>
                  Signal Desk returns a typed report object, not a loose chat
                  transcript. That makes the interface easier to scan and the
                  backend easier to test.
                </p>
              </article>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
