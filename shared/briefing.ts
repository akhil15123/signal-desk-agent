export const briefModes = [
  'risk-radar',
  'market-map',
  'opportunity-brief',
] as const

export type BriefMode = (typeof briefModes)[number]

export const briefAudiences = [
  'executive',
  'investor',
  'product',
  'operations',
] as const

export type BriefAudience = (typeof briefAudiences)[number]

export const briefModeMeta: Record<
  BriefMode,
  {
    title: string
    eyebrow: string
    detail: string
    promptLabel: string
  }
> = {
  'risk-radar': {
    title: 'Risk Radar',
    eyebrow: 'Pressure Test',
    detail:
      'Map immediate downside, fragility, and fast-moving narrative shifts.',
    promptLabel: 'risk radar',
  },
  'market-map': {
    title: 'Market Map',
    eyebrow: 'Position Scan',
    detail: 'Compare positioning, competitors, and category momentum signals.',
    promptLabel: 'market map',
  },
  'opportunity-brief': {
    title: 'Opportunity Brief',
    eyebrow: 'Next Move',
    detail:
      'Surface asymmetries, openings, and concrete operator recommendations.',
    promptLabel: 'opportunity brief',
  },
}

export const briefAudienceMeta: Record<
  BriefAudience,
  {
    title: string
    promptLabel: string
    demoLabel: string
  }
> = {
  executive: {
    title: 'Executive',
    promptLabel: 'an executive leadership team',
    demoLabel: 'an executive audience',
  },
  investor: {
    title: 'Investor',
    promptLabel: 'an investor or diligence audience',
    demoLabel: 'an investor audience',
  },
  product: {
    title: 'Product',
    promptLabel: 'a product strategy team',
    demoLabel: 'a product audience',
  },
  operations: {
    title: 'Operations',
    promptLabel: 'an operations leadership team',
    demoLabel: 'an operations audience',
  },
}

export const briefRequestLimits = {
  topic: {
    min: 2,
    max: 120,
  },
  objective: {
    min: 12,
    max: 600,
  },
} as const
