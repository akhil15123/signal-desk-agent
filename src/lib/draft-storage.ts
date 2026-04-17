import {
  briefAudiences,
  briefModes,
} from '../../shared/briefing.ts'
import type { BriefRequest } from './types'

const STORAGE_KEY = 'signal-desk:draft'

function isStoredDraft(value: unknown): value is BriefRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const draft = value as Record<string, unknown>

  return (
      typeof draft.topic === 'string' &&
      typeof draft.objective === 'string' &&
      typeof draft.mode === 'string' &&
      typeof draft.audience === 'string' &&
    briefModes.includes(draft.mode as (typeof briefModes)[number]) &&
    briefAudiences.includes(
      draft.audience as (typeof briefAudiences)[number],
    )
  )
}

export function loadStoredDraft(fallback: BriefRequest) {
  if (typeof window === 'undefined') {
    return fallback
  }

  const value = window.localStorage.getItem(STORAGE_KEY)

  if (!value) {
    return fallback
  }

  try {
    const parsed = JSON.parse(value) as unknown
    return isStoredDraft(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function saveDraft(draft: BriefRequest) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}
