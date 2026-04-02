import type { GradeStage } from '../lib/types'
import { EQUATIONS } from './equations'
import { FACTS } from './facts'
import { BIO_FACTS } from './bioFacts'
import { ZJ_GAOKAO_CARDS } from './zjGaokaoCards'

/** 人教版高中化学五本教材（与 coveragePlan 一致） */
export const BOOK_MODULES = [
  '必修一',
  '必修二',
  '选必一 化学反应原理',
  '选必二 物质结构与性质',
  '选必三 有机化学基础',
  '浙科版高中生物必修1',
  '浙科版高中生物必修2',
  '浙科版高中生物选择性必修1',
  '浙科版高中生物选择性必修2',
  '浙科版高中生物选择性必修3',
] as const

export type BookModule = (typeof BOOK_MODULES)[number]

export type MemoryCardItem = {
  id: string
  book: string
  stage: GradeStage
  tags?: string[]
  prompt: string
  answer: string
  cardKind: '方程式' | '知识点' | '生物知识点'
}

export const MEMORY_CARDS: MemoryCardItem[] = [
  ...EQUATIONS.map((e) => ({
    id: e.id,
    book: e.chapter ?? '必修一',
    stage: e.stage,
    tags: e.tags,
    prompt: e.prompt,
    answer: e.equation,
    cardKind: '方程式' as const,
  })),
  ...FACTS.map((f) => ({
    id: f.id,
    book: f.chapter ?? '必修一',
    stage: f.stage,
    tags: f.tags,
    prompt: f.prompt,
    answer: f.answer,
    cardKind: '知识点' as const,
  })),
  ...BIO_FACTS.map((f) => ({
    id: f.id,
    book: f.chapter ?? '生物知识点',
    stage: f.stage,
    tags: f.tags,
    prompt: f.prompt,
    answer: f.answer,
    cardKind: '生物知识点' as const,
  })),
  ...ZJ_GAOKAO_CARDS.map((f) => ({
    id: f.id,
    book: f.chapter ?? '必修一',
    stage: f.stage,
    tags: f.tags,
    prompt: f.prompt,
    answer: f.answer,
    cardKind: '知识点' as const,
  })),
]
