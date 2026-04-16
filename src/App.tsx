import { useState } from 'react'

type BriefMode = 'risk-radar' | 'market-map' | 'opportunity-brief'
type BriefAudience = 'executive' | 'investor' | 'product' | 'operations'

type Draft = {
  topic: string
  objective: string
  mode: BriefMode
  audience: BriefAudience
}

const modeCards: Array<{
  id: BriefMode
  title: string
  eyebrow: string
  detail: string
}> = [
  {
    id: 'risk-radar',
    title: 'Risk Radar',
    eyebrow: 'Pressure Test',
    detail: 'Map immediate downside, fragility, and fast-moving narrative shifts.',
  },
  {
    id: 'market-map',
    title: 'Market Map',
    eyebrow: 'Position Scan',
    detail: 'Compare positioning, competitors, and category momentum signals.',
  },
  {
    id: 'opportunity-brief',
    title: 'Opportunity Brief',
    eyebrow: 'Next Move',
    detail: 'Surface asymmetries, openings, and concrete operator recommendations.',
  },
]

const audiences: BriefAudience[] = [
  'executive',
  'investor',
  'product',
  'operations',
]

const sampleSignals = [
  'Fresh web research with a structured source pack',
  'Agent trace showing what was saved during the run',
  'Decision-ready findings instead of freeform chat',
]

const initialDraft: Draft = {
  topic: 'Anthropic',
  objective:
    'Assess competitive pressure, enterprise momentum, and the most important near-term risks.',
  mode: 'risk-radar',
  audience: 'executive',
}

function App() {
  const [draft, setDraft] = useState<Draft>(initialDraft)

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

          <label className="field">
            <span>Topic</span>
            <input
              value={draft.topic}
              onChange={(event) =>
                setDraft((current) => ({ ...current, topic: event.target.value }))
              }
              placeholder="Company, market, product, or strategic issue"
            />
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
                  {audience}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="primary-button">
            Live brief wiring comes next
          </button>
        </section>

        <section className="panel panel-preview">
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

          <div className="signal-list">
            {sampleSignals.map((signal) => (
              <article key={signal} className="stack-card signal-card">
                <p>{signal}</p>
              </article>
            ))}
          </div>

          <article className="stack-card ghost-report">
            <div className="report-tag">Next panel</div>
            <h3>Run a live brief to populate findings, timeline events, and action items.</h3>
            <p>
              This shell is ready for the agent backend. The next step is wiring
              the form into the `/api/brief` route and rendering the returned
              report object.
            </p>
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
