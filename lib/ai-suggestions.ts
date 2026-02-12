export interface Reminder {
  id: string
  title: string
  notes?: string
  dueDate: Date
  priority: 'high' | 'medium' | 'low'
  completed: boolean
}

export interface ReminderSuggestion {
  id: string
  title: string
  description: string
  type: 'time' | 'category' | 'habit' | 'frequency'
  confidence: number
}

export interface ReminderAnalysis {
  tokens: string[]
  timeContext: TimeContext
  suggestedFrequency: Frequency
  category: ReminderCategory
  urgency: Urgency
  suggestedTimes: DateComponents[]
}

type TimeContext = 'morning' | 'afternoon' | 'evening' | 'night' | 'unspecified'
type Frequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'once'
type ReminderCategory = 'work' | 'health' | 'personal' | 'finance' | 'learning' | 'other'
type Urgency = 'high' | 'medium' | 'low'

interface DateComponents {
  hour: number
  minute: number
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'under', 'again', 'further', 'then',
  'once', 'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either',
  'neither', 'not', 'only', 'own', 'same', 'than', 'too', 'very',
  'just', 'also', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
  'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he',
  'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it',
  'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
  'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
  'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
  'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
  'then', 'once'
])

const MORNING_WORDS = ['morning', 'am', 'breakfast', 'wake', 'early', 'sunrise']
const AFTERNOON_WORDS = ['lunch', 'noon', 'afternoon', 'midday']
const EVENING_WORDS = ['evening', 'dinner', 'pm', 'after work', 'sunset', 'dusk']
const NIGHT_WORDS = ['night', 'bedtime', 'sleep', 'midnight', 'late']

const WORK_KEYWORDS = ['meeting', 'call', 'email', 'deadline', 'project', 'work', 'boss', 'presentation', 'client', 'report']
const HEALTH_KEYWORDS = ['exercise', 'gym', 'workout', 'medicine', 'doctor', 'health', 'run', 'walk', 'yoga', 'stretch', 'diet']
const PERSONAL_KEYWORDS = ['birthday', 'anniversary', 'family', 'friend', 'visit', 'gift', 'party', 'celebration']
const FINANCE_KEYWORDS = ['bill', 'pay', 'budget', 'money', 'bank', 'invoice', 'tax', 'expense', 'save']
const LEARNING_KEYWORDS = ['read', 'study', 'learn', 'course', 'book', 'practice', 'tutorial', 'class', 'homework']

const URGENT_KEYWORDS = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'important', 'today', 'now']
const SOON_KEYWORDS = ['soon', 'this week', 'tomorrow', 'end of', 'soon']
const RELAXED_KEYWORDS = ['sometime', 'whenever', 'eventually', 'later', 'eventually']

export class LocalSuggestionEngine {
  private static instance: LocalSuggestionEngine

  static get shared(): LocalSuggestionEngine {
    if (!LocalSuggestionEngine.instance) {
      LocalSuggestionEngine.instance = new LocalSuggestionEngine()
    }
    return LocalSuggestionEngine.instance
  }

  private constructor() {}

  analyzeReminderText(text: string): ReminderAnalysis {
    const tokens = this.tokenize(text)
    const timeContext = this.detectTimeContext(tokens)
    const frequency = this.detectFrequency(tokens)
    const category = this.categorize(text)
    const urgency = this.detectUrgency(text, tokens)

    return {
      tokens,
      timeContext,
      suggestedFrequency: frequency,
      category,
      urgency,
      suggestedTimes: this.generateSuggestedTimes(timeContext, frequency)
    }
  }

