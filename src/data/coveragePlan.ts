export type CoveragePlanItem = {
  book: string
  chapter: string
  targetEquations: number
  targetFacts: number
}

// 逐章核对基线（可按你的教学进度继续调整目标值）
export const COVERAGE_PLAN: CoveragePlanItem[] = [
  { book: '必修一', chapter: '全册', targetEquations: 44, targetFacts: 50 },
  { book: '必修二', chapter: '全册', targetEquations: 28, targetFacts: 35 },
  { book: '选必一 化学反应原理', chapter: '全册', targetEquations: 30, targetFacts: 40 },
  { book: '选必二 物质结构与性质', chapter: '全册', targetEquations: 2, targetFacts: 45 },
  { book: '选必三 有机化学基础', chapter: '全册', targetEquations: 50, targetFacts: 50 },
]

