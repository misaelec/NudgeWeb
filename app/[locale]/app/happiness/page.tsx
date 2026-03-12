'use client'

import { useState } from 'react'
import { useAuth } from '@/components/Providers'
import { supabaseAuth } from '@/lib/auth'
import { ProGate } from '@/components/ProGate'
import { useSubscriptionStore } from '@/lib/subscriptionStore'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, RotateCcw, History } from 'lucide-react'

type Domain = 'P' | 'E' | 'R' | 'M' | 'A' | 'N' | 'H' | 'OW' | 'OH'

type ScaleKey = 'never' | 'always' | 'notAtAll' | 'completely' | 'poor' | 'excellent' | 'muchWorse' | 'muchBetter' | 'notHappy' | 'extremelyHappy'

interface QuestionDef {
  id: number
  domain: Domain
  lowKey: ScaleKey
  highKey: ScaleKey
}

const QUESTION_DEFS: QuestionDef[] = [
  { id: 1,  domain: 'P',  lowKey: 'never',    highKey: 'always'       },
  { id: 2,  domain: 'P',  lowKey: 'never',    highKey: 'always'       },
  { id: 3,  domain: 'P',  lowKey: 'never',    highKey: 'always'       },
  { id: 4,  domain: 'E',  lowKey: 'never',    highKey: 'always'       },
  { id: 5,  domain: 'E',  lowKey: 'never',    highKey: 'always'       },
  { id: 6,  domain: 'E',  lowKey: 'never',    highKey: 'always'       },
  { id: 7,  domain: 'R',  lowKey: 'notAtAll', highKey: 'completely'   },
  { id: 8,  domain: 'R',  lowKey: 'notAtAll', highKey: 'completely'   },
  { id: 9,  domain: 'R',  lowKey: 'notAtAll', highKey: 'completely'   },
  { id: 10, domain: 'M',  lowKey: 'notAtAll', highKey: 'completely'   },
  { id: 11, domain: 'M',  lowKey: 'notAtAll', highKey: 'completely'   },
  { id: 12, domain: 'M',  lowKey: 'notAtAll', highKey: 'completely'   },
  { id: 13, domain: 'A',  lowKey: 'never',    highKey: 'always'       },
  { id: 14, domain: 'A',  lowKey: 'never',    highKey: 'always'       },
  { id: 15, domain: 'A',  lowKey: 'never',    highKey: 'always'       },
  { id: 16, domain: 'N',  lowKey: 'never',    highKey: 'always'       },
  { id: 17, domain: 'N',  lowKey: 'never',    highKey: 'always'       },
  { id: 18, domain: 'N',  lowKey: 'never',    highKey: 'always'       },
  { id: 19, domain: 'H',  lowKey: 'poor',     highKey: 'excellent'    },
  { id: 20, domain: 'H',  lowKey: 'never',    highKey: 'always'       },
  { id: 21, domain: 'H',  lowKey: 'muchWorse',highKey: 'muchBetter'   },
  { id: 22, domain: 'OW', lowKey: 'notHappy', highKey: 'extremelyHappy' },
  { id: 23, domain: 'OH', lowKey: 'poor',     highKey: 'excellent'    },
]

const DOMAIN_COLORS: Record<string, string> = {
  P: '#f59e0b', E: '#6366f1', R: '#ec4899',
  M: '#10b981', A: '#3b82f6', N: '#ef4444', H: '#14b8a6',
}

type Scores = Record<Domain, number>

function computeScores(answers: Record<number, number>): Scores {
  const groups: Record<string, number[]> = {}
  for (const q of QUESTION_DEFS) {
    if (!groups[q.domain]) groups[q.domain] = []
    if (answers[q.id] !== undefined) groups[q.domain].push(answers[q.id])
  }
  const result: Record<string, number> = {}
  for (const [domain, vals] of Object.entries(groups)) {
    result[domain] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
  }
  return result as Scores
}

function permaScore(scores: Scores): number {
  const domains: Domain[] = ['P', 'E', 'R', 'M', 'A']
  return Math.round((domains.reduce((sum, d) => sum + (scores[d] ?? 0), 0) / 5) * 10) / 10
}

interface PastAssessment { id: string; scores: Scores; created_at: string }

