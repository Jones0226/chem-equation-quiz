export type GradeStage = '初中' | '高中'

export type EquationArrow = '→' | '⇌'

export type Equation = {
  id: string
  stage: GradeStage
  chapter?: string
  tags?: string[]
  prompt: string
  equation: string
}

export type FactCard = {
  id: string
  stage: GradeStage
  chapter?: string
  tags?: string[]
  prompt: string
  answer: string
}

export type QuizStats = {
  totalAnswered: number
  totalCorrect: number
  streak: number
  bestStreak: number
  lastAnsweredAt?: number
}

export type WrongItem = {
  equationId: string
  wrongCount: number
  lastWrongAt: number
}

