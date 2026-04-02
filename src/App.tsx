import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { EQUATIONS } from './data/equations'
import { FACTS } from './data/facts'
import { COVERAGE_PLAN } from './data/coveragePlan'
import { BOOK_MODULES, MEMORY_CARDS, type MemoryCardItem } from './data/memoryCards'
import { ZJ_GAOKAO_CARDS } from './data/zjGaokaoCards'
import { BIO_FACTS } from './data/bioFacts'
import { ChemText } from './lib/chemText'
import {
  loadCheckins,
  loadStats,
  loadWrongMap,
  saveCheckins,
  saveStats,
  saveWrongMap,
} from './lib/storage'
import type { QuizStats, WrongItem } from './lib/types'

type Tab = '练习' | '错题本' | '统计'
type BookFilter = '全部' | (typeof BOOK_MODULES)[number]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function dateKey(ms = Date.now()): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function calcCheckinStreak(days: string[]): number {
  if (days.length === 0) return 0
  const set = new Set(days)
  let streak = 0
  let cursor = new Date()
  for (;;) {
    const key = cursor.toISOString().slice(0, 10)
    if (!set.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function daysBetween(a: Date, b: Date): number {
  const x = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const y = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.floor((x - y) / 86400000)
}

function pickTagEmoji(tag: string, cardKind: MemoryCardItem['cardKind']): string {
  if (cardKind === '方程式') return '🧪'
  if (cardKind === '生物知识点') return '🧬'
  const t = tag.toLowerCase()
  if (tag.includes('实验')) return '🔬'
  if (tag.includes('遗传') || tag.includes('基因') || tag.includes('dna') || tag.includes('rna'))
    return '🧬'
  if (tag.includes('生态') || tag.includes('环境') || tag.includes('群落') || tag.includes('种群'))
    return '🌿'
  if (tag.includes('细胞') || tag.includes('代谢')) return '🦠'
  if (tag.includes('免疫')) return '🛡️'
  if (tag.includes('电化学') || tag.includes('平衡') || tag.includes('氧化还原')) return '⚡'
  if (tag.includes('有机')) return '🧫'
  if (tag.includes('工业流程') || tag.includes('浙江高考')) return '🏭'
  if (tag.includes('离子')) return '🔋'
  if (t.includes('ph')) return '🧷'
  return cardKind === '知识点' ? '📘' : '✨'
}

function App() {
  const [tab, setTab] = useState<Tab>('练习')
  const [stage, setStage] = useState<'全部' | '初中' | '高中'>('全部')
  const [bookModule, setBookModule] = useState<BookFilter>('全部')
  const [stats, setStats] = useState<QuizStats>(() => loadStats())
  const [wrongMap, setWrongMap] = useState<Record<string, WrongItem>>(() =>
    loadWrongMap(),
  )
  const [checkins, setCheckins] = useState<string[]>(() => loadCheckins())

  const pool = useMemo(() => {
    let list = MEMORY_CARDS
    if (stage !== '全部') list = list.filter((c) => c.stage === stage)
    if (bookModule !== '全部') list = list.filter((c) => c.book === bookModule)
    return list
  }, [stage, bookModule])

  const [current, setCurrent] = useState<MemoryCardItem | null>(null)
  const [cardRevealed, setCardRevealed] = useState(false)

  useEffect(() => {
    if (pool.length === 0) {
      setCurrent(null)
      setCardRevealed(false)
      return
    }
    setCurrent(pickRandom(pool))
    setCardRevealed(false)
  }, [pool])

  function nextQuestion() {
    if (pool.length === 0) return
    setCurrent(pickRandom(pool))
    setCardRevealed(false)
  }

  function nextMemoryCard() {
    if (cardRevealed) {
      const now = Date.now()
      setStats((prev) => {
        const nextStats: QuizStats = {
          ...prev,
          totalAnswered: prev.totalAnswered + 1,
          totalCorrect: prev.totalCorrect + 1,
          streak: prev.streak + 1,
          bestStreak: Math.max(prev.bestStreak, prev.streak + 1),
          lastAnsweredAt: now,
        }
        saveStats(nextStats)
        return nextStats
      })
    }
    nextQuestion()
  }

  const wrongList = useMemo(() => {
    const items = Object.values(wrongMap)
    items.sort((a, b) => b.lastWrongAt - a.lastWrongAt)
    return items
      .map((w) => ({
        ...w,
        item:
          EQUATIONS.find((e) => e.id === w.equationId) ??
          FACTS.find((f) => f.id === w.equationId) ??
          ZJ_GAOKAO_CARDS.find((f) => f.id === w.equationId) ??
          BIO_FACTS.find((f) => f.id === w.equationId),
      }))
      .filter((x) => Boolean(x.item))
  }, [wrongMap])

  const accuracy = stats.totalAnswered === 0 ? 0 : stats.totalCorrect / stats.totalAnswered

  const coverageRows = useMemo(() => {
    return COVERAGE_PLAN.map((plan) => {
      const inBook = MEMORY_CARDS.filter((c) => c.book === plan.book)
      const equationCount = inBook.filter((c) => c.cardKind === '方程式').length
      const factCount = inBook.filter((c) => c.cardKind === '知识点').length
      const currentCount = equationCount + factCount
      const target = plan.targetEquations + plan.targetFacts
      const rate = target === 0 ? 1 : Math.min(1, currentCount / target)
      return {
        ...plan,
        equationCount,
        factCount,
        current: currentCount,
        target,
        rate,
      }
    })
  }, [])

  const coverageSummary = useMemo(() => {
    const current = coverageRows.reduce((s, row) => s + row.current, 0)
    const target = coverageRows.reduce((s, row) => s + row.target, 0)
    return {
      current,
      target,
      rate: target === 0 ? 1 : current / target,
    }
  }, [coverageRows])

  const today = dateKey()
  const checkedToday = checkins.includes(today)
  const checkinStreak = useMemo(() => calcCheckinStreak(checkins), [checkins])
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().slice(0, 10)
      return {
        key,
        short: `${d.getMonth() + 1}/${d.getDate()}`,
        checked: checkins.includes(key),
      }
    })
  }, [checkins])

  const monthData = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const first = new Date(year, month, 1)
    const totalDays = new Date(year, month + 1, 0).getDate()
    const startWeekDay = first.getDay() // 0 = Sunday
    const cells: Array<{ key: string; day: number; checked: boolean } | null> = []

    for (let i = 0; i < startWeekDay; i += 1) cells.push(null)
    for (let d = 1; d <= totalDays; d += 1) {
      const date = new Date(year, month, d)
      const key = date.toISOString().slice(0, 10)
      cells.push({ key, day: d, checked: checkins.includes(key) })
    }

    return {
      title: `${year}年${month + 1}月`,
      cells,
    }
  }, [checkins])

  const reminder = useMemo(() => {
    if (checkedToday) return '今天已完成打卡，继续保持。'
    if (checkins.length === 0) return '今天开始第一次打卡吧。'
    const last = checkins[checkins.length - 1]
    const lastDate = new Date(`${last}T00:00:00`)
    const gap = daysBetween(new Date(), lastDate)
    if (gap <= 1) return '今天还没打卡，记得完成今日任务。'
    return `打卡已中断 ${gap - 1} 天，今天补上重新建立连续记录。`
  }, [checkedToday, checkins])

  function doCheckin() {
    if (checkedToday) return
    const merged = Array.from(new Set([...checkins, today])).sort()
    setCheckins(merged)
    saveCheckins(merged)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div className="brandTitle">
            <strong>浙江高考化学题库</strong>
            <span>化学/生物 · 教材模块记忆卡片（流程 + 方程式）</span>
          </div>
        </div>
        <nav className="nav" aria-label="导航">
          <button
            className={`navBtn ${tab === '练习' ? 'navBtnActive' : ''}`}
            onClick={() => setTab('练习')}
          >
            练习
          </button>
          <button
            className={`navBtn ${tab === '错题本' ? 'navBtnActive' : ''}`}
            onClick={() => setTab('错题本')}
          >
            错题本
          </button>
          <button
            className={`navBtn ${tab === '统计' ? 'navBtnActive' : ''}`}
            onClick={() => setTab('统计')}
          >
            统计
          </button>
        </nav>
      </header>

      <main className="grid">
        {tab === '练习' ? (
          <div className="practiceWrap">
            <section className="card">
              <h2 className="cardTitle">知识点记忆</h2>
              <div className="pill">
                <div>
                  <strong>教材模块</strong>
                  <span> · 先选册别，再选初高中范围</span>
                </div>
                <div className="row" style={{ marginTop: 0 }}>
                  <button
                    className={`navBtn ${bookModule === '全部' ? 'navBtnActive' : ''}`}
                    onClick={() => setBookModule('全部')}
                  >
                    全部模块
                  </button>
                  {BOOK_MODULES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={`navBtn ${bookModule === b ? 'navBtnActive' : ''}`}
                      onClick={() => setBookModule(b)}
                    >
                      {b.replace(' 化学反应原理', '').replace(' 物质结构与性质', '').replace(' 有机化学基础', '')}
                    </button>
                  ))}
                </div>
                <div className="row" style={{ marginTop: 0 }}>
                  <button
                    className={`navBtn ${stage === '全部' ? 'navBtnActive' : ''}`}
                    onClick={() => setStage('全部')}
                  >
                    全部
                  </button>
                  <button
                    className={`navBtn ${stage === '初中' ? 'navBtnActive' : ''}`}
                    onClick={() => setStage('初中')}
                  >
                    初中
                  </button>
                  <button
                    className={`navBtn ${stage === '高中' ? 'navBtnActive' : ''}`}
                    onClick={() => setStage('高中')}
                  >
                    高中
                  </button>
                </div>
              </div>

              {pool.length === 0 || !current ? (
                <p className="hint" style={{ marginTop: 12 }}>
                  当前筛选下没有记忆卡片，请换一册教材或把「初高中」改为「全部」。
                </p>
              ) : (
                <>
                  <div className="memoryCard">
                    <div className="memoryCardMeta">
                      <span>
                        {current.book} · {current.stage}
                      </span>
                      <span className="memoryCardKind">
                        {current.cardKind === '方程式'
                          ? '化学方程式'
                          : current.cardKind === '生物知识点'
                            ? '生物知识点'
                            : '知识点'}
                      </span>
                    </div>
                    {current.tags && current.tags.length > 0 ? (
                      <div className="memoryCardTags">
                        {current.tags.slice(0, 5).map((tag) => (
                          <span key={tag} className="memoryCardTag">
                            <span className="memoryCardTagEmoji" aria-hidden="true">
                              {pickTagEmoji(tag, current.cardKind)}
                            </span>
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="memoryCardPrompt">
                      {current.cardKind === '生物知识点' ? (
                        <span style={{ whiteSpace: 'pre-wrap' }}>{current.prompt}</span>
                      ) : (
                        <ChemText text={current.prompt} />
                      )}
                    </p>
                    {!cardRevealed ? (
                      <button type="button" className="btn" onClick={() => setCardRevealed(true)}>
                        显示答案
                      </button>
                    ) : (
                      <div className="memoryCardAnswer">
                        <div className="memoryCardAnswerLabel">
                          {current.cardKind === '方程式'
                            ? '化学方程式'
                            : current.cardKind === '生物知识点'
                              ? '生物要点'
                              : '要点'}
                        </div>
                        <div className="equationBox mono memoryCardAnswerBody">
                          {current.cardKind === '生物知识点' ? (
                            current.answer
                          ) : (
                            <ChemText text={current.answer} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="row">
                    <button type="button" className="btn btnGhost" onClick={nextMemoryCard}>
                      下一题
                    </button>
                  </div>
                  <span className="hint">
                    先回忆再点「显示答案」。加深题见标签「浙江高考」；长答案支持换行。看过答案后点「下一题」计一次复习完成。
                  </span>
                </>
              )}
            </section>

            <aside className="card">
              <h2 className="cardTitle">练习小结</h2>
              <div className="list iosList">
                <div className="pill">
                  <div>
                    <strong>题库数量</strong>
                    <span> · 当前筛选：{pool.length}</span>
                  </div>
                  <span className="mono">{pool.length}</span>
                </div>
                <div className="pill">
                  <div>
                    <strong>已答题</strong>
                    <span> · 总计</span>
                  </div>
                  <span className="mono">{stats.totalAnswered}</span>
                </div>
                <div className="pill">
                  <div>
                    <strong>正确率</strong>
                    <span> · {stats.totalCorrect}/{stats.totalAnswered}</span>
                  </div>
                  <span className="mono">{Math.round(accuracy * 100)}%</span>
                </div>
                <div className="pill">
                  <div>
                    <strong>连对</strong>
                    <span> · 最佳：{stats.bestStreak}</span>
                  </div>
                  <span className="mono">{stats.streak}</span>
                </div>
              </div>
              <div className="footer">
                数据保存在本机浏览器（localStorage），关闭页面不会丢。
              </div>
            </aside>
          </div>
        ) : null}

        {tab === '错题本' ? (
          <>
            <section className="card" style={{ gridColumn: '1 / -1' }}>
              <h2 className="cardTitle">错题本</h2>
              {wrongList.length === 0 ? (
                <p className="hint">目前还没有错题。</p>
              ) : (
                <div className="list iosList">
                  {wrongList.map((w) => (
                    <div key={w.equationId} className="pill">
                      <div style={{ minWidth: 0 }}>
                        <strong>{w.item!.prompt}</strong>
                        <div className="hint mono" style={{ marginTop: 6 }}>
                          {'equation' in w.item! ? w.item!.equation : w.item!.answer}
                        </div>
                      </div>
                      <span className="mono">错 {w.wrongCount}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="row" style={{ marginTop: 12 }}>
                <button
                  className="btn btnGhost"
                  onClick={() => {
                    setWrongMap({})
                    saveWrongMap({})
                  }}
                >
                  清空错题本
                </button>
              </div>
            </section>
          </>
        ) : null}

        {tab === '统计' ? (
          <>
            <section className="card" style={{ gridColumn: '1 / -1' }}>
              <h2 className="cardTitle">统计</h2>
              <div className="list iosList">
                <div className="pill">
                  <div>
                    <strong>总答题</strong>
                    <span> · {stats.totalAnswered} 题</span>
                  </div>
                  <span className="mono">{stats.totalAnswered}</span>
                </div>
                <div className="pill">
                  <div>
                    <strong>总正确</strong>
                    <span> · {stats.totalCorrect} 题</span>
                  </div>
                  <span className="mono">{stats.totalCorrect}</span>
                </div>
                <div className="pill">
                  <div>
                    <strong>正确率</strong>
                    <span> · {Math.round(accuracy * 100)}%</span>
                  </div>
                  <span className="mono">{Math.round(accuracy * 100)}%</span>
                </div>
                <div className="pill">
                  <div>
                    <strong>最佳连对</strong>
                    <span> · streak best</span>
                  </div>
                  <span className="mono">{stats.bestStreak}</span>
                </div>
                <div className="pill">
                  <div>
                    <strong>教材覆盖进度</strong>
                    <span>
                      {' '}
                      · {coverageSummary.current}/{coverageSummary.target}
                    </span>
                  </div>
                  <span className="mono">
                    {Math.round(coverageSummary.rate * 100)}%
                  </span>
                </div>
              </div>
              <div className="list iosList" style={{ marginTop: 10 }}>
                {coverageRows.map((row) => (
                  <div className="pill" key={`${row.book}-${row.chapter}`}>
                    <div>
                      <strong>{row.book}</strong>
                      <span>
                        {' '}
                        · {row.chapter} · 方程式 {row.equationCount}/{row.targetEquations}
                        ，知识点 {row.factCount}/{row.targetFacts}
                      </span>
                    </div>
                    <span className="mono">{Math.round(row.rate * 100)}%</span>
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <button
                  className="btn btnGhost"
                  onClick={() => {
                    const empty: QuizStats = {
                      totalAnswered: 0,
                      totalCorrect: 0,
                      streak: 0,
                      bestStreak: 0,
                    }
                    setStats(empty)
                    saveStats(empty)
                  }}
                >
                  重置统计
                </button>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <section className="checkin card">
        <div className="checkinHeader">
          <div>
            <h2 className="cardTitle" style={{ marginBottom: 2 }}>
              学习打卡
            </h2>
            <div className="hint">坚持每天 10 分钟，连续形成稳定记忆。</div>
          </div>
          <span className={`checkinStatus ${checkedToday ? 'checkinStatusDone' : ''}`}>
            {checkedToday ? '已打卡' : '待打卡'}
          </span>
        </div>
        <div className="row" style={{ marginTop: 0 }}>
          <div className="pill">
            <strong>连续</strong>
            <span className="mono">{checkinStreak} 天</span>
          </div>
          <div className="pill">
            <strong>累计</strong>
            <span className="mono">{checkins.length} 天</span>
          </div>
          <button className="btn" onClick={doCheckin} disabled={checkedToday}>
            {checkedToday ? '今日已打卡' : '今日打卡'}
          </button>
        </div>
        <div className="checkinWeek">
          {last7Days.map((d) => (
            <div key={d.key} className={`checkinDay ${d.checked ? 'checkinDayOn' : ''}`}>
              <span>{d.short}</span>
            </div>
          ))}
        </div>
        <div className="hint">{reminder}</div>
        <div className="calendar">
          <div className="calendarHeader">
            <strong>{monthData.title}</strong>
          </div>
          <div className="calendarWeek">
            <span>日</span>
            <span>一</span>
            <span>二</span>
            <span>三</span>
            <span>四</span>
            <span>五</span>
            <span>六</span>
          </div>
          <div className="calendarGrid">
            {monthData.cells.map((cell, idx) =>
              cell ? (
                <div
                  key={cell.key}
                  className={`calendarCell ${cell.checked ? 'calendarCellOn' : ''} ${
                    cell.key === today ? 'calendarCellToday' : ''
                  }`}
                >
                  {cell.day}
                </div>
              ) : (
                <div key={`empty-${idx}`} className="calendarCell calendarCellEmpty" />
              ),
            )}
          </div>
        </div>
      </section>

      <div className="footer">
        网页版 v4 · 教材模块记忆卡片 · 化学/生物均支持浅色界面。若仍看到旧版，请强制刷新（Cmd+Shift+R）。
        <br />
        题库：<span className="mono">memoryCards.ts</span>（汇总 equations / facts /{' '}
        <span className="mono">zjGaokaoCards.ts</span> 浙江高考向加深题）
      </div>
    </div>
  )
}

export default App
