'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/Providers'
import { useStore } from '@/lib/store'
import { ProGate } from '@/components/ProGate'
import {
  Plus,
  BookOpen,
  Target,
  AlertTriangle,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Calendar,
  X,
  TrendingUp,
  Clock,
  Brain
} from 'lucide-react'
import { format } from 'date-fns'

type Tab = 'journal' | 'objectives' | 'fears'

export default function JournalPage() {
  const t = useTranslations('journal')
  const { user, loading } = useAuth()
  const { objectiveActions, fearActions, journalActions, featureFlags } = useStore()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('objectives')
  const [showAddObjective, setShowAddObjective] = useState(false)
  const [showAddFear, setShowAddFear] = useState(false)
  const [showAddEntry, setShowAddEntry] = useState(false)

  const [newObjective, setNewObjective] = useState({
    title: '',
    description: '',
    category: 'personal' as 'work' | 'personal' | 'health' | 'learning',
    priority: 'medium' as 'high' | 'medium' | 'low'
  })

  const [newFear, setNewFear] = useState({
    fear: '',
    why: '',
    prevention: '',
    repair: ''
  })

  const [newEntry, setNewEntry] = useState({
    content: '',
    mood: ''
  })

  const { objectives, fearObjectives, journalEntries } = useStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-apple-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-apple-blue/20 rounded-apple-xl animate-pulse" />
          <p className="text-apple-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const handleAddObjective = () => {
    if (!newObjective.title.trim()) return
    objectiveActions.addObjective(newObjective)
    setShowAddObjective(false)
    setNewObjective({ title: '', description: '', category: 'personal', priority: 'medium' })
  }

  const handleAddFear = () => {
    if (!newFear.fear.trim()) return
    fearActions.addFearObjective({
      fear: newFear.fear,
      why: newFear.why,
      prevention: newFear.prevention,
      repair: newFear.repair,
      status: 'active'
    })
    setShowAddFear(false)
    setNewFear({ fear: '', why: '', prevention: '', repair: '' })
  }

  const handleAddEntry = () => {
    if (!newEntry.content.trim()) return
    journalActions.addEntry({
      content: newEntry.content,
      mood: newEntry.mood,
      tags: []
    })
    setShowAddEntry(false)
    setNewEntry({ content: '', mood: '' })
  }

  return (
    <ProGate>
    <div className="min-h-screen bg-apple-gray-50 dark:bg-apple-gray-950">
      

      
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-apple-gray-900 dark:text-white mb-2">
              {t('title')}
            </h1>
            <p className="text-apple-gray-500">{t('subtitle')}</p>
          </header>

          <div className="flex gap-2 mb-6">
            {[
              { id: 'objectives', icon: Target, label: t('tabObjectives') },
              { id: 'fears', icon: AlertTriangle, label: t('tabFears') },
              { id: 'journal', icon: BookOpen, label: t('tabJournal') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-apple-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-apple-blue text-white'
                    : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-600 dark:text-apple-gray-400 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'objectives' && (
            <ObjectivesTab
              objectives={objectives}
              showAddModal={showAddObjective}
              setShowAddModal={setShowAddObjective}
              newObjective={newObjective}
              setNewObjective={setNewObjective}
              onAdd={handleAddObjective}
              onDelete={(id: string) => objectiveActions.deleteObjective(id)}
              onUpdate={(id: string, updates: any) => objectiveActions.updateObjective(id, updates)}
              onAddKeyResult={(id: string, kr: any) => objectiveActions.addKeyResult(id, kr)}
              onToggleKeyResult={(objId: string, krId: string) => objectiveActions.toggleKeyResult(objId, krId)}
            />
          )}

          {activeTab === 'fears' && (
            <FearsTab
              fears={fearObjectives}
              showAddModal={showAddFear}
              setShowAddModal={setShowAddFear}
              newFear={newFear}
              setNewFear={setNewFear}
              onAdd={handleAddFear}
              onDelete={(id: string) => fearActions.deleteFearObjective(id)}
              onUpdateStatus={(id: string, status: string) => fearActions.updateFearObjective(id, { status: status as any })}
              onToggleActionStep={(fearId: string, stepId: string) => fearActions.toggleActionStep(fearId, stepId)}
              onAddActionStep={(fearId: string, step: any) => fearActions.addActionStep(fearId, step)}
              onAddReflection={(fearId: string, ref: any) => fearActions.addReflection(fearId, ref)}
            />
          )}

          {activeTab === 'journal' && (
            <JournalTab
              entries={journalEntries}
              showAddModal={showAddEntry}
              setShowAddModal={setShowAddEntry}
              newEntry={newEntry}
              setNewEntry={setNewEntry}
              onAdd={handleAddEntry}
              onDelete={(id: string) => journalActions.deleteEntry(id)}
            />
          )}
        </div>

    </div>
    </ProGate>
  )
}

function ObjectivesTab({ objectives, showAddModal, setShowAddModal, newObjective, setNewObjective, onAdd, onDelete, onUpdate, onAddKeyResult, onToggleKeyResult }: any) {
  const t = useTranslations('journal')
  const tc = useTranslations('common')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newKeyResult, setNewKeyResult] = useState('')

  const handleAddKeyResult = (objectiveId: string) => {
    if (!newKeyResult.trim()) return
    onAddKeyResult(objectiveId, { title: newKeyResult, completed: false, progress: 0 })
    setNewKeyResult('')
  }

  const categoryColors: Record<string, string> = {
    work: 'bg-accent-secondary/10 text-accent-secondary',
    personal: 'bg-success/10 text-success',
    health: 'bg-action-warning/10 text-action-warning',
    learning: 'bg-purple-500/10 text-purple-500'
  }

  const priorityColors: Record<string, string> = {
    high: 'bg-action-danger/10 text-action-danger',
    medium: 'bg-action-warning/10 text-action-warning',
    low: 'bg-success/10 text-success'
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2 inline" />
          {t('addObjective')}
        </button>
      </div>

      {objectives.length > 0 ? (
        <div className="space-y-4">
          {objectives.map((obj: any) => (
            <div key={obj.id} className="card">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => onUpdate(obj.id, { completed: !obj.completed })}
                  className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    obj.completed
                      ? 'bg-apple-green border-apple-green'
                      : 'border-apple-gray-300 dark:border-apple-gray-600 hover:border-apple-blue'
                  }`}
                >
                  {obj.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`font-semibold text-lg ${obj.completed ? 'line-through text-apple-gray-400' : 'text-apple-gray-900 dark:text-white'}`}>
                        {obj.title}
                      </h4>
                      {obj.description && (
                        <p className="text-sm text-apple-gray-500 mt-1">{obj.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[obj.category]}`}>
                        {obj.category}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[obj.priority]}`}>
                        {obj.priority}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-apple-gray-500">{t('progress')}</span>
                        <span className="font-medium text-apple-gray-900 dark:text-white">{obj.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-apple-gray-100 dark:bg-apple-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-apple-blue rounded-full transition-all duration-500"
                          style={{ width: `${obj.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
                      className="p-2 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 rounded-apple-lg transition-colors"
                    >
                      <ChevronRight className={`w-5 h-5 text-apple-gray-400 transition-transform ${expandedId === obj.id ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {expandedId === obj.id && (
                    <div className="mt-4 pt-4 border-t border-apple-gray-100 dark:border-apple-gray-800 animate-slide-down">
                      <h5 className="text-sm font-medium text-apple-gray-900 dark:text-white mb-3">{t('keyResults')}</h5>
                      {obj.keyResults && obj.keyResults.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {obj.keyResults.map((kr: any) => (
                            <div key={kr.id} className="flex items-center gap-3 p-3 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-apple-lg">
                              <button
                                onClick={() => onToggleKeyResult(obj.id, kr.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  kr.completed
                                    ? 'bg-apple-green border-apple-green'
                                    : 'border-apple-gray-300 dark:border-apple-gray-600'
                                }`}
                              >
                                {kr.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </button>
                              <span className={`flex-1 ${kr.completed ? 'line-through text-apple-gray-400' : 'text-apple-gray-900 dark:text-white'}`}>
                                {kr.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-apple-gray-400 mb-4">{t('noKeyResults')}</p>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newKeyResult}
                          onChange={e => setNewKeyResult(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddKeyResult(obj.id)}
                          placeholder={t('addKeyResultPlaceholder')}
                          className="input flex-1"
                        />
                        <button
                          onClick={() => handleAddKeyResult(obj.id)}
                          className="btn-primary"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onDelete(obj.id)}
                  className="p-2 text-text-tertiary hover:text-action-danger hover:bg-action-danger/10 rounded-apple-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Target className="w-16 h-16 mx-auto mb-4 text-apple-gray-300" />
          <h3 className="text-lg font-medium text-apple-gray-900 dark:text-white mb-2">{t('noObjectivesTitle')}</h3>
          <p className="text-apple-gray-500 mb-4">{t('noObjectivesDesc')}</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">{t('addObjective')}</button>
        </div>
      )}

      {showAddModal && (
        <Modal title={t('objModalTitle')} onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('objFieldTitle')}</label>
              <input
                type="text"
                value={newObjective.title}
                onChange={e => setNewObjective({ ...newObjective, title: e.target.value })}
                className="input"
                placeholder={t('objFieldTitlePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('objFieldDesc')}</label>
              <textarea
                value={newObjective.description}
                onChange={e => setNewObjective({ ...newObjective, description: e.target.value })}
                className="input"
                rows={2}
                placeholder={t('objFieldDescPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">{t('objFieldCategory')}</label>
                <select
                  value={newObjective.category}
                  onChange={e => setNewObjective({ ...newObjective, category: e.target.value as any })}
                  className="input"
                >
                  <option value="work">{t('catWork')}</option>
                  <option value="personal">{t('catPersonal')}</option>
                  <option value="health">{t('catHealth')}</option>
                  <option value="learning">{t('catLearning')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">{t('objFieldPriority')}</label>
                <select
                  value={newObjective.priority}
                  onChange={e => setNewObjective({ ...newObjective, priority: e.target.value as any })}
                  className="input"
                >
                  <option value="high">{t('prioHigh')}</option>
                  <option value="medium">{t('prioMedium')}</option>
                  <option value="low">{t('prioLow')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">{tc('cancel')}</button>
              <button onClick={onAdd} className="btn-primary flex-1">{t('addObjective')}</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function FearsTab({ fears, showAddModal, setShowAddModal, newFear, setNewFear, onAdd, onDelete, onUpdateStatus, onToggleActionStep, onAddActionStep, onAddReflection }: any) {
  const t = useTranslations('journal')
  const tc = useTranslations('common')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newActionStep, setNewActionStep] = useState('')
  const [showReflection, setShowReflection] = useState<string | null>(null)
  const [reflection, setReflection] = useState({ question: '', answer: '' })

  const handleAddActionStep = (fearId: string) => {
    if (!newActionStep.trim()) return
    onAddActionStep(fearId, { title: newActionStep, completed: false })
    setNewActionStep('')
  }

  const handleAddReflection = (fearId: string) => {
    if (!reflection.answer.trim()) return
    onAddReflection(fearId, reflection)
    setReflection({ question: '', answer: '' })
    setShowReflection(null)
  }

  const statusColors: Record<string, string> = {
    active: 'bg-action-warning/10 text-action-warning',
    resolved: 'bg-success/10 text-success',
    abandoned: 'bg-text-tertiary/10 text-text-tertiary'
  }

  const reflectionQuestions = [
    t('rq1'), t('rq2'), t('rq3'), t('rq4'), t('rq5')
  ]

  return (
    <>
      <div className="flex justify-end mb-6">
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2 inline" />
          {t('addFear')}
        </button>
      </div>

      {fears.length > 0 ? (
        <div className="space-y-4">
          {fears.map((fear: any) => (
            <div key={fear.id} className="card">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-action-warning/10 rounded-apple-lg">
                  <Brain className="w-5 h-5 text-action-warning" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-lg text-apple-gray-900 dark:text-white">{fear.fear}</h4>
                      <p className="text-sm text-apple-gray-500 mt-1">{t('why')} {fear.why}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={fear.status}
                        onChange={e => onUpdateStatus(fear.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-full border-0 bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-300 cursor-pointer"
                      >
                        <option value="active">{t('statusActive')}</option>
                        <option value="resolved">{t('statusResolved')}</option>
                        <option value="abandoned">{t('statusAbandoned')}</option>
                      </select>
                      <button
                        onClick={() => onDelete(fear.id)}
                        className="p-1.5 text-apple-gray-400 hover:text-apple-red hover:bg-apple-red/10 rounded-apple-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-apple-green/5 rounded-apple-lg">
                      <p className="text-xs font-medium text-apple-green mb-1">{t('prevention')}</p>
                      <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">{fear.prevention || t('notSet')}</p>
                    </div>
                    <div className="p-3 bg-apple-blue/5 rounded-apple-lg">
                      <p className="text-xs font-medium text-apple-blue mb-1">{t('repairPlan')}</p>
                      <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">{fear.repair || t('notSet')}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedId(expandedId === fear.id ? null : fear.id)}
                    className="mt-4 text-sm text-apple-blue font-medium hover:underline flex items-center gap-1"
                  >
                    {expandedId === fear.id ? t('hideSteps') : t('showSteps')}
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedId === fear.id ? 'rotate-90' : ''}`} />
                  </button>

                  {expandedId === fear.id && (
                    <div className="mt-4 pt-4 border-t border-apple-gray-100 dark:border-apple-gray-800 animate-slide-down">
                      <h5 className="text-sm font-medium text-apple-gray-900 dark:text-white mb-3">{t('actionSteps')}</h5>
                      {fear.actionSteps && fear.actionSteps.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {fear.actionSteps.map((step: any) => (
                            <div key={step.id} className="flex items-center gap-3 p-3 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-apple-lg">
                              <button
                                onClick={() => onToggleActionStep(fear.id, step.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  step.completed
                                    ? 'bg-apple-green border-apple-green'
                                    : 'border-apple-gray-300 dark:border-apple-gray-600'
                                }`}
                              >
                                {step.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </button>
                              <span className={`flex-1 ${step.completed ? 'line-through text-apple-gray-400' : 'text-apple-gray-900 dark:text-white'}`}>
                                {step.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-apple-gray-400 mb-4">{t('noActionSteps')}</p>
                      )}

                      <div className="flex gap-2 mb-6">
                        <input
                          type="text"
                          value={newActionStep}
                          onChange={e => setNewActionStep(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddActionStep(fear.id)}
                          placeholder={t('addActionStepPlaceholder')}
                          className="input flex-1"
                        />
                        <button
                          onClick={() => handleAddActionStep(fear.id)}
                          className="btn-primary"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-apple-gray-900 dark:text-white">{t('reflections')}</h5>
                        <button
                          onClick={() => setShowReflection(showReflection === fear.id ? null : fear.id)}
                          className="text-xs text-apple-blue font-medium hover:underline"
                        >
                          {showReflection === fear.id ? t('cancelReflection') : t('addReflection')}
                        </button>
                      </div>

                      {showReflection === fear.id && (
                        <div className="mb-4 p-4 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-apple-lg animate-slide-down">
                          <select
                            value={reflection.question}
                            onChange={e => setReflection({ ...reflection, question: e.target.value })}
                            className="input mb-3"
                          >
                            <option value="">{t('selectQuestion')}</option>
                            {reflectionQuestions.map(q => (
                              <option key={q} value={q}>{q}</option>
                            ))}
                          </select>
                          <textarea
                            value={reflection.answer}
                            onChange={e => setReflection({ ...reflection, answer: e.target.value })}
                            className="input mb-3"
                            rows={2}
                            placeholder={t('yourReflection')}
                          />
                          <button onClick={() => handleAddReflection(fear.id)} className="btn-primary text-sm">
                            {t('addReflection')}
                          </button>
                        </div>
                      )}

                      {fear.reflections && fear.reflections.length > 0 && (
                        <div className="space-y-3">
                          {fear.reflections.map((ref: any) => (
                            <div key={ref.id} className="p-3 bg-purple-500/5 rounded-apple-lg">
                              <p className="text-xs font-medium text-purple-500 mb-1">{ref.question}</p>
                              <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">{ref.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-action-warning/50" />
          <h3 className="text-lg font-medium text-apple-gray-900 dark:text-white mb-2">{t('noFearsTitle')}</h3>
          <p className="text-apple-gray-500 mb-4">{t('noFearsDesc')}</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">{t('addFear')}</button>
        </div>
      )}

      {showAddModal && (
        <Modal title={t('fearModalTitle')} onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('fearFieldFear')}</label>
              <input
                type="text"
                value={newFear.fear}
                onChange={e => setNewFear({ ...newFear, fear: e.target.value })}
                className="input"
                placeholder={t('fearFieldFearPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('fearFieldWhy')}</label>
              <textarea
                value={newFear.why}
                onChange={e => setNewFear({ ...newFear, why: e.target.value })}
                className="input"
                rows={2}
                placeholder={t('fearFieldWhyPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('fearFieldPrevention')}</label>
              <textarea
                value={newFear.prevention}
                onChange={e => setNewFear({ ...newFear, prevention: e.target.value })}
                className="input"
                rows={2}
                placeholder={t('fearFieldPreventionPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('fearFieldRepair')}</label>
              <textarea
                value={newFear.repair}
                onChange={e => setNewFear({ ...newFear, repair: e.target.value })}
                className="input"
                rows={2}
                placeholder={t('fearFieldRepairPlaceholder')}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">{tc('cancel')}</button>
              <button onClick={onAdd} className="btn-primary flex-1">{t('addFear')}</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function JournalTab({ entries, showAddModal, setShowAddModal, newEntry, setNewEntry, onAdd, onDelete }: any) {
  const t = useTranslations('journal')
  const tc = useTranslations('common')
  const moods = [
    { emoji: '😊', label: 'Great' },
    { emoji: '🙂', label: 'Good' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '😔', label: 'Not great' },
    { emoji: '😢', label: 'Bad' }
  ]

  return (
    <>
      <div className="flex justify-end mb-6">
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2 inline" />
          {t('addEntryBtn')}
        </button>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry: any) => (
            <div key={entry.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{entry.mood || '😐'}</span>
                  <div>
                    <p className="text-sm font-medium text-apple-gray-900 dark:text-white">
                      {format(new Date(entry.createdAt), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-xs text-apple-gray-500">
                      {format(new Date(entry.createdAt), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-2 text-text-tertiary hover:text-action-danger hover:bg-action-danger/10 rounded-apple-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-apple-gray-700 dark:text-apple-gray-300 whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-apple-gray-300" />
          <h3 className="text-lg font-medium text-apple-gray-900 dark:text-white mb-2">{t('noEntriesTitle')}</h3>
          <p className="text-apple-gray-500 mb-4">{t('noEntriesDesc')}</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">{t('addEntryBtn')}</button>
        </div>
      )}

      {showAddModal && (
        <Modal title={t('journalModalTitle')} onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">{t('howFeeling')}</label>
              <div className="flex gap-2">
                {moods.map(m => (
                  <button
                    key={m.label}
                    onClick={() => setNewEntry({ ...newEntry, mood: m.emoji })}
                    className={`flex-1 py-2 rounded-apple-lg text-2xl transition-all ${
                      newEntry.mood === m.emoji
                        ? 'bg-accent-primary/10 ring-2 ring-accent-primary'
                        : 'bg-surface-secondary hover:bg-border-primary'
                    }`}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('whatsOnMind')}</label>
              <textarea
                value={newEntry.content}
                onChange={e => setNewEntry({ ...newEntry, content: e.target.value })}
                className="input"
                rows={6}
                placeholder={t('writeThoughts')}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">{tc('cancel')}</button>
              <button onClick={onAdd} className="btn-primary flex-1">{t('saveEntry')}</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-primary border border-border-primary rounded-apple-xl shadow-apple-xl p-6 w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-secondary rounded-apple-lg">
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
