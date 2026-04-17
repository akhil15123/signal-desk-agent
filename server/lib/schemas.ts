import { z } from 'zod'
import {
  briefAudiences,
  briefModes,
  briefRequestLimits,
} from '../../shared/briefing.ts'

export const briefModeSchema = z.enum(briefModes)

export const briefAudienceSchema = z.enum(briefAudiences)

export const confidenceSchema = z.enum(['high', 'medium', 'low'])

export const briefRequestSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(briefRequestLimits.topic.min)
    .max(briefRequestLimits.topic.max),
  objective: z
    .string()
    .trim()
    .min(briefRequestLimits.objective.min)
    .max(briefRequestLimits.objective.max),
  mode: briefModeSchema,
  audience: briefAudienceSchema,
})

export const sourceSchema = z.object({
  title: z.string().trim().min(3).max(160),
  url: z.url().max(500),
  note: z.string().trim().min(8).max(280),
})

export const findingSchema = z.object({
  title: z.string().trim().min(6).max(140),
  category: z.string().trim().min(3).max(60),
  signal: z.string().trim().min(18).max(260),
  whyItMatters: z.string().trim().min(20).max(260),
  confidence: confidenceSchema,
  sourceTitle: z.string().trim().min(3).max(160),
  sourceUrl: z.url().max(500),
})

export const timelineEventSchema = z.object({
  date: z.string().trim().min(4).max(40),
  event: z.string().trim().min(10).max(180),
  relevance: z.string().trim().min(14).max(220),
})

export const recommendationSchema = z.object({
  action: z.string().trim().min(12).max(180),
  owner: z.string().trim().min(3).max(80),
  expectedImpact: z.string().trim().min(12).max(220),
})

export const reportSchema = z.object({
  headline: z.string().trim().min(12).max(160),
  positioning: z.string().trim().min(24).max(220),
  summary: z.array(z.string().trim().min(14).max(220)).min(3).max(5),
  findings: z.array(findingSchema).min(4).max(8),
  timeline: z.array(timelineEventSchema).min(2).max(6),
  recommendations: z.array(recommendationSchema).min(2).max(5),
  watchlist: z.array(z.string().trim().min(10).max(120)).min(2).max(5),
  sourcePack: z.array(sourceSchema).min(4).max(10),
})

export type BriefRequest = z.infer<typeof briefRequestSchema>
export type BriefSource = z.infer<typeof sourceSchema>
export type BriefFinding = z.infer<typeof findingSchema>
export type BriefTimelineEvent = z.infer<typeof timelineEventSchema>
export type BriefRecommendation = z.infer<typeof recommendationSchema>
export type BriefReport = z.infer<typeof reportSchema>