export default function HappinessPage() {
  const { user } = useAuth()
  const { plan, status: subStatus, loading: subLoading } = useSubscriptionStore()
  const t = useTranslations('happiness')
  const tr = useTranslations('happiness.results')
  const th = useTranslations('happiness.history')
  const ts = useTranslations('happiness.scale')
  const tc = useTranslations('common')

  const [phase, setPhase] = useState<'intro' | 'questions' | 'results' | 'history'>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [scores, setScores] = useState<Scores | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<PastAssessment[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const q = QUESTION_DEFS[current]
  const progress = Object.keys(answers).length

  const fetchHistory = async () => {
    if (!user) return
    setLoadingHistory(true)
    try {
      const token = supabaseAuth.currentAccessToken
      const res = await fetch('/api/happiness', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setHistory(data.assessments ?? [])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
  }

  const handleNext = async () => {
    if (current < QUESTION_DEFS.length - 1) {
      setCurrent((c) => c + 1)
    } else {
      const updatedAnswers = { ...answers, [q.id]: answers[q.id] ?? 5 }
      const computed = computeScores(updatedAnswers)
      setScores(computed)
      setPhase('results')
      if (user) {
        setSaving(true)
        try {
          const token = supabaseAuth.currentAccessToken
          await fetch('/api/happiness', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ answers: updatedAnswers, scores: computed }),
          })
          setSaved(true)
        } finally {
          setSaving(false)
        }
      }
    }
  }

  const handleBack = () => { if (current > 0) setCurrent((c) => c - 1) }

  const handleRestart = () => {
    setCurrent(0); setAnswers({}); setScores(null); setSaved(false); setPhase('questions')
  }

  const handleHistory = async () => { await fetchHistory(); setPhase('history') }

  const scoreInterpretation = (score: number) => {
    if (score >= 8) return <span className="text-emerald-500 font-medium">{tr('flourishing')}</span>
    if (score >= 6) return <span className="text-blue-500 font-medium">{tr('doingWell')}</span>
    if (score >= 4) return <span className="text-amber-500 font-medium">{tr('moderate')}</span>
    return <span className="text-red-500 font-medium">{tr('needsAttention')}</span>
  }

  if (!user) return null

  const isPro = plan === 'pro' && (subStatus === 'active' || subStatus === 'trialing')
  if (!subLoading && !isPro) return <ProGate>{null}</ProGate>

  // ── Intro ──
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-apple-xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✨</span>
          </div>
          <h1 className="text-3xl font-semibold text-text-primary mb-3">{t('title')}</h1>
          <p className="text-text-tertiary mb-2">
            {t('subtitle')}
          </p>
          <p className="text-sm text-text-tertiary mb-8">{t('description')}</p>
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <button onClick={() => setPhase('questions')} className="btn-primary px-8 py-3">
              {t('start')}
            </button>
            <button onClick={handleHistory} className="btn-secondary px-8 py-3 flex items-center gap-2 justify-center">
              <History size={16} />
              {t('pastResults')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Questions ──
  if (phase === 'questions') {
    const sliderValue = answers[q.id] ?? 5
    const domainMeta = t.raw('domains') as Record<string, { label: string }>
    const domainLabel = DOMAIN_COLORS[q.domain] ? domainMeta[q.domain]?.label : null

    return (
      <div className="min-h-screen bg-background-primary flex flex-col">
        <div className="px-6 pt-6 pb-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-tertiary">{t('question', { current: current + 1, total: QUESTION_DEFS.length })}</span>
            <span className="text-sm text-text-tertiary">{t('percentComplete', { percent: Math.round((progress / QUESTION_DEFS.length) * 100) })}</span>
          </div>
          <div className="w-full bg-surface-secondary rounded-full h-1.5">
            <div className="bg-accent-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${(progress / QUESTION_DEFS.length) * 100}%` }} />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            <div className="card flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                {domainLabel && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full w-fit"
                    style={{ backgroundColor: DOMAIN_COLORS[q.domain] + '20', color: DOMAIN_COLORS[q.domain] }}>
                    {domainLabel}
                  </span>
                )}
                <h2 className="text-2xl font-medium text-text-primary leading-snug">
                  {(t.raw('questions') as Record<string, string>)[String(q.id)]}
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>{ts(q.lowKey)}</span>
                  <span>{ts(q.highKey)}</span>
                </div>
                <input type="range" min={0} max={10} step={1} value={sliderValue}
                  onChange={(e) => handleAnswer(Number(e.target.value))}
                  className="w-full accent-accent-primary cursor-pointer" />
                <div className="flex justify-between text-xs text-text-tertiary px-0.5">
                  {Array.from({ length: 11 }, (_, i) => (
                    <span key={i} className={sliderValue === i ? 'text-accent-primary font-semibold text-sm' : ''}>{i}</span>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-4xl font-bold text-accent-primary">{sliderValue}</span>
                  <span className="text-text-tertiary text-lg">/10</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={handleBack} disabled={current === 0}
                  className="flex items-center gap-2 text-text-tertiary hover:text-text-primary disabled:opacity-30 transition-colors">
                  <ChevronLeft size={18} />
                  {tc('back')}
                </button>
                <button onClick={handleNext} className="btn-primary flex items-center gap-2 px-6">
                  {current === QUESTION_DEFS.length - 1 ? t('seeResults') : tc('next')}
                  {current < QUESTION_DEFS.length - 1 && <ChevronRight size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Results ──
  if (phase === 'results' && scores) {
    const perma = permaScore(scores)
    const domains = t.raw('domains') as Record<string, { label: string; description: string }>

    return (
      <div className="min-h-screen bg-background-primary">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-text-primary mb-2">{tr('title')}</h1>
            <p className="text-text-tertiary text-sm">{tr('subtitle')}</p>
          </div>

          <div className="card mb-6 text-center">
            <p className="text-sm text-text-tertiary mb-1">{tr('overallPerma')}</p>
            <div className="text-6xl font-bold text-accent-primary mb-2">{perma}</div>
            <div className="text-lg">{scoreInterpretation(perma)}</div>
            <p className="text-xs text-text-tertiary mt-2">{tr('overallPERMADesc')}</p>
          </div>

          <div className="card mb-6 flex flex-col gap-5">
            <h2 className="font-semibold text-text-primary">{tr('permaTitle')}</h2>
            {(['P', 'E', 'R', 'M', 'A'] as Domain[]).map((d) => {
              const meta = domains[d]
              const score = scores[d] ?? 0
              const pct = (score / 10) * 100
              return (
                <div key={d} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{meta.label}</span>
                    <span className="text-sm font-semibold" style={{ color: DOMAIN_COLORS[d] }}>{score.toFixed(1)}<span className="text-text-tertiary font-normal">/10</span></span>
                  </div>
                  <div className="w-full bg-surface-secondary rounded-full h-2.5">
                    <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: DOMAIN_COLORS[d] }} />
                  </div>
                  <p className="text-xs text-text-tertiary">{meta.description}</p>
                </div>
              )
            })}
          </div>

          <div className="card mb-6 flex flex-col gap-5">
            <h2 className="font-semibold text-text-primary">{tr('additionalTitle')}</h2>
            {(['H', 'N'] as Domain[]).map((d) => {
              const meta = domains[d]
              const score = scores[d] ?? 0
              const inverted = d === 'N'
              const displayScore = inverted ? 10 - score : score
              return (
                <div key={d} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-text-primary">{meta.label}</span>
                      {inverted && <span className="text-xs text-text-tertiary ml-2">{tr('lowerIsBetter')}</span>}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: DOMAIN_COLORS[d] }}>{score.toFixed(1)}<span className="text-text-tertiary font-normal">/10</span></span>
                  </div>
                  <div className="w-full bg-surface-secondary rounded-full h-2.5">
                    <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${(displayScore / 10) * 100}%`, backgroundColor: DOMAIN_COLORS[d] }} />
                  </div>
                  <p className="text-xs text-text-tertiary">{meta.description}</p>
                </div>
              )
            })}
          </div>

          <div className="card mb-8 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-surface-secondary rounded-apple-lg">
              <p className="text-2xl font-bold text-text-primary">{(scores['OW'] ?? 0).toFixed(1)}</p>
              <p className="text-xs text-text-tertiary mt-1">{tr('overallHappiness')}</p>
            </div>
            <div className="text-center p-4 bg-surface-secondary rounded-apple-lg">
              <p className="text-2xl font-bold text-text-primary">{(scores['OH'] ?? 0).toFixed(1)}</p>
              <p className="text-xs text-text-tertiary mt-1">{tr('overallWellbeing')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            {saving && <p className="text-sm text-text-tertiary self-center">{t('savingResults')}</p>}
            {saved && <p className="text-sm text-emerald-500 self-center">{t('resultsSaved')}</p>}
            <button onClick={handleRestart} className="btn-secondary px-8 py-3 flex items-center gap-2 justify-center">
              <RotateCcw size={16} />{tr('retake')}
            </button>
            <button onClick={handleHistory} className="btn-secondary px-8 py-3 flex items-center gap-2 justify-center">
              <History size={16} />{tr('history')}
            </button>
          </div>

          <p className="text-center text-xs text-text-tertiary mt-6">{tr('citation')}</p>
        </div>
      </div>
    )
  }

  // ── History ──
  if (phase === 'history') {
    return (
      <div className="min-h-screen bg-background-primary">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setPhase('intro')} className="text-text-tertiary hover:text-text-primary transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold text-text-primary">{th('title')}</h1>
          </div>

          {loadingHistory && <p className="text-text-tertiary text-center py-12">{tc('loading')}</p>}

          {!loadingHistory && history.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-tertiary mb-4">{th('empty')}</p>
              <button onClick={() => setPhase('intro')} className="btn-primary px-6">{th('firstAssessment')}</button>
            </div>
          )}

          {!loadingHistory && history.length > 0 && (
            <div className="flex flex-col gap-4">
              {history.map((item) => {
                const s = item.scores as Scores
                const p = permaScore(s)
                const date = new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                return (
                  <div key={item.id} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-text-tertiary">{date}</span>
                      <div>
                        <span className="text-xl font-bold text-accent-primary mr-1">{p}</span>
                        <span className="text-text-tertiary text-sm">/10</span>
                        <span className="ml-2 text-sm">{scoreInterpretation(p)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {(['P', 'E', 'R', 'M', 'A'] as Domain[]).map((d) => (
                        <div key={d} className="text-center">
                          <div className="text-xs font-bold mb-1" style={{ color: DOMAIN_COLORS[d] }}>{d}</div>
                          <div className="text-sm font-semibold text-text-primary">{(s[d] ?? 0).toFixed(1)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <button onClick={handleRestart} className="btn-primary px-8 py-3">{th('takeNew')}</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
