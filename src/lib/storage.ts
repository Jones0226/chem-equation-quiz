import type { QuizStats, WrongItem } from './types'

const KEY_STATS = 'ceq.stats.v1'
const KEY_WRONG = 'ceq.wrong.v1'
const KEY_CHECKIN = 'ceq.checkin.v1'

function safeJsonParse<T>(raw: string | null): T | undefined {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

export function loadStats(): QuizStats {
  return (
    safeJsonParse<QuizStats>(localStorage.getItem(KEY_STATS)) ?? {
      totalAnswered: 0,
      totalCorrect: 0,
      streak: 0,
      bestStreak: 0,
    }
  )
}

export function saveStats(stats: QuizStats) {
  localStorage.setItem(KEY_STATS, JSON.stringify(stats))
}

export function loadWrongMap(): Record<string, WrongItem> {
  return safeJsonParse<Record<string, WrongItem>>(localStorage.getItem(KEY_WRONG)) ?? {}
}

export function saveWrongMap(map: Record<string, WrongItem>) {
  localStorage.setItem(KEY_WRONG, JSON.stringify(map))
}

export function loadCheckins(): string[] {
  return safeJsonParse<string[]>(localStorage.getItem(KEY_CHECKIN)) ?? []
}

export function saveCheckins(days: string[]) {
  localStorage.setItem(KEY_CHECKIN, JSON.stringify(days))
}

