'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/Providers'
import { ChevronLeft, ChevronRight, RotateCcw, History } from 'lucide-react'

// ─── PERMA-V Profiler (Butler & Kern, 2016) — 23 items ───────────────────────
// Scale: 0 = Never / Not at all, 10 = Always / Completely

type Domain = 'P' | 'E' | 'R' | 'M' | 'A' | 'N' | 'H' | 'OW' | 'OH'

interface Question {
  id: number
  domain: Domain
  text: string
  lowLabel: string
  highLabel: string
}

const QUESTIONS: Question[] = [
  // Positive Emotion
  { id: 1,  domain: 'P', text: 'How often do you feel joyful?',                                        lowLabel: 'Never',      highLabel: 'Always' },
  { id: 2,  domain: 'P', text: 'How often do you feel positive?',                                      lowLabel: 'Never',      highLabel: 'Always' },
  { id: 3,  domain: 'P', text: 'In general, how often do you feel contented?',                         lowLabel: 'Never',      highLabel: 'Always' },
  // Engagement
  { id: 4,  domain: 'E', text: 'How often do you become absorbed in what you are doing?',              lowLabel: 'Never',      highLabel: 'Always' },
  { id: 5,  domain: 'E', text: 'How often do you feel excited and interested in things?',              lowLabel: 'Never',      highLabel: 'Always' },
  { id: 6,  domain: 'E', text: 'How often do you lose track of time while doing something you enjoy?', lowLabel: 'Never',      highLabel: 'Always' },
  // Relationships
  { id: 7,  domain: 'R', text: 'To what extent do you receive help and support from others when you need it?', lowLabel: 'Not at all', highLabel: 'Completely' },
  { id: 8,  domain: 'R', text: 'To what extent do you feel loved?',                                    lowLabel: 'Not at all', highLabel: 'Completely' },
  { id: 9,  domain: 'R', text: 'How satisfied are you with your personal relationships?',              lowLabel: 'Not at all', highLabel: 'Completely' },
  // Meaning
  { id: 10, domain: 'M', text: 'In general, to what extent do you lead a purposeful and meaningful life?',          lowLabel: 'Not at all', highLabel: 'Completely' },
  { id: 11, domain: 'M', text: 'To what extent do you feel that what you do in your life is valuable and worthwhile?', lowLabel: 'Not at all', highLabel: 'Completely' },
  { id: 12, domain: 'M', text: 'In general, to what extent do you feel you have a sense of direction in your life?',  lowLabel: 'Not at all', highLabel: 'Completely' },
  // Accomplishment
  { id: 13, domain: 'A', text: 'How often do you achieve the important goals you have set for yourself?',   lowLabel: 'Never',      highLabel: 'Always' },
  { id: 14, domain: 'A', text: 'How often are you able to handle your responsibilities?',                   lowLabel: 'Never',      highLabel: 'Always' },
  { id: 15, domain: 'A', text: 'How much of the time do you feel you are making progress towards your goals?', lowLabel: 'Never',   highLabel: 'Always' },
  // Negative Emotion (reverse-scored for display)
  { id: 16, domain: 'N', text: 'How often do you feel anxious?',                                       lowLabel: 'Never',      highLabel: 'Always' },
  { id: 17, domain: 'N', text: 'How often do you feel angry?',                                         lowLabel: 'Never',      highLabel: 'Always' },
  { id: 18, domain: 'N', text: 'How often do you feel sad?',                                           lowLabel: 'Never',      highLabel: 'Always' },
  // Health / Vitality
  { id: 19, domain: 'H', text: 'In general, how would you rate your physical health?',                 lowLabel: 'Poor',       highLabel: 'Excellent' },
  { id: 20, domain: 'H', text: 'How often do you feel physically healthy and energetic?',              lowLabel: 'Never',      highLabel: 'Always' },
  { id: 21, domain: 'H', text: 'Compared to people your age, how is your overall health?',             lowLabel: 'Much worse', highLabel: 'Much better' },
  // Overall
  { id: 22, domain: 'OW', text: 'Taking everything into account, how happy would you say you are?',   lowLabel: 'Not at all', highLabel: 'Extremely' },
  { id: 23, domain: 'OH', text: 'In general, how would you rate your overall well-being?',            lowLabel: 'Poor',       highLabel: 'Excellent' },
]

