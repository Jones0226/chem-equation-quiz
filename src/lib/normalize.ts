export function normalizeEquationInput(s: string): string {
  // Tolerate common arrow symbols and spacing.
  return s
    .trim()
    .replaceAll('=', '→')
    .replaceAll('->', '→')
    .replaceAll('→→', '→')
    .replaceAll('⇨', '→')
    .replaceAll('=>', '→')
    .replaceAll('⟶', '→')
    .replaceAll('⟹', '→')
    .replaceAll(/\s+/g, '')
    .replaceAll('＋', '+')
    .replaceAll('（', '(')
    .replaceAll('）', ')')
}

