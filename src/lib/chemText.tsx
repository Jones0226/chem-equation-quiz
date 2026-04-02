import type { ReactNode } from 'react'

let k = 0
const key = () => k++

function readElement(s: string, i: number): { sym: string; end: number } | null {
  if (i >= s.length || s[i] < 'A' || s[i] > 'Z') return null
  if (i + 1 < s.length && s[i + 1] >= 'a' && s[i + 1] <= 'z') {
    return { sym: s.slice(i, i + 2), end: i + 2 }
  }
  return { sym: s[i], end: i + 1 }
}

function readDigits(s: string, i: number): { num: string; end: number } {
  let j = i
  let num = ''
  while (j < s.length && s[j] >= '0' && s[j] <= '9') {
    num += s[j]
    j++
  }
  return { num, end: j }
}

/** 从右侧剥离离子电荷：Fe3+、SO42-、NH4+ */
function stripTrailingCharge(s: string): { body: string; charge?: string } {
  const m = s.match(/^(.+)(\d+)([+-])$/)
  if (m) return { body: m[1], charge: m[2] + m[3] }
  const m2 = s.match(/^(.+)([+-])$/)
  if (m2 && m2[1].length > 0) return { body: m2[1], charge: m2[2] }
  return { body: s }
}

/** 解析无电荷的分子/离子团，如 NH3、H2O、(NH4)2、SO4 */
function parseBody(s: string): ReactNode[] {
  const out: ReactNode[] = []
  let i = 0
  while (i < s.length) {
    if (s[i] === '(') {
      let depth = 1
      let j = i + 1
      while (j < s.length && depth > 0) {
        if (s[j] === '(') depth++
        if (s[j] === ')') depth--
        j++
      }
      const inner = s.slice(i + 1, j - 1)
      i = j
      const innerNodes = parseBody(inner)
      const sub = readDigits(s, i)
      if (sub.num) {
        i = sub.end
        out.push(
          <span key={key()}>
            (<>{innerNodes}</>)<sub>{sub.num}</sub>
          </span>,
        )
      } else {
        out.push(
          <span key={key()}>
            (<>{innerNodes}</>)
          </span>,
        )
      }
      continue
    }

    const el = readElement(s, i)
    if (!el) {
      out.push(<span key={key()}>{s[i]}</span>)
      i++
      continue
    }
    i = el.end
    out.push(<span key={key()}>{el.sym}</span>)

    if (i >= s.length) break

    const d = readDigits(s, i)
    if (d.num) {
      out.push(<sub key={key()}>{d.num}</sub>)
      i = d.end
    }
  }
  return out
}

/** 一项：系数 + 分子（可含离子电荷） */
function parseMoleculeTerm(mol: string): ReactNode[] {
  const { body, charge } = stripTrailingCharge(mol)
  const nodes = parseBody(body)
  if (charge) nodes.push(<sup key={key()}>{charge}</sup>)
  return nodes
}

function parseTerm(term: string): ReactNode {
  const t = term.trim()
  if (!t) return null
  let i = 0
  let coeff = ''
  while (i < t.length && t[i] >= '0' && t[i] <= '9') coeff += t[i++]
  const mol = t.slice(i)
  if (!mol) return <span>{coeff}</span>
  if (/^[A-Z(]/.test(mol)) {
    return (
      <>
        {coeff ? <span key={key()}>{coeff}</span> : null}
        {parseMoleculeTerm(mol)}
      </>
    )
  }
  return (
    <>
      {coeff}
      {mol}
    </>
  )
}

/** 含 + 的反应式一段（无箭头） */
function parsePlusSegment(seg: string): ReactNode {
  const parts: string[] = []
  let buf = ''
  for (let i = 0; i < seg.length; i++) {
    const ch = seg[i]
    if (ch !== '+') {
      buf += ch
      continue
    }
    const prev = i > 0 ? seg[i - 1] : ''
    const next = i + 1 < seg.length ? seg[i + 1] : ''
    const isSeparator =
      prev === '+' ||
      (next !== '+' && i > 0 && i < seg.length - 1 && prev.trim() !== '' && next.trim() !== '')
    if (isSeparator) {
      if (buf.trim()) parts.push(buf.trim())
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.trim()) parts.push(buf.trim())
  if (parts.length === 0) return seg
  return (
    <>
      {parts.map((p, idx) => (
        <span key={key()}>
          {idx > 0 ? '+' : null}
          {parseTerm(p)}
        </span>
      ))}
    </>
  )
}

/** 含 → 或 ⇌ 的一行 */
function parseArrowLine(line: string): ReactNode {
  const chunks: ReactNode[] = []
  const re = /(→|⇌)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    const before = line.slice(last, m.index)
    if (before) chunks.push(<span key={key()}>{parsePlusSegment(before)}</span>)
    chunks.push(<span key={key()}>{m[1]}</span>)
    last = m.index + m[0].length
  }
  const tail = line.slice(last)
  if (tail) chunks.push(<span key={key()}>{parsePlusSegment(tail)}</span>)
  return <>{chunks}</>
}

/** 混排一行：有箭头则按方程式处理；否则对英文化学片段做简单格式化 */
function parseLine(line: string): ReactNode {
  if (/[→⇌]/.test(line) && /[A-Z]/.test(line)) {
    const pieces = line.split(/(;|；)/)
    return (
      <>
        {pieces.map((piece, pi) => (
          <span key={key()}>
            {pi > 0 ? '；' : null}
            {/[→⇌]/.test(piece) && /[A-Z]/.test(piece) ? parseArrowLine(piece) : piece}
          </span>
        ))}
      </>
    )
  }

  if (!/[A-Z]/.test(line)) return line

  const out: ReactNode[] = []
  let buf = ''
  let i = 0
  while (i < line.length) {
    const ch = line[i]
    if (ch >= 'A' && ch <= 'Z') {
      if (buf) {
        out.push(<span key={key()}>{buf}</span>)
        buf = ''
      }
      let j = i
      while (j < line.length && /[A-Za-z0-9+()\-]/.test(line[j])) j++
      const token = line.slice(i, j)
      if (/^[A-Z(]/.test(token) && token.length >= 2) {
        out.push(<span key={key()}>{parseTerm(token)}</span>)
      } else {
        out.push(<span key={key()}>{token}</span>)
      }
      i = j
      continue
    }
    buf += ch
    i++
  }
  if (buf) out.push(<span key={key()}>{buf}</span>)
  return <>{out}</>
}

export function ChemText({ text }: { text: string }) {
  k = 0
  if (!text) return null
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, li) => (
        <span key={li}>
          {li > 0 ? <br /> : null}
          {parseLine(line)}
        </span>
      ))}
    </>
  )
}