const DOMAIN_META: Record<string, { label: string; color: string; description: string }> = {
  P:  { label: 'Positive Emotion', color: '#f59e0b', description: 'How often you feel joy, gratitude, and contentment.' },
  E:  { label: 'Engagement',       color: '#6366f1', description: 'How absorbed and energized you are by your activities.' },
  R:  { label: 'Relationships',    color: '#ec4899', description: 'How supported, loved, and connected you feel.' },
  M:  { label: 'Meaning',          color: '#10b981', description: 'How purposeful and worthwhile your life feels.' },
  A:  { label: 'Accomplishment',   color: '#3b82f6', description: 'How often you achieve goals and make progress.' },
  N:  { label: 'Negative Emotion', color: '#ef4444', description: 'Frequency of anxiety, anger, and sadness (lower is better).' },
  H:  { label: 'Health',           color: '#14b8a6', description: 'Your physical health and vitality.' },
}

type Scores = Record<Domain, number>

function computeScores(answers: Record<number, number>): Scores {
  const domainGroups: Record<string, number[]> = {}
  for (const q of QUESTIONS) {
    if (!domainGroups[q.domain]) domainGroups[q.domain] = []
    if (answers[q.id] !== undefined) domainGroups[q.domain].push(answers[q.id])
  }
  const result: Record<string, number> = {}
  for (const [domain, vals] of Object.entries(domainGroups)) {
    result[domain] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
  }
  return result as Scores
}

function permaScore(scores: Scores): number {
  const domains: Domain[] = ['P', 'E', 'R', 'M', 'A']
  return Math.round((domains.reduce((sum, d) => sum + (scores[d] ?? 0), 0) / 5) * 10) / 10
}

// ─── Components ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full bg-surface-secondary rounded-full h-1.5">
      <div
        className="bg-accent-primary h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  )
}

function DomainBadge({ domain }: { domain: Domain }) {
  const meta = DOMAIN_META[domain]
  if (!meta) return null
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: meta.color + '20', color: meta.color }}
    >
      {meta.label}
    </span>
  )
}

function ScoreBar({ label, score, color, description, inverted }: {
  label: string; score: number; color: string; description: string; inverted?: boolean
}) {
  const displayScore = inverted ? 10 - score : score
  const pct = (displayScore / 10) * 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-text-primary">{label}</span>
          {inverted && <span className="text-xs text-text-tertiary ml-2">(lower is better)</span>}
        </div>
        <span className="text-sm font-semibold" style={{ color }}>{inverted ? score.toFixed(1) : displayScore.toFixed(1)}<span className="text-text-tertiary font-normal">/10</span></span>
      </div>
      <div className="w-full bg-surface-secondary rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-text-tertiary">{description}</p>
    </div>
  )
}

function ScoreInterpretation({ score }: { score: number }) {
  if (score >= 8) return <span className="text-emerald-500 font-medium">Flourishing</span>
  if (score >= 6) return <span className="text-blue-500 font-medium">Doing Well</span>
  if (score >= 4) return <span className="text-amber-500 font-medium">Moderate</span>
  return <span className="text-red-500 font-medium">Needs Attention</span>
}