  generateSuggestions(reminders: Reminder[]): ReminderSuggestion[] {
    const suggestions: ReminderSuggestion[] = []

    const timePatterns = this.analyzeTimePatterns(reminders)
    const categoryPatterns = this.analyzeCategoryPatterns(reminders)
    const wordFrequency = this.analyzeWordFrequency(reminders)

    if (timePatterns.mostCommonTime && timePatterns.confidence > 0.3) {
      suggestions.push({
        id: crypto.randomUUID(),
        title: 'Optimal Time Detected',
        description: `Based on your patterns, you complete more tasks in the ${timePatterns.mostCommonTime}. Consider scheduling important tasks then.`,
        type: 'time',
        confidence: timePatterns.confidence
      })
    }

    if (categoryPatterns.mostCommonCategory && categoryPatterns.confidence > 0.4) {
      suggestions.push({
        id: crypto.randomUUID(),
        title: 'Work Pattern Detected',
        description: `You often create ${categoryPatterns.mostCommonCategory} reminders. Want to set up a recurring reminder?`,
        type: 'category',
        confidence: categoryPatterns.confidence
      })
    }

    if (wordFrequency.mostCommonWord && wordFrequency.confidence > 0.2 && wordFrequency.commonWords.length > 0) {
      suggestions.push({
        id: crypto.randomUUID(),
        title: 'Habit Opportunity',
        description: `You frequently mention "${wordFrequency.mostCommonWord}". This could be a good daily habit to track.`,
        type: 'habit',
        confidence: wordFrequency.confidence
      })
    }

    const pendingHighPriority = reminders.filter(r => !r.completed && r.priority === 'high')
    if (pendingHighPriority.length > 3) {
      suggestions.push({
        id: crypto.randomUUID(),
        title: 'High Priority Buildup',
        description: `You have ${pendingHighPriority.length} high-priority reminders. Consider breaking some into smaller tasks.`,
        type: 'frequency',
        confidence: Math.min(pendingHighPriority.length / 10, 0.9)
      })
    }

    return suggestions
  }

  suggestOptimalTime(reminder: Reminder): DateComponents | null {
    const analysis = this.analyzeReminderText(reminder.title + ' ' + (reminder.notes || ''))

    switch (analysis.timeContext) {
      case 'morning':
        return { hour: 8, minute: 0 }
      case 'afternoon':
        return { hour: 13, minute: 0 }
      case 'evening':
        return { hour: 18, minute: 0 }
      case 'night':
        return { hour: 21, minute: 0 }
      default:
        return null
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
  }

  private detectTimeContext(tokens: string[]): TimeContext {
    const lowerTokens = tokens.map(t => t.toLowerCase())

    if (lowerTokens.some(t => MORNING_WORDS.includes(t))) {
      return 'morning'
    } else if (lowerTokens.some(t => AFTERNOON_WORDS.includes(t))) {
      return 'afternoon'
    } else if (lowerTokens.some(t => EVENING_WORDS.includes(t))) {
      return 'evening'
    } else if (lowerTokens.some(t => NIGHT_WORDS.includes(t))) {
      return 'night'
    }

    return 'unspecified'
  }

  private detectFrequency(tokens: string[]): Frequency {
    const lowerTokens = tokens.map(t => t.toLowerCase())

    if (lowerTokens.some(t => ['daily', 'every day', 'each day', 'everyday'].includes(t))) {
      return 'daily'
    } else if (lowerTokens.some(t => ['weekly', 'every week', 'each week'].includes(t))) {
      return 'weekly'
    } else if (lowerTokens.some(t => ['monthly', 'every month'].includes(t))) {
      return 'monthly'
    } else if (lowerTokens.some(t => ['hourly', 'every hour'].includes(t))) {
      return 'hourly'
    }

    return 'once'
  }

  private categorize(text: string): ReminderCategory {
    const lower = text.toLowerCase()

    if (WORK_KEYWORDS.some(kw => lower.includes(kw))) {
      return 'work'
    } else if (HEALTH_KEYWORDS.some(kw => lower.includes(kw))) {
      return 'health'
    } else if (PERSONAL_KEYWORDS.some(kw => lower.includes(kw))) {
      return 'personal'
    } else if (FINANCE_KEYWORDS.some(kw => lower.includes(kw))) {
      return 'finance'
    } else if (LEARNING_KEYWORDS.some(kw => lower.includes(kw))) {
      return 'learning'
    }

    return 'other'
  }

  private detectUrgency(text: string, tokens: string[]): Urgency {
    const lower = text.toLowerCase()
    const lowerTokens = tokens.map(t => t.toLowerCase())

    if (URGENT_KEYWORDS.some(kw => lower.includes(kw)) || lowerTokens.some(t => URGENT_KEYWORDS.includes(t))) {
      return 'high'
    } else if (SOON_KEYWORDS.some(kw => lower.includes(kw)) || lowerTokens.some(t => SOON_KEYWORDS.includes(t))) {
      return 'medium'
    } else if (RELAXED_KEYWORDS.some(kw => lower.includes(kw)) || lowerTokens.some(t => RELAXED_KEYWORDS.includes(t))) {
      return 'low'
    }

    return 'medium'
  }

  private generateSuggestedTimes(context: TimeContext, _frequency: Frequency): DateComponents[] {
    switch (context) {
      case 'morning':
        return [{ hour: 8, minute: 0 }, { hour: 9, minute: 30 }]
      case 'afternoon':
        return [{ hour: 13, minute: 0 }, { hour: 15, minute: 0 }]
      case 'evening':
        return [{ hour: 18, minute: 0 }, { hour: 19, minute: 30 }]
      case 'night':
        return [{ hour: 21, minute: 0 }]
      default:
        return [{ hour: 10, minute: 0 }, { hour: 15, minute: 0 }, { hour: 20, minute: 0 }]
    }
  }

  private analyzeTimePatterns(reminders: Reminder[]): TimePatternAnalysis {
    const hourCounts: Record<number, number> = {}

    for (const reminder of reminders) {
      const hour = new Date(reminder.dueDate).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }

    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)

    const total = reminders.length
    const [topHour, topCount] = sortedHours[0] || ['0', 0]
    const confidence = total > 0 ? topCount / total : 0

    let mostCommonTime: string | null = null
    const hourNum = parseInt(topHour)
    if (hourNum >= 6 && hourNum < 12) {
      mostCommonTime = 'morning'
    } else if (hourNum >= 12 && hourNum < 17) {
      mostCommonTime = 'afternoon'
    } else if (hourNum >= 17 && hourNum < 21) {
      mostCommonTime = 'evening'
    } else {
      mostCommonTime = 'night'
    }

    return {
      mostCommonTime,
      hourDistribution: hourCounts,
      confidence
    }
  }

  private analyzeCategoryPatterns(reminders: Reminder[]): CategoryPatternAnalysis {
    const categoryCounts: Record<ReminderCategory, number> = {
      work: 0, health: 0, personal: 0, finance: 0, learning: 0, other: 0
    }

    for (const reminder of reminders) {
      const analysis = this.analyzeReminderText(reminder.title + ' ' + (reminder.notes || ''))
      categoryCounts[analysis.category]++
    }

    const sortedCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)

    const total = reminders.length
    const [topCategory, topCount] = sortedCategories[0] || ['other', 0]
    const confidence = total > 0 ? topCount / total : 0

    return {
      mostCommonCategory: topCategory as ReminderCategory,
      categoryDistribution: categoryCounts,
      confidence
    }
  }

  private analyzeWordFrequency(reminders: Reminder[]): WordFrequencyAnalysis {
    const wordCounts: Record<string, number> = {}

    for (const reminder of reminders) {
      const tokens = this.tokenize(reminder.title + ' ' + (reminder.notes || ''))
      for (const token of tokens) {
        if (!STOP_WORDS.has(token) && token.length > 2) {
          wordCounts[token] = (wordCounts[token] || 0) + 1
        }
      }
    }

    const sortedWords = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)

    const total = reminders.length
    const [topWord, topCount] = sortedWords[0] || ['', 0]
    const commonWords = sortedWords.slice(0, 5).map(([word]) => word)
    const confidence = total > 0 ? topCount / total : 0

    return {
      mostCommonWord: topWord || null,
      commonWords,
      wordDistribution: wordCounts,
      confidence
    }
  }
}

interface TimePatternAnalysis {
  mostCommonTime: string | null
  hourDistribution: Record<number, number>
  confidence: number
}

interface CategoryPatternAnalysis {
  mostCommonCategory: ReminderCategory | null
  categoryDistribution: Record<ReminderCategory, number>
  confidence: number
}

interface WordFrequencyAnalysis {
  mostCommonWord: string | null
  commonWords: string[]
  wordDistribution: Record<string, number>
  confidence: number
}

export const localSuggestionEngine = LocalSuggestionEngine.shared