interface PastAssessment {
  id: string
  scores: Scores
  created_at: string
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HappinessPage() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<'intro' | 'questions' | 'results' | 'history'>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [scores, setScores] = useState<Scores | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<PastAssessment[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const q = QUESTIONS[current]
  const answered = answers[q?.id] !== undefined
  const progress = Object.keys(answers).length

  const fetchHistory = async () => {
    if (!user) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/happiness?user_id=${user.id}`)
      const data = await res.json()
      setHistory(data.assessments ?? [])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
  }

  const handleNext = () => {
    if (current < QUESTIONS.length - 1) {
      setCurrent((c) => c + 1)
    } else {
      const computed = computeScores(answers)
      setScores(computed)
      setPhase('results')
    }
  }

  const handleBack = () => {
    if (current > 0) setCurrent((c) => c - 1)
  }

  const handleSave = async () => {
    if (!user || !scores || saving || saved) return
    setSaving(true)
    try {
      await fetch('/api/happiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, answers, scores }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setAnswers({})
    setScores(null)
    setSaved(false)
    setPhase('questions')
  }

  const handleHistory = async () => {
    await fetchHistory()
    setPhase('history')
  }

  if (!user) return null

  // ── Intro ──
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-apple-xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✨</span>
          </div>
          <h1 className="text-3xl font-semibold text-text-primary mb-3">Well-being Check-in</h1>
          <p className="text-text-tertiary mb-2">
            Based on the <strong className="text-text-primary">PERMA-V Profiler</strong> (Butler &amp; Kern, 2016), a scientifically validated well-being assessment.
          </p>
          <p className="text-sm text-text-tertiary mb-8">
            23 questions across Positive Emotion, Engagement, Relationships, Meaning, Accomplishment, Negative Emotion, and Health. Takes about 5 minutes.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <button
              onClick={() => setPhase('questions')}
              className="btn-primary px-8 py-3"
            >
              Start Assessment
            </button>
            <button
              onClick={handleHistory}
              className="btn-secondary px-8 py-3 flex items-center gap-2 justify-center"
            >
              <History size={16} />
              Past Results
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Questions ──
  if (phase === 'questions') {
    const sliderValue = answers[q.id] ?? 5

    return (
      <div className="min-h-screen bg-background-primary flex flex-col">
        {/* Top bar */}
        <div className="px-6 pt-6 pb-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-tertiary">Question {current + 1} of {QUESTIONS.length}</span>
            <span className="text-sm text-text-tertiary">{Math.round((progress / QUESTIONS.length) * 100)}% complete</span>
          </div>
          <ProgressBar current={progress} total={QUESTIONS.length} />
        </div>

        {/* Question card */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            <div className="card flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <DomainBadge domain={q.domain} />
                <h2 className="text-2xl font-medium text-text-primary leading-snug">{q.text}</h2>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>{q.lowLabel}</span>
                  <span>{q.highLabel}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={sliderValue}
                  onChange={(e) => handleAnswer(Number(e.target.value))}
                  className="w-full accent-accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-xs text-text-tertiary px-0.5">
                  {Array.from({ length: 11 }, (_, i) => (
                    <span
                      key={i}
                      className={`${sliderValue === i ? 'text-accent-primary font-semibold text-sm' : ''}`}
                    >
                      {i}
                    </span>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-4xl font-bold text-accent-primary">{sliderValue}</span>
                  <span className="text-text-tertiary text-lg">/10</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  disabled={current === 0}
                  className="flex items-center gap-2 text-text-tertiary hover:text-text-primary disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="btn-primary flex items-center gap-2 px-6"
                >
                  {current === QUESTIONS.length - 1 ? 'See Results' : 'Next'}
                  {current < QUESTIONS.length - 1 && <ChevronRight size={18} />}
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

    return (
      <div className="min-h-screen bg-background-primary">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-text-primary mb-2">Your Well-being Profile</h1>
            <p className="text-text-tertiary text-sm">PERMA-V Assessment Results</p>
          </div>

          {/* Overall PERMA score */}
          <div className="card mb-6 text-center">
            <p className="text-sm text-text-tertiary mb-1">Overall PERMA Score</p>
            <div className="text-6xl font-bold text-accent-primary mb-2">{perma}</div>
            <div className="text-lg"><ScoreInterpretation score={perma} /></div>
            <p className="text-xs text-text-tertiary mt-2">Average of Positive Emotion, Engagement, Relationships, Meaning &amp; Accomplishment</p>
          </div>

          {/* PERMA domains */}
          <div className="card mb-6 flex flex-col gap-5">
            <h2 className="font-semibold text-text-primary">PERMA Domains</h2>
            {(['P', 'E', 'R', 'M', 'A'] as Domain[]).map((d) => {
              const meta = DOMAIN_META[d]
              return (
                <ScoreBar
                  key={d}
                  label={meta.label}
                  score={scores[d] ?? 0}
                  color={meta.color}
                  description={meta.description}
                />
              )
            })}
          </div>

          {/* Health & Negative Emotion */}
          <div className="card mb-6 flex flex-col gap-5">
            <h2 className="font-semibold text-text-primary">Additional Dimensions</h2>
            <ScoreBar
              label={DOMAIN_META['H'].label}
              score={scores['H'] ?? 0}
              color={DOMAIN_META['H'].color}
              description={DOMAIN_META['H'].description}
            />
            <ScoreBar
              label={DOMAIN_META['N'].label}
              score={scores['N'] ?? 0}
              color={DOMAIN_META['N'].color}
              description={DOMAIN_META['N'].description}
              inverted
            />
          </div>

          {/* Overall items */}
          <div className="card mb-8 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-surface-secondary rounded-apple-lg">
              <p className="text-2xl font-bold text-text-primary">{(scores['OW'] ?? 0).toFixed(1)}</p>
              <p className="text-xs text-text-tertiary mt-1">Overall Happiness</p>
            </div>
            <div className="text-center p-4 bg-surface-secondary rounded-apple-lg">
              <p className="text-2xl font-bold text-text-primary">{(scores['OH'] ?? 0).toFixed(1)}</p>
              <p className="text-xs text-text-tertiary mt-1">Overall Well-being</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="btn-primary px-8 py-3 disabled:opacity-60"
            >
              {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Results'}
            </button>
            <button onClick={handleRestart} className="btn-secondary px-8 py-3 flex items-center gap-2 justify-center">
              <RotateCcw size={16} />
              Retake
            </button>
            <button onClick={handleHistory} className="btn-secondary px-8 py-3 flex items-center gap-2 justify-center">
              <History size={16} />
              History
            </button>
          </div>

          <p className="text-center text-xs text-text-tertiary mt-6">
            Butler, J. &amp; Kern, M. L. (2016). The PERMA-Profiler: A brief multidimensional measure of flourishing. <em>International Journal of Wellbeing</em>, 6(3), 1–48.
          </p>
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
            <h1 className="text-2xl font-semibold text-text-primary">Assessment History</h1>
          </div>

          {loadingHistory && <p className="text-text-tertiary text-center py-12">Loading...</p>}

          {!loadingHistory && history.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-tertiary mb-4">No assessments yet.</p>
              <button onClick={() => setPhase('intro')} className="btn-primary px-6">Take your first assessment</button>
            </div>
          )}

          {!loadingHistory && history.length > 0 && (
            <div className="flex flex-col gap-4">
              {history.map((item) => {
                const s = item.scores as Scores
                const p = permaScore(s)
                const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                return (
                  <div key={item.id} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-text-tertiary">{date}</span>
                      <div>
                        <span className="text-xl font-bold text-accent-primary mr-1">{p}</span>
                        <span className="text-text-tertiary text-sm">/10</span>
                        <span className="ml-2 text-sm"><ScoreInterpretation score={p} /></span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {(['P', 'E', 'R', 'M', 'A'] as Domain[]).map((d) => {
                        const meta = DOMAIN_META[d]
                        return (
                          <div key={d} className="text-center">
                            <div
                              className="text-xs font-bold mb-1"
                              style={{ color: meta.color }}
                            >
                              {d}
                            </div>
                            <div className="text-sm font-semibold text-text-primary">{(s[d] ?? 0).toFixed(1)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <button onClick={handleRestart} className="btn-primary px-8 py-3">Take New Assessment</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
